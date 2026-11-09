
import { useEffect, useState, type FormEvent } from "react";
import "./PricingPage.css";

type Ingredient = {
    id: number;
    name: string;
    category: string;
    unit: string;
    supplier: string;
    price: number;
};

type FormData = {
    name: string;
    category: string;
    unit: string;
    supplier: string;
    price: string;
};

const STORAGE_KEY = "mealmate_ingredients";
const PRICE_UPDATES_KEY = "mealmate_price_updates";

const emptyForm: FormData = {
    name: "",
    category: "",
    unit: "",
    supplier: "",
    price: "",
};

function PricingPage() {
    // Load saved ingredients from browser storage.
    const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    // Load the number of actual price changes.
    const [priceUpdates, setPriceUpdates] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(PRICE_UPDATES_KEY);
            const parsed = saved ? Number(saved) : 0;

            return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
        } catch {
            return 0;
        }
    });

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const [error, setError] = useState("");

    // Persist ingredients whenever they change.
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
    }, [ingredients]);

    // Persist price update count.
    useEffect(() => {
        localStorage.setItem(PRICE_UPDATES_KEY, String(priceUpdates));
    }, [priceUpdates]);

    // Summary calculations.
    const totalIngredients = ingredients.length;

    const averagePrice =
        totalIngredients > 0
            ? ingredients.reduce((total, item) => total + item.price, 0) /
            totalIngredients
            : 0;

    // Reset form and close it.
    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    // Open a fresh Add Ingredient form.
    const handleAddNew = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setError("");
        setShowForm(true);
    };

    // Update form fields.
    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));

        if (error) setError("");
    };

    // Add or update ingredient.
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const name = formData.name.trim();
        const supplier = formData.supplier.trim();
        const price = Number(formData.price);

        if (!name || !supplier || !formData.category || !formData.unit) {
            setError("Please complete all required fields.");
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setError("Please enter a valid price greater than zero.");
            return;
        }

        // Prevent duplicate ingredient names.
        const duplicate = ingredients.some(
            (item) =>
                item.name.toLowerCase() === name.toLowerCase() &&
                item.id !== editingId
        );

        if (duplicate) {
            setError("This ingredient already exists in your price list.");
            return;
        }

        if (editingId !== null) {
            const existingIngredient = ingredients.find(
                (item) => item.id === editingId
            );

            if (!existingIngredient) {
                setError("Ingredient not found. Please try again.");
                return;
            }

            const updatedIngredient: Ingredient = {
                ...existingIngredient,
                name,
                category: formData.category,
                unit: formData.unit,
                supplier,
                price,
            };

            setIngredients((previous) =>
                previous.map((item) =>
                    item.id === editingId ? updatedIngredient : item
                )
            );

            // Count only actual price changes.
            if (existingIngredient.price !== price) {
                setPriceUpdates((previous) => previous + 1);
            }
        } else {
            const newIngredient: Ingredient = {
                id: Date.now(),
                name,
                category: formData.category,
                unit: formData.unit,
                supplier,
                price,
            };

            setIngredients((previous) => [...previous, newIngredient]);
        }

        resetForm();
    };

    // Load an existing ingredient into the form.
    const handleEdit = (ingredient: Ingredient) => {
        setFormData({
            name: ingredient.name,
            category: ingredient.category,
            unit: ingredient.unit,
            supplier: ingredient.supplier,
            price: String(ingredient.price),
        });

        setEditingId(ingredient.id);
        setShowForm(true);
        setError("");

        // Bring the form into view.
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete ingredient after confirmation.
    const handleDelete = (ingredient: Ingredient) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${ingredient.name}"?`
        );

        if (!confirmed) return;

        setIngredients((previous) =>
            previous.filter((item) => item.id !== ingredient.id)
        );

        // Close the form if the deleted ingredient was being edited.
        if (editingId === ingredient.id) {
            resetForm();
        }
    };

    return (
        <div className="pricing-page">

            {/* Page Heading */}
            <div className="pricing-heading">
                <div>
                    <h2>Pricing Management</h2>
                    <p>Manage ingredient prices and supplier information.</p>
                </div>

                <button
                    type="button"
                    className="add-ingredient-btn"
                    onClick={handleAddNew}
                >
                    + Add Ingredient
                </button>
            </div>

            {/* Summary Cards */}
            <div className="pricing-summary">

                <div className="pricing-card">
                    <h3>Total Ingredients</h3>
                    <p>{totalIngredients}</p>
                </div>

                <div className="pricing-card">
                    <h3>Average Ingredient Price</h3>
                    <p>₹{averagePrice.toFixed(2)}</p>
                </div>

                <div className="pricing-card">
                    <h3>Price Updates</h3>
                    <p>{priceUpdates}</p>
                </div>

            </div>

            {/* Add / Edit Ingredient Form */}
            {showForm && (
                <div className="ingredient-form-section">

                    <h3>
                        {editingId !== null
                            ? "Edit Ingredient"
                            : "Add New Ingredient"}
                    </h3>

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            <div className="form-group">
                                <label>Ingredient Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rice"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange("name", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        handleInputChange("category", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Meat">Meat</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Unit</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) =>
                                        handleInputChange("unit", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Litre">Litre</option>
                                    <option value="Piece">Piece</option>
                                    <option value="Dozen">Dozen</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Supplier Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter supplier name"
                                    value={formData.supplier}
                                    onChange={(e) =>
                                        handleInputChange("supplier", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Price per Unit (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter price"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) =>
                                        handleInputChange("price", e.target.value)
                                    }
                                    required
                                />
                            </div>

                        </div>

                        {error && (
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button type="submit" className="save-btn">
                                {editingId !== null
                                    ? "Update Ingredient"
                                    : "Save Ingredient"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* Ingredient Price List */}
            <div className="pricing-table-section">

                <h3>Ingredient Price List</h3>

                {ingredients.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-message">
                            No ingredients added yet.
                        </p>
                        <p>
                            Click Add Ingredient to start building your price list.
                        </p>
                    </div>
                ) : (

                    <div className="table-wrapper">

                        <table className="pricing-table">

                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Category</th>
                                    <th>Unit</th>
                                    <th>Supplier</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ingredients.map((ingredient) => (
                                    <tr key={ingredient.id}>
                                        <td>{ingredient.name}</td>
                                        <td>{ingredient.category}</td>
                                        <td>{ingredient.unit}</td>
                                        <td>{ingredient.supplier}</td>
                                        <td>₹{ingredient.price.toFixed(2)}</td>

                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(ingredient)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(ingredient)}
                                                >
                                                    Delete
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

        </div>
    );
}

export default PricingPage;
