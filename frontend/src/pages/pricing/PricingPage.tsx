import { useEffect, useState, type FormEvent } from "react";
import { 
  fetchIngredients, 
  createIngredient, 
  updateIngredient, 
  deleteIngredient 
} from "../../services/catalogService";
import { 
  getPrices, 
  createPrice, 
  updatePrice 
} from "../../services/pricingService";
import "./PricingPage.css";

type IngredientData = {
    id: number;
    name: string;
    unit: string;
    price: number;
    priceId?: number;
};

type FormData = {
    name: string;
    unit: string;
    price: string;
};

const emptyForm: FormData = {
    name: "",
    unit: "",
    price: "",
};

function PricingPage() {
    const [ingredients, setIngredients] = useState<IngredientData[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch both lists concurrently from your live backend
            const [ingredientsRes, pricesRes] = await Promise.all([
                fetchIngredients(),
                getPrices()
            ]);

            // Merge the two backend tables into a single view for the table
            const merged = ingredientsRes.map((ing: any) => {
                const priceRecord = pricesRes.find((p: any) => p.ingredientId === ing.id);
                return {
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    price: priceRecord ? priceRecord.pricePerUnit : 0,
                    priceId: priceRecord ? priceRecord.id : undefined
                };
            });

            setIngredients(merged);
        } catch (err) {
            console.error("Failed to load pricing data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Summary calculations
    const totalIngredients = ingredients.length;
    const pricedIngredients = ingredients.filter(i => i.price > 0).length;
    const averagePrice = pricedIngredients > 0
        ? ingredients.reduce((total, item) => total + item.price, 0) / pricedIngredients
        : 0;

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleAddNew = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setError("");
        setShowForm(true);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((previous) => ({ ...previous, [field]: value }));
        if (error) setError("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const name = formData.name.trim();
        const price = Number(formData.price);

        if (!name || !formData.unit) {
            setError("Please complete all required fields.");
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setError("Please enter a valid price greater than zero.");
            return;
        }

        try {
            if (editingId !== null) {
                // 1. Update Ingredient table
                await updateIngredient(editingId, { name, unit: formData.unit });
                
                // 2. Update or Create Price table entry
                const existing = ingredients.find(i => i.id === editingId);
                if (existing?.priceId) {
                    await updatePrice(editingId, price);
                } else {
                    await createPrice({ ingredientId: editingId, pricePerUnit: price });
                }
            } else {
                // 1. Create in Ingredient table
                const newIng = await createIngredient({ name, unit: formData.unit });
                // 2. Create in Price table
                await createPrice({ ingredientId: newIng.id, pricePerUnit: price });
            }

            await loadData();
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save ingredient");
        }
    };

    const handleEdit = (ingredient: IngredientData) => {
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit,
            price: String(ingredient.price),
        });
        setEditingId(ingredient.id);
        setShowForm(true);
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (ingredient: IngredientData) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${ingredient.name}"?`);
        if (!confirmed) return;

        try {
            await deleteIngredient(ingredient.id);
            await loadData();
            if (editingId === ingredient.id) resetForm();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete ingredient");
        }
    };

    if (isLoading) return <div style={{ padding: "30px" }}>Loading pricing data...</div>;

    return (
        <div className="pricing-page">
            <div className="pricing-heading">
                <div>
                    <h2>Pricing Management</h2>
                    <p>Manage ingredient prices connected directly to your database.</p>
                </div>
                <button type="button" className="add-ingredient-btn" onClick={handleAddNew}>
                    + Add Ingredient
                </button>
            </div>

            <div className="pricing-summary">
                <div className="pricing-card">
                    <h3>Total Ingredients</h3>
                    <p>{totalIngredients}</p>
                </div>
                <div className="pricing-card">
                    <h3>Priced Ingredients</h3>
                    <p>{pricedIngredients}</p>
                </div>
                <div className="pricing-card">
                    <h3>Average Ingredient Price</h3>
                    <p>₹{averagePrice.toFixed(2)}</p>
                </div>
            </div>

            {showForm && (
                <div className="ingredient-form-section">
                    <h3>{editingId !== null ? "Edit Ingredient" : "Add New Ingredient"}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Ingredient Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rice"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Unit</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => handleInputChange("unit", e.target.value)}
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Litre">Litre</option>
                                    <option value="Piece">Piece</option>
                                    <option value="Dozen">Dozen</option>
                                    <option value="g">Gram (g)</option>
                                    <option value="ml">Milliliter (ml)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Price per Unit (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter price"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => handleInputChange("price", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="form-error" role="alert">{error}</p>}

                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="save-btn">
                                {editingId !== null ? "Update Ingredient" : "Save Ingredient"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="pricing-table-section">
                <h3>Ingredient Price List</h3>
                {ingredients.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-message">No ingredients added yet.</p>
                        <p>Click Add Ingredient to start building your live price list.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Unit</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ingredient) => (
                                    <tr key={ingredient.id}>
                                        <td>{ingredient.name}</td>
                                        <td>{ingredient.unit}</td>
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