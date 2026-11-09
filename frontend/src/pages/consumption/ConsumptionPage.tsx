
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import "./ConsumptionPage.css";

interface Ingredient {
    id: string;
    name: string;
    category: string;
    unit: string;
    supplier: string;
    price: number;
}

interface ConsumptionRecord {
    id: string;
    eventName: string;
    eventDate: string;
    ingredientId: string;
    ingredientName: string;
    unit: string;
    price: number;
    plannedQty: number;
    actualQty: number;
    wastedQty: number;
    notes: string;
    quotationId?: number;
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
    ingredients: RecipeIngredient[];
}

interface ServingStandard {
    recipeId: string;
    bufferPercentage: number;
}

interface QuotationMenuItem {
    id: number;
    name: string;
    quantity: number;
    rate: number;
    recipeId?: string;
}

interface Quotation {
    id: number;
    quotationNumber: string;
    customerName: string;
    eventType: string;
    eventDate: string;
    venue: string;
    guests: number;
    items: QuotationMenuItem[];
    status: "Draft" | "Sent" | "Accepted" | "Rejected";
}

const INGREDIENTS_KEY = "mealmate_ingredients";
const CONSUMPTION_KEY = "mealmate_consumption";
const QUOTATIONS_KEY = "mealmate_quotations";
const RECIPES_KEY = "mealmate_recipes";
const STANDARDS_KEY = "mealmate_serving_standards";

function readStorage<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) as T : fallback;
    } catch {
        return fallback;
    }
}

function ConsumptionPage() {
    const [ingredients] = useState<Ingredient[]>(() =>
        readStorage<Ingredient[]>(INGREDIENTS_KEY, [])
    );

    const [records, setRecords] = useState<ConsumptionRecord[]>(() =>
        readStorage<ConsumptionRecord[]>(CONSUMPTION_KEY, [])
    );

    const [quotations] = useState<Quotation[]>(() =>
        readStorage<Quotation[]>(QUOTATIONS_KEY, [])
    );

    const [recipes] = useState<Recipe[]>(() =>
        readStorage<Recipe[]>(RECIPES_KEY, [])
    );

    const [servingStandards] = useState<ServingStandard[]>(() =>
        readStorage<ServingStandard[]>(STANDARDS_KEY, [])
    );

    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedQuotationId, setSelectedQuotationId] = useState("");
    const [quotationError, setQuotationError] = useState("");
    const [quotationSuccess, setQuotationSuccess] = useState("");

    const [form, setForm] = useState({
        eventName: "",
        eventDate: "",
        ingredientId: "",
        plannedQty: "",
        actualQty: "",
        wastedQty: "0",
        notes: "",
    });

    useEffect(() => {
        localStorage.setItem(CONSUMPTION_KEY, JSON.stringify(records));
    }, [records]);

    const selectedIngredient = ingredients.find(
        (ingredient) =>
            String(ingredient.id) === String(form.ingredientId)
    );

    const planned = Number(form.plannedQty) || 0;
    const actual = Number(form.actualQty) || 0;
    const wasted = Number(form.wastedQty) || 0;
    const unitPrice = selectedIngredient?.price || 0;

    const excess = Math.max(actual - planned, 0);
    const unusedPlanned = Math.max(planned - actual, 0);
    const estimatedCost = actual * unitPrice;
    const estimatedWasteCost = wasted * unitPrice;

    const acceptedQuotations = quotations.filter(
        (quotation) => quotation.status === "Accepted"
    );

    const selectedQuotation = quotations.find(
        (quotation) =>
            String(quotation.id) === selectedQuotationId
    );

    const resetForm = () => {
        setForm({
            eventName: "",
            eventDate: "",
            ingredientId: "",
            plannedQty: "",
            actualQty: "",
            wastedQty: "0",
            notes: "",
        });
        setEditingId(null);
    };

    // Generate planned consumption from an accepted quotation.
    const generateFromQuotation = () => {
        setQuotationError("");
        setQuotationSuccess("");

        if (!selectedQuotation) {
            setQuotationError("Please select an accepted quotation.");
            return;
        }

        const aggregatedIngredients = new Map<
            string,
            {
                ingredient: Ingredient;
                quantity: number;
            }
        >();

        let linkedRecipeCount = 0;
        const missingRecipes: string[] = [];
        const missingIngredients: string[] = [];

        for (const menuItem of selectedQuotation.items) {
            if (!menuItem.recipeId) continue;

            const recipe = recipes.find(
                (item) => item.id === menuItem.recipeId
            );

            if (!recipe || !recipe.servings || recipe.servings <= 0) {
                missingRecipes.push(menuItem.name);
                continue;
            }

            linkedRecipeCount++;

            const standard = servingStandards.find(
                (item) => item.recipeId === recipe.id
            );

            const buffer = standard?.bufferPercentage ?? 10;

            for (const recipeIngredient of recipe.ingredients) {
                const matchedIngredient = ingredients.find(
                    (ingredient) =>
                        ingredient.name.trim().toLowerCase() ===
                        recipeIngredient.ingredientName.trim().toLowerCase()
                );

                if (!matchedIngredient) {
                    missingIngredients.push(
                        recipeIngredient.ingredientName
                    );
                    continue;
                }

                const requiredQuantity =
                    (recipeIngredient.quantity / recipe.servings) *
                    menuItem.quantity *
                    (1 + buffer / 100);

                const existing = aggregatedIngredients.get(
                    String(matchedIngredient.id)
                );

                if (existing) {
                    existing.quantity += requiredQuantity;
                } else {
                    aggregatedIngredients.set(
                        String(matchedIngredient.id),
                        {
                            ingredient: matchedIngredient,
                            quantity: requiredQuantity,
                        }
                    );
                }
            }
        }

        if (linkedRecipeCount === 0) {
            setQuotationError(
                "This quotation has no valid linked recipes. Link recipes to its menu items first."
            );
            return;
        }

        if (missingRecipes.length > 0 || missingIngredients.length > 0) {
            const messages: string[] = [];

            if (missingRecipes.length > 0) {
                messages.push(
                    `Recipe not found for: ${missingRecipes.join(", ")}.`
                );
            }

            if (missingIngredients.length > 0) {
                messages.push(
                    `Add these ingredients to Ingredient Pricing: ${[
                        ...new Set(missingIngredients),
                    ].join(", ")}.`
                );
            }

            setQuotationError(messages.join(" "));
            return;
        }

        const plannedRecords: ConsumptionRecord[] = Array.from(
            aggregatedIngredients.values()
        ).map(({ ingredient, quantity }) => ({
            id: crypto.randomUUID(),
            eventName: `${selectedQuotation.customerName} - ${selectedQuotation.quotationNumber}`,
            eventDate: selectedQuotation.eventDate,
            ingredientId: String(ingredient.id),
            ingredientName: ingredient.name,
            unit: ingredient.unit,
            price: ingredient.price,
            plannedQty: Number(quantity.toFixed(4)),
            actualQty: 0,
            wastedQty: 0,
            notes: `Planned consumption generated from quotation ${selectedQuotation.quotationNumber}.`,
            quotationId: selectedQuotation.id,
        }));

        if (plannedRecords.length === 0) {
            setQuotationError(
                "No ingredient requirements could be generated."
            );
            return;
        }

        const existingForQuotation = records.some(
            (record) => record.quotationId === selectedQuotation.id
        );

        if (existingForQuotation) {
            const confirmed = window.confirm(
                "Consumption records already exist for this quotation. Generate another set? This may create duplicate records."
            );

            if (!confirmed) return;
        }

        setRecords((previous) => [
            ...plannedRecords,
            ...previous,
        ]);

        setQuotationSuccess(
            `${plannedRecords.length} planned ingredient records generated successfully for ${selectedQuotation.quotationNumber}.`
        );

        setSelectedQuotationId("");
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedIngredient) {
            alert("Please select an ingredient.");
            return;
        }

        if (
            !Number.isFinite(planned) ||
            !Number.isFinite(actual) ||
            !Number.isFinite(wasted) ||
            planned <= 0 ||
            actual < 0 ||
            wasted < 0
        ) {
            alert("Please enter valid quantities.");
            return;
        }

        if (wasted > actual) {
            alert("Wastage cannot be greater than actual consumption.");
            return;
        }

        const record: ConsumptionRecord = {
            id: editingId || crypto.randomUUID(),
            eventName: form.eventName.trim(),
            eventDate: form.eventDate,
            ingredientId: String(selectedIngredient.id),
            ingredientName: selectedIngredient.name,
            unit: selectedIngredient.unit,
            price: selectedIngredient.price,
            plannedQty: planned,
            actualQty: actual,
            wastedQty: wasted,
            notes: form.notes.trim(),
        };

        if (editingId) {
            setRecords((previous) =>
                previous.map((item) =>
                    item.id === editingId ? record : item
                )
            );
        } else {
            setRecords((previous) => [record, ...previous]);
        }

        resetForm();
    };

    const handleEdit = (record: ConsumptionRecord) => {
        setEditingId(record.id);

        setForm({
            eventName: record.eventName,
            eventDate: record.eventDate,
            ingredientId: String(record.ingredientId),
            plannedQty: String(record.plannedQty),
            actualQty: String(record.actualQty),
            wastedQty: String(record.wastedQty),
            notes: record.notes,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (id: string) => {
        if (
            window.confirm(
                "Are you sure you want to delete this record?"
            )
        ) {
            setRecords((previous) =>
                previous.filter((item) => item.id !== id)
            );

            if (editingId === id) {
                resetForm();
            }
        }
    };

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                record.eventName.toLowerCase().includes(searchText) ||
                record.ingredientName.toLowerCase().includes(searchText);

            const matchesDate =
                !dateFilter || record.eventDate === dateFilter;

            return matchesSearch && matchesDate;
        });
    }, [records, search, dateFilter]);

    const totalConsumptionCost = records.reduce(
        (total, record) =>
            total + record.actualQty * record.price,
        0
    );

    const totalWasteCost = records.reduce(
        (total, record) =>
            total + record.wastedQty * record.price,
        0
    );

    const totalWasteQuantity = records.reduce(
        (total, record) => total + record.wastedQty,
        0
    );

    const totalExcess = records.reduce(
        (total, record) =>
            total + Math.max(record.actualQty - record.plannedQty, 0),
        0
    );

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);

    return (
        <div className="consumption-page">
            <div className="consumption-heading">
                <div>
                    <h1>Food Consumption</h1>
                    <p>
                        Track ingredient usage, consumption costs and wastage.
                    </p>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="consumption-summary">
                <div className="consumption-stat">
                    <span>Total Records</span>
                    <h2>{records.length}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Total Consumption Cost</span>
                    <h2>{formatCurrency(totalConsumptionCost)}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Total Food Wastage</span>
                    <h2>{totalWasteQuantity.toFixed(2)}</h2>
                    <small>Quantity across recorded ingredients</small>
                </div>

                <div className="consumption-stat">
                    <span>Estimated Wastage Cost</span>
                    <h2>{formatCurrency(totalWasteCost)}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Excess Consumption</span>
                    <h2>{totalExcess.toFixed(2)}</h2>
                    <small>Quantity above planned consumption</small>
                </div>
            </div>

            {/* QUOTATION INTEGRATION */}
            <section className="consumption-form-section">
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                }}>
                    <ClipboardList size={22} />
                    <h2 style={{ margin: 0 }}>
                        Generate Planned Consumption
                    </h2>
                </div>

                <p style={{ color: "#64748b", marginBottom: "18px" }}>
                    Select an accepted quotation to automatically calculate
                    planned ingredient requirements from its linked recipes
                    and serving standards.
                </p>

                <div className="consumption-form-grid">
                    <div className="consumption-field">
                        <label>Select Accepted Quotation</label>
                        <select
                            value={selectedQuotationId}
                            onChange={(e) => {
                                setSelectedQuotationId(e.target.value);
                                setQuotationError("");
                                setQuotationSuccess("");
                            }}
                        >
                            <option value="">Select quotation</option>
                            {acceptedQuotations.map((quotation) => (
                                <option
                                    key={quotation.id}
                                    value={String(quotation.id)}
                                >
                                    {quotation.quotationNumber} -{" "}
                                    {quotation.customerName} (
                                    {quotation.eventDate})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="consumption-field">
                        <label>Quotation Status</label>
                        <input
                            type="text"
                            value={
                                selectedQuotation
                                    ? selectedQuotation.status
                                    : "Only accepted quotations are available"
                            }
                            readOnly
                        />
                    </div>
                </div>

                {selectedQuotation && (
                    <div style={{
                        padding: "12px",
                        background: "#f1f5f9",
                        borderRadius: "8px",
                        marginTop: "12px",
                    }}>
                        <strong>{selectedQuotation.customerName}</strong>
                        <p style={{ margin: "5px 0" }}>
                            {selectedQuotation.eventType} |{" "}
                            {selectedQuotation.eventDate} |{" "}
                            {selectedQuotation.guests} Guests
                        </p>
                        <small>
                            Menu items:{" "}
                            {selectedQuotation.items
                                .map((item) => item.name)
                                .join(", ")}
                        </small>
                    </div>
                )}

                {quotationError && (
                    <p role="alert" style={{
                        color: "#dc2626",
                        marginTop: "12px",
                    }}>
                        {quotationError}
                    </p>
                )}

                {quotationSuccess && (
                    <p role="status" style={{
                        color: "#15803d",
                        marginTop: "12px",
                    }}>
                        {quotationSuccess}
                    </p>
                )}

                <div className="consumption-form-actions">
                    <button
                        type="button"
                        className="consumption-save-btn"
                        onClick={generateFromQuotation}
                        disabled={!selectedQuotation}
                    >
                        <RefreshCw
                            size={16}
                            style={{
                                display: "inline",
                                marginRight: "6px",
                                verticalAlign: "middle",
                            }}
                        />
                        Generate Planned Consumption
                    </button>
                </div>

                {acceptedQuotations.length === 0 && (
                    <p style={{
                        color: "#b45309",
                        fontSize: "13px",
                        marginTop: "12px",
                    }}>
                        No accepted quotations found. Change a quotation's
                        status to Accepted in Quotations Management to use
                        this feature.
                    </p>
                )}
            </section>

            {/* MANUAL / ACTUAL CONSUMPTION FORM */}
            <section className="consumption-form-section">
                <h2>
                    {editingId
                        ? "Edit Consumption Record"
                        : "Add Consumption Record"}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="consumption-form-grid">
                        <div className="consumption-field">
                            <label>Event Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Corporate Lunch"
                                value={form.eventName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        eventName: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Event Date</label>
                            <input
                                type="date"
                                value={form.eventDate}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        eventDate: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Ingredient</label>
                            <select
                                value={form.ingredientId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        ingredientId: e.target.value,
                                    })
                                }
                                required
                            >
                                <option value="">Select ingredient</option>
                                {ingredients.map((ingredient) => (
                                    <option
                                        key={String(ingredient.id)}
                                        value={String(ingredient.id)}
                                    >
                                        {ingredient.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="consumption-field">
                            <label>Unit Price</label>
                            <input
                                type="text"
                                value={
                                    selectedIngredient
                                        ? `${formatCurrency(unitPrice)} / ${selectedIngredient.unit}`
                                        : "Select an ingredient"
                                }
                                readOnly
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Planned Quantity</label>
                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                placeholder="Enter planned quantity"
                                value={form.plannedQty}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        plannedQty: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Actual Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter actual quantity"
                                value={form.actualQty}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        actualQty: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Wasted Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter wasted quantity"
                                value={form.wastedQty}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        wastedQty: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Notes</label>
                            <input
                                type="text"
                                placeholder="Optional notes"
                                value={form.notes}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        notes: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="consumption-calculations">
                        <div>
                            <span>Excess Consumption</span>
                            <strong>
                                {excess.toFixed(2)}{" "}
                                {selectedIngredient?.unit || ""}
                            </strong>
                        </div>

                        <div>
                            <span>Unused Planned Quantity</span>
                            <strong>
                                {unusedPlanned.toFixed(2)}{" "}
                                {selectedIngredient?.unit || ""}
                            </strong>
                        </div>

                        <div>
                            <span>Estimated Consumption Cost</span>
                            <strong>{formatCurrency(estimatedCost)}</strong>
                        </div>

                        <div>
                            <span>Estimated Wastage Cost</span>
                            <strong>{formatCurrency(estimatedWasteCost)}</strong>
                        </div>
                    </div>

                    <div className="consumption-form-actions">
                        <button
                            type="submit"
                            className="consumption-save-btn"
                        >
                            {editingId ? "Update Record" : "Save Record"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="consumption-cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* CONSUMPTION RECORDS */}
            <section className="consumption-records-section">
                <div className="consumption-records-heading">
                    <div>
                        <h2>Consumption Records</h2>
                        <p>
                            View and manage all recorded ingredient consumption.
                        </p>
                    </div>

                    <div className="consumption-filters">
                        <input
                            type="text"
                            placeholder="Search event or ingredient..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setDateFilter("");
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="consumption-table-wrapper">
                    <table className="consumption-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Ingredient</th>
                                <th>Planned</th>
                                <th>Actual</th>
                                <th>Wasted</th>
                                <th>Consumption Cost</th>
                                <th>Waste Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td>
                                            {record.eventName}
                                            {record.quotationId && (
                                                <small style={{
                                                    display: "block",
                                                    color: "#64748b",
                                                }}>
                                                    Quotation linked
                                                </small>
                                            )}
                                        </td>
                                        <td>{record.eventDate}</td>
                                        <td>{record.ingredientName}</td>
                                        <td>
                                            {record.plannedQty} {record.unit}
                                        </td>
                                        <td>
                                            {record.actualQty} {record.unit}
                                        </td>
                                        <td>
                                            {record.wastedQty} {record.unit}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                record.actualQty * record.price
                                            )}
                                        </td>
                                        <td>
                                            {formatCurrency(
                                                record.wastedQty * record.price
                                            )}
                                        </td>
                                        <td>
                                            <div className="consumption-actions">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(record)
                                                    }
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="consumption-delete-btn"
                                                    onClick={() =>
                                                        handleDelete(record.id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="consumption-empty"
                                    >
                                        No consumption records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default ConsumptionPage;
