
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    Printer,
    ArrowLeft,
    X,
} from "lucide-react";
import "./QuotationsPage.css";

type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

interface Ingredient {
    id?: string;
    name: string;
    category?: string;
    unit: string;
    supplier?: string;
    price: number;
}

interface RecipeIngredient {
    ingredientName: string;
    quantity: number;
}

interface Recipe {
    id: string;
    name: string;
    category: string;
    servings: number;
    notes?: string;
    ingredients: RecipeIngredient[];
    createdAt?: string;
}

interface ServingStandard {
    recipeId: string;
    bufferPercentage: number;
}

type MenuItem = {
    id: number;
    name: string;
    quantity: number;
    rate: number;
    recipeId?: string;
};

type Quotation = {
    id: number;
    quotationNumber: string;
    customerName: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue: string;
    guests: number;
    notes: string;
    items: MenuItem[];
    status: QuotationStatus;
    createdAt: string;
};

type QuotationForm = {
    customerName: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue: string;
    guests: string;
    notes: string;
    items: MenuItem[];
};

interface IngredientCostDetail {
    ingredientName: string;
    requiredQuantity: number;
    unit: string;
    unitPrice: number;
    totalCost: number;
    priceAvailable: boolean;
}

interface RecipeCostDetail {
    recipeName: string;
    bufferPercentage: number;
    ingredients: IngredientCostDetail[];
    totalCost: number;
    complete: boolean;
}

const STORAGE_KEY = "mealmate_quotations";
const INGREDIENTS_KEY = "mealmate_ingredients";
const RECIPES_KEY = "mealmate_recipes";
const STANDARDS_KEY = "mealmate_serving_standards";

const emptyForm: QuotationForm = {
    customerName: "",
    phone: "",
    eventType: "",
    eventDate: "",
    venue: "",
    guests: "",
    notes: "",
    items: [{ id: Date.now(), name: "", quantity: 1, rate: 0 }],
};

const statuses: QuotationStatus[] = [
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function readStorage<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) as T : fallback;
    } catch {
        return fallback;
    }
}

function QuotationsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>(() =>
        readStorage<Quotation[]>(STORAGE_KEY, [])
    );

    const [ingredients] = useState<Ingredient[]>(() =>
        readStorage<Ingredient[]>(INGREDIENTS_KEY, [])
    );

    const [recipes] = useState<Recipe[]>(() =>
        readStorage<Recipe[]>(RECIPES_KEY, [])
    );

    const [servingStandards] = useState<ServingStandard[]>(() =>
        readStorage<ServingStandard[]>(STANDARDS_KEY, [])
    );

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [formData, setFormData] = useState<QuotationForm>(emptyForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [error, setError] = useState("");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
    }, [quotations]);

    const getTotal = (items: MenuItem[]) =>
        items.reduce(
            (total, item) => total + item.quantity * item.rate,
            0
        );

    // Find the configured buffer for a recipe.
    const getBuffer = (recipeId: string) => {
        const standard = servingStandards.find(
            (item) => item.recipeId === recipeId
        );

        return standard?.bufferPercentage ?? 10;
    };

    // Calculate the ingredient requirements and food cost for a recipe.
    const getRecipeCost = (
        recipeId: string,
        servingsRequired: number
    ): RecipeCostDetail | null => {
        const recipe = recipes.find((item) => item.id === recipeId);

        if (!recipe || !recipe.servings || recipe.servings <= 0) {
            return null;
        }

        const buffer = getBuffer(recipeId);

        const ingredientDetails: IngredientCostDetail[] =
            recipe.ingredients.map((recipeIngredient) => {
                const matchedIngredient = ingredients.find(
                    (ingredient) =>
                        ingredient.name.trim().toLowerCase() ===
                        recipeIngredient.ingredientName.trim().toLowerCase()
                );

                const requiredQuantity =
                    (recipeIngredient.quantity / recipe.servings) *
                    servingsRequired *
                    (1 + buffer / 100);

                const priceAvailable =
                    matchedIngredient !== undefined &&
                    Number.isFinite(matchedIngredient.price);

                const unitPrice = priceAvailable
                    ? matchedIngredient.price
                    : 0;

                return {
                    ingredientName: recipeIngredient.ingredientName,
                    requiredQuantity,
                    unit: matchedIngredient?.unit ?? "",
                    unitPrice,
                    totalCost: requiredQuantity * unitPrice,
                    priceAvailable,
                };
            });

        const complete = ingredientDetails.every(
            (item) => item.priceAvailable
        );

        return {
            recipeName: recipe.name,
            bufferPercentage: buffer,
            ingredients: ingredientDetails,
            totalCost: ingredientDetails.reduce(
                (total, item) => total + item.totalCost,
                0
            ),
            complete,
        };
    };

    // Cost details for one quotation menu item.
    const getMenuItemCost = (item: MenuItem) => {
        if (!item.recipeId) return null;

        return getRecipeCost(item.recipeId, item.quantity);
    };

    // Aggregate food cost across quotation items.
    const getQuotationCost = (items: MenuItem[]) => {
        const linkedItems = items.filter((item) => item.recipeId);

        const details = linkedItems.map((item) => ({
            item,
            cost: getMenuItemCost(item),
        }));

        const totalCost = details.reduce(
            (total, entry) => total + (entry.cost?.totalCost ?? 0),
            0
        );

        const complete =
            linkedItems.length > 0 &&
            details.every((entry) => entry.cost?.complete);

        const unlinkedCount = items.filter(
            (item) => !item.recipeId
        ).length;

        return {
            details,
            totalCost,
            complete,
            unlinkedCount,
            linkedCount: linkedItems.length,
        };
    };

    const totalQuotations = quotations.length;

    const acceptedQuotations = quotations.filter(
        (q) => q.status === "Accepted"
    ).length;

    const pendingQuotations = quotations.filter(
        (q) => q.status === "Draft" || q.status === "Sent"
    ).length;

    const totalBusinessValue = quotations
        .filter((q) => q.status === "Accepted")
        .reduce((total, q) => total + getTotal(q.items), 0);

    const filteredQuotations = useMemo(() => {
        return quotations.filter((q) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                q.customerName.toLowerCase().includes(search) ||
                q.quotationNumber.toLowerCase().includes(search) ||
                q.phone.includes(search);

            const matchesStatus =
                statusFilter === "All" || q.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [quotations, searchTerm, statusFilter]);

    const selectedQuotation = quotations.find(
        (q) => q.id === selectedId
    );

    const resetForm = () => {
        setFormData({
            ...emptyForm,
            items: [{ id: Date.now(), name: "", quantity: 1, rate: 0 }],
        });
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleCreate = () => {
        setSelectedId(null);
        setEditingId(null);
        setFormData({
            ...emptyForm,
            items: [{ id: Date.now(), name: "", quantity: 1, rate: 0 }],
        });
        setError("");
        setShowForm(true);
    };

    const updateField = (
        field: keyof Omit<QuotationForm, "items">,
        value: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
        setError("");
    };

    const addMenuItem = () => {
        setFormData((previous) => ({
            ...previous,
            items: [
                ...previous.items,
                {
                    id: Date.now() + previous.items.length,
                    name: "",
                    quantity: 1,
                    rate: 0,
                },
            ],
        }));
    };

    const updateMenuItem = (
        id: number,
        field: "name" | "quantity" | "rate",
        value: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            items: previous.items.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [field]:
                            field === "name" ? value : Number(value),
                    }
                    : item
            ),
        }));

        setError("");
    };

    const selectRecipe = (id: number, recipeId: string) => {
        const recipe = recipes.find((item) => item.id === recipeId);

        setFormData((previous) => ({
            ...previous,
            items: previous.items.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        recipeId: recipeId || undefined,
                        name: recipe ? recipe.name : item.name,
                    }
                    : item
            ),
        }));

        setError("");
    };

    const removeMenuItem = (id: number) => {
        setFormData((previous) => ({
            ...previous,
            items: previous.items.filter((item) => item.id !== id),
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const guests = Number(formData.guests);

        if (
            !formData.customerName.trim() ||
            !formData.phone.trim() ||
            !formData.eventType ||
            !formData.eventDate ||
            !formData.venue.trim()
        ) {
            setError("Please complete all customer and event details.");
            return;
        }

        if (!Number.isInteger(guests) || guests <= 0) {
            setError("Please enter a valid number of guests.");
            return;
        }

        if (formData.items.length === 0) {
            setError("Please add at least one menu item.");
            return;
        }

        const invalidItem = formData.items.some(
            (item) =>
                !item.name.trim() ||
                !Number.isInteger(item.quantity) ||
                !Number.isFinite(item.rate) ||
                item.quantity <= 0 ||
                item.rate <= 0
        );

        if (invalidItem) {
            setError(
                "Each menu item needs a name, a valid whole-number quantity and a selling rate greater than zero."
            );
            return;
        }

        const cleanedItems = formData.items.map((item) => ({
            ...item,
            name: item.name.trim(),
        }));

        if (editingId !== null) {
            setQuotations((previous) =>
                previous.map((q) =>
                    q.id === editingId
                        ? {
                            ...q,
                            customerName: formData.customerName.trim(),
                            phone: formData.phone.trim(),
                            eventType: formData.eventType,
                            eventDate: formData.eventDate,
                            venue: formData.venue.trim(),
                            guests,
                            notes: formData.notes.trim(),
                            items: cleanedItems,
                        }
                        : q
                )
            );

            setSelectedId(editingId);
        } else {
            const newQuotation: Quotation = {
                id: Date.now(),
                quotationNumber: `MM-${Date.now().toString().slice(-8)}`,
                customerName: formData.customerName.trim(),
                phone: formData.phone.trim(),
                eventType: formData.eventType,
                eventDate: formData.eventDate,
                venue: formData.venue.trim(),
                guests,
                notes: formData.notes.trim(),
                items: cleanedItems,
                status: "Draft",
                createdAt: new Date().toISOString(),
            };

            setQuotations((previous) => [newQuotation, ...previous]);
            setSelectedId(newQuotation.id);
        }

        resetForm();
    };

    const handleEdit = (quotation: Quotation) => {
        setFormData({
            customerName: quotation.customerName,
            phone: quotation.phone,
            eventType: quotation.eventType,
            eventDate: quotation.eventDate,
            venue: quotation.venue,
            guests: String(quotation.guests),
            notes: quotation.notes,
            items: quotation.items.map((item) => ({ ...item })),
        });

        setEditingId(quotation.id);
        setSelectedId(null);
        setShowForm(true);
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (quotation: Quotation) => {
        const confirmed = window.confirm(
            `Delete quotation ${quotation.quotationNumber} for ${quotation.customerName}?`
        );

        if (!confirmed) return;

        setQuotations((previous) =>
            previous.filter((q) => q.id !== quotation.id)
        );

        if (selectedId === quotation.id) {
            setSelectedId(null);
        }

        if (editingId === quotation.id) {
            resetForm();
        }
    };

    const updateStatus = (id: number, status: QuotationStatus) => {
        setQuotations((previous) =>
            previous.map((q) =>
                q.id === id ? { ...q, status } : q
            )
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="quotations-page">

            <div className="quotations-heading no-print">
                <div>
                    <h2>Quotations Management</h2>
                    <p>Create and manage customer catering quotations.</p>
                </div>

                <button
                    className="create-quotation-btn"
                    onClick={handleCreate}
                >
                    <Plus size={18} />
                    Create Quotation
                </button>
            </div>

            <div className="quotation-summary no-print">
                <div className="quotation-stat-card">
                    <span>Total Quotations</span>
                    <h3>{totalQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Pending Quotations</span>
                    <h3>{pendingQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Accepted Quotations</span>
                    <h3>{acceptedQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Accepted Business Value</span>
                    <h3>{formatCurrency(totalBusinessValue)}</h3>
                </div>
            </div>

            {/* CREATE / EDIT FORM */}
            {showForm && (
                <div className="quotation-form-section no-print">
                    <div className="section-title-row">
                        <h3>
                            {editingId !== null
                                ? "Edit Quotation"
                                : "Create New Quotation"}
                        </h3>

                        <button
                            type="button"
                            className="close-form-btn"
                            onClick={resetForm}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h4>Customer Information</h4>

                        <div className="quotation-form-grid">
                            <div className="quotation-form-group">
                                <label>Customer Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter customer name"
                                    value={formData.customerName}
                                    onChange={(e) =>
                                        updateField("customerName", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Contact Number *</label>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        updateField("phone", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Type *</label>
                                <select
                                    value={formData.eventType}
                                    onChange={(e) =>
                                        updateField("eventType", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select Event Type</option>
                                    <option value="Wedding">Wedding</option>
                                    <option value="Birthday">Birthday</option>
                                    <option value="Corporate Event">Corporate Event</option>
                                    <option value="Engagement">Engagement</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Private Party">Private Party</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Date *</label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) =>
                                        updateField("eventDate", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Venue *</label>
                                <input
                                    type="text"
                                    placeholder="Enter event venue"
                                    value={formData.venue}
                                    onChange={(e) =>
                                        updateField("venue", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Number of Guests *</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter guest count"
                                    value={formData.guests}
                                    onChange={(e) =>
                                        updateField("guests", e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* MENU AND RECIPE SELECTION */}
                        <div className="menu-items-heading">
                            <div>
                                <h4>Menu, Recipe & Pricing Details</h4>
                                <p>
                                    Select a saved recipe to calculate food
                                    requirements and estimated ingredient costs.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="add-menu-item-btn"
                                onClick={addMenuItem}
                            >
                                <Plus size={16} />
                                Add Menu Item
                            </button>
                        </div>

                        {recipes.length === 0 && (
                            <p style={{
                                color: "#b45309",
                                background: "#fffbeb",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                marginBottom: "14px",
                            }}>
                                No recipes found. Add recipes in Recipe Costing
                                to enable automatic food-cost calculations.
                            </p>
                        )}

                        <div className="menu-item-list">
                            {formData.items.map((item, index) => {
                                const cost = getMenuItemCost(item);

                                return (
                                    <div className="menu-item-row" key={item.id}>
                                        <div className="menu-item-name">
                                            <label>Menu Item {index + 1}</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Paneer Tikka"
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateMenuItem(
                                                        item.id,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div style={{ minWidth: "150px" }}>
                                            <label>Link Recipe</label>
                                            <select
                                                value={item.recipeId ?? ""}
                                                onChange={(e) =>
                                                    selectRecipe(item.id, e.target.value)
                                                }
                                            >
                                                <option value="">Manual / No Recipe</option>
                                                {recipes.map((recipe) => (
                                                    <option
                                                        key={recipe.id}
                                                        value={recipe.id}
                                                    >
                                                        {recipe.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label>Quantity / Plates</label>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateMenuItem(
                                                        item.id,
                                                        "quantity",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label>Selling Rate (₹)</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.rate || ""}
                                                placeholder="Enter rate"
                                                onChange={(e) =>
                                                    updateMenuItem(
                                                        item.id,
                                                        "rate",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="menu-item-total">
                                            <label>Selling Amount</label>
                                            <strong>
                                                {formatCurrency(item.quantity * item.rate)}
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            className="remove-menu-item-btn"
                                            onClick={() => removeMenuItem(item.id)}
                                            disabled={formData.items.length === 1}
                                            title="Remove menu item"
                                        >
                                            <Trash2 size={17} />
                                        </button>

                                        {item.recipeId && (
                                            <div style={{
                                                gridColumn: "1 / -1",
                                                fontSize: "13px",
                                                color: cost?.complete ? "#15803d" : "#b45309",
                                                padding: "4px 0",
                                            }}>
                                                {cost
                                                    ? cost.complete
                                                        ? `Estimated food cost: ${formatCurrency(cost.totalCost)} | Buffer: ${cost.bufferPercentage}%`
                                                        : "Some ingredient prices are missing. Check Ingredient Pricing."
                                                    : "Recipe details could not be loaded."}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="quotation-form-total">
                            <span>Quotation Selling Total</span>
                            <strong>
                                {formatCurrency(getTotal(formData.items))}
                            </strong>
                        </div>

                        {/* COSTING SUMMARY */}
                        {(() => {
                            const costing = getQuotationCost(formData.items);
                            const sellingTotal = getTotal(formData.items);
                            const profit = sellingTotal - costing.totalCost;
                            const foodCostPercentage = sellingTotal > 0
                                ? (costing.totalCost / sellingTotal) * 100
                                : 0;

                            return (
                                <div style={{
                                    marginTop: "18px",
                                    padding: "16px",
                                    border: "1px solid var(--border-color, #e5e7eb)",
                                    borderRadius: "10px",
                                }}>
                                    <h4 style={{ marginTop: 0 }}>
                                        Estimated Cost & Profit Analysis
                                    </h4>

                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                        gap: "14px",
                                    }}>
                                        <div>
                                            <small>Estimated Food Cost</small>
                                            <h3>{formatCurrency(costing.totalCost)}</h3>
                                        </div>
                                        <div>
                                            <small>Selling Value</small>
                                            <h3>{formatCurrency(sellingTotal)}</h3>
                                        </div>
                                        <div>
                                            <small>Estimated Contribution</small>
                                            <h3 style={{
                                                color: profit >= 0 ? "#15803d" : "#dc2626",
                                            }}>
                                                {formatCurrency(profit)}
                                            </h3>
                                        </div>
                                        <div>
                                            <small>Food Cost Percentage</small>
                                            <h3>{foodCostPercentage.toFixed(1)}%</h3>
                                        </div>
                                    </div>

                                    {costing.unlinkedCount > 0 && (
                                        <p style={{
                                            color: "#b45309",
                                            fontSize: "13px",
                                            marginBottom: 0,
                                        }}>
                                            {costing.unlinkedCount} menu item(s) are
                                            not linked to recipes. The food-cost
                                            estimate is incomplete.
                                        </p>
                                    )}

                                    {costing.linkedCount > 0 && !costing.complete && (
                                        <p style={{
                                            color: "#b45309",
                                            fontSize: "13px",
                                            marginBottom: 0,
                                        }}>
                                            Some linked recipes have ingredients
                                            without a matching price. Update
                                            Ingredient Pricing for a complete estimate.
                                        </p>
                                    )}

                                    {costing.linkedCount === 0 && (
                                        <p style={{
                                            color: "#6b7280",
                                            fontSize: "13px",
                                            marginBottom: 0,
                                        }}>
                                            Link recipes to menu items to calculate
                                            estimated food cost and contribution.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="quotation-form-group notes-group">
                            <label>Additional Notes</label>
                            <textarea
                                rows={3}
                                placeholder="Enter additional requirements or terms..."
                                value={formData.notes}
                                onChange={(e) =>
                                    updateField("notes", e.target.value)
                                }
                            />
                        </div>

                        {error && (
                            <p className="quotation-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="quotation-form-actions">
                            <button
                                type="button"
                                className="quotation-cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="create-quotation-btn"
                            >
                                {editingId !== null
                                    ? "Update Quotation"
                                    : "Save Quotation"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SELECTED QUOTATION DETAILS */}
            {selectedQuotation && !showForm && (
                <div className="quotation-detail-section">
                    <div className="detail-actions no-print">
                        <button
                            className="back-to-list-btn"
                            onClick={() => setSelectedId(null)}
                        >
                            <ArrowLeft size={16} />
                            Back to Quotations
                        </button>

                        <div>
                            <button
                                className="detail-edit-btn"
                                onClick={() => handleEdit(selectedQuotation)}
                            >
                                <Pencil size={16} />
                                Edit
                            </button>

                            <button
                                className="detail-print-btn"
                                onClick={handlePrint}
                            >
                                <Printer size={16} />
                                Print
                            </button>
                        </div>
                    </div>

                    <div className="quotation-print-area">
                        <div className="print-header">
                            <h1>MEALMATE</h1>
                            <p>Catering & Event Management</p>
                            <h2>CUSTOMER QUOTATION</h2>
                        </div>

                        <div className="print-quotation-meta">
                            <div>
                                <span>Quotation Number</span>
                                <strong>{selectedQuotation.quotationNumber}</strong>
                            </div>

                            <div>
                                <span>Created On</span>
                                <strong>
                                    {formatDate(selectedQuotation.createdAt.slice(0, 10))}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>{selectedQuotation.status}</strong>
                            </div>
                        </div>

                        <h3>Customer & Event Details</h3>

                        <div className="print-customer-grid">
                            <p><span>Customer:</span>{selectedQuotation.customerName}</p>
                            <p><span>Contact:</span>{selectedQuotation.phone}</p>
                            <p><span>Event:</span>{selectedQuotation.eventType}</p>
                            <p><span>Date:</span>{formatDate(selectedQuotation.eventDate)}</p>
                            <p><span>Venue:</span>{selectedQuotation.venue}</p>
                            <p><span>Guests:</span>{selectedQuotation.guests}</p>
                        </div>

                        <h3>Menu & Price Details</h3>

                        <div className="table-wrapper">
                            <table className="quotation-detail-table">
                                <thead>
                                    <tr>
                                        <th>Menu Item</th>
                                        <th>Quantity</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedQuotation.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.rate)}</td>
                                            <td>
                                                {formatCurrency(item.quantity * item.rate)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="print-grand-total">
                            <span>Grand Total</span>
                            <strong>
                                {formatCurrency(getTotal(selectedQuotation.items))}
                            </strong>
                        </div>

                        {/* INGREDIENT-WISE COST BREAKDOWN */}
                        {(() => {
                            const costing = getQuotationCost(selectedQuotation.items);
                            const sellingTotal = getTotal(selectedQuotation.items);
                            const profit = sellingTotal - costing.totalCost;
                            const percentage = sellingTotal > 0
                                ? (costing.totalCost / sellingTotal) * 100
                                : 0;

                            if (costing.linkedCount === 0) return null;

                            return (
                                <div style={{ marginTop: "28px" }}>
                                    <h3>Estimated Food Cost Breakdown</h3>

                                    {costing.details.map(({ item, cost }) => (
                                        <div key={item.id} style={{
                                            marginBottom: "18px",
                                            breakInside: "avoid",
                                        }}>
                                            <h4>
                                                {item.name} — {item.quantity} plates
                                            </h4>

                                            {cost ? (
                                                <>
                                                    <p style={{ fontSize: "13px" }}>
                                                        Recipe: {cost.recipeName} |
                                                        Buffer: {cost.bufferPercentage}%
                                                    </p>

                                                    <div className="table-wrapper">
                                                        <table className="quotation-detail-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Ingredient</th>
                                                                    <th>Required Quantity</th>
                                                                    <th>Unit Price</th>
                                                                    <th>Cost</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {cost.ingredients.map((ingredient, index) => (
                                                                    <tr key={`${ingredient.ingredientName}-${index}`}>
                                                                        <td>{ingredient.ingredientName}</td>
                                                                        <td>
                                                                            {ingredient.requiredQuantity.toFixed(3)}
                                                                            {" "}{ingredient.unit}
                                                                        </td>
                                                                        <td>
                                                                            {ingredient.priceAvailable
                                                                                ? formatCurrency(ingredient.unitPrice)
                                                                                : "Price unavailable"}
                                                                        </td>
                                                                        <td>
                                                                            {ingredient.priceAvailable
                                                                                ? formatCurrency(ingredient.totalCost)
                                                                                : "—"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <p>
                                                        <strong>
                                                            Estimated recipe cost: {formatCurrency(cost.totalCost)}
                                                        </strong>
                                                    </p>

                                                    {!cost.complete && (
                                                        <p style={{ color: "#b45309" }}>
                                                            Some ingredient prices are missing.
                                                            This recipe cost is incomplete.
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p>Recipe costing information unavailable.</p>
                                            )}
                                        </div>
                                    ))}

                                    <div style={{
                                        borderTop: "1px solid #ddd",
                                        paddingTop: "14px",
                                        marginTop: "16px",
                                    }}>
                                        <p>
                                            <strong>
                                                Estimated Food Cost: {formatCurrency(costing.totalCost)}
                                            </strong>
                                        </p>
                                        <p>
                                            <strong>
                                                Selling Value: {formatCurrency(sellingTotal)}
                                            </strong>
                                        </p>
                                        <p>
                                            <strong>
                                                Estimated Contribution: {formatCurrency(profit)}
                                            </strong>
                                        </p>
                                        <p>
                                            <strong>
                                                Food Cost Percentage: {percentage.toFixed(1)}%
                                            </strong>
                                        </p>

                                        {(costing.unlinkedCount > 0 || !costing.complete) && (
                                            <p style={{ color: "#b45309", fontSize: "13px" }}>
                                                Note: This estimate is incomplete because
                                                some menu items are not linked to recipes
                                                or some ingredient prices are unavailable.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {selectedQuotation.notes && (
                            <div className="print-notes">
                                <h3>Additional Notes</h3>
                                <p>{selectedQuotation.notes}</p>
                            </div>
                        )}

                        <div className="print-footer">
                            <p>Thank you for considering MealMate!</p>
                            <p>We look forward to serving you.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* QUOTATIONS LIST */}
            {!selectedQuotation && !showForm && (
                <div className="quotation-list-section no-print">
                    <div className="quotation-list-heading">
                        <h3>All Quotations</h3>
                        <span>{filteredQuotations.length} Records</span>
                    </div>

                    <div className="quotation-filters">
                        <div className="quotation-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search customer or quotation number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filteredQuotations.length === 0 ? (
                        <div className="quotation-empty-state">
                            <h3>No Quotations Found</h3>
                            <p>
                                {quotations.length === 0
                                    ? "Create your first customer quotation to get started."
                                    : "Try changing your search or status filter."}
                            </p>

                            {quotations.length === 0 && (
                                <button
                                    className="create-quotation-btn"
                                    onClick={handleCreate}
                                >
                                    <Plus size={17} />
                                    Create First Quotation
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="quotations-table">
                                <thead>
                                    <tr>
                                        <th>Quotation ID</th>
                                        <th>Customer</th>
                                        <th>Event Date</th>
                                        <th>Guests</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredQuotations.map((quotation) => (
                                        <tr key={quotation.id}>
                                            <td className="quotation-id">
                                                {quotation.quotationNumber}
                                            </td>

                                            <td>
                                                <strong>{quotation.customerName}</strong>
                                                <small>{quotation.phone}</small>
                                            </td>

                                            <td>{formatDate(quotation.eventDate)}</td>
                                            <td>{quotation.guests}</td>

                                            <td className="quotation-amount">
                                                {formatCurrency(getTotal(quotation.items))}
                                            </td>

                                            <td>
                                                <select
                                                    className={`status-select status-${quotation.status.toLowerCase()}`}
                                                    value={quotation.status}
                                                    onChange={(e) =>
                                                        updateStatus(
                                                            quotation.id,
                                                            e.target.value as QuotationStatus
                                                        )
                                                    }
                                                >
                                                    {statuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <div className="quotation-row-actions">
                                                    <button
                                                        title="View"
                                                        onClick={() => setSelectedId(quotation.id)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    <button
                                                        title="Edit"
                                                        onClick={() => handleEdit(quotation)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        title="Delete"
                                                        className="row-delete-btn"
                                                        onClick={() => handleDelete(quotation)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default QuotationsPage;
