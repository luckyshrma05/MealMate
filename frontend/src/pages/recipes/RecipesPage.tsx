import { useEffect, useMemo, useState } from "react";
import { 
    fetchDishes, 
    getRecipe, 
    createDish, 
    updateDish, 
    deleteDish, 
    setRecipe, 
    fetchIngredients 
} from "../../services/catalogService";
import { getPrices } from "../../services/pricingService";
import "./RecipesPage.css";

interface PricedIngredient {
    id: number;
    name: string;
    unit: string;
    price: number;
}

interface RecipeIngredientItem {
    ingredientId: number | "";
    ingredientName?: string;
    quantity: number | "";
}

interface RecipeDish {
    id: number;
    name: string;
    category: string;
    servings: number;
    notes: string;
    ingredients: {
        ingredientId: number;
        ingredientName: string;
        quantity: number;
    }[];
}

function RecipesPage() {
    const [availableIngredients, setAvailableIngredients] = useState<PricedIngredient[]>([]);
    const [recipes, setRecipes] = useState<RecipeDish[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Main Course");
    const [servings, setServings] = useState("10");
    const [notes, setNotes] = useState("");
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([
        { ingredientId: "", quantity: "" },
    ]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [ingRes, pricesRes, dishRes] = await Promise.all([
                fetchIngredients(),
                getPrices(),
                fetchDishes()
            ]);

            // Filter out soft-deleted items
            const activeIngs = ingRes.filter((ing: any) => ing.isActive !== false);
            const activeDishes = dishRes.filter((d: any) => d.isActive !== false);

            const priced: PricedIngredient[] = activeIngs.map((ing: any) => {
                const p = pricesRes.find((p: any) => p.ingredientId === ing.id);
                return { ...ing, price: p ? p.pricePerUnit : 0 };
            });
            setAvailableIngredients(priced);

            const detailedDishes = await Promise.all(
                activeDishes.map(async (d: any) => await getRecipe(d.id))
            );

            const formattedRecipes: RecipeDish[] = detailedDishes.map((d: any) => ({
                id: d.id,
                name: d.name,
                category: d.category,
                servings: d.recipeServings,
                notes: d.description || "",
                ingredients: d.recipeIngredients.map((ri: any) => ({
                    ingredientId: ri.ingredientId,
                    ingredientName: ri.ingredient.name,
                    quantity: ri.quantity
                }))
            }));

            setRecipes(formattedRecipes);
        } catch (err) {
            console.error("Failed to load recipes data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getIngredient = (id: number | "") => 
        availableIngredients.find((item) => item.id === Number(id));

    const getRecipeCost = (items: RecipeIngredientItem[]) =>
        items.reduce((total, item) => {
            const ingredient = getIngredient(item.ingredientId);
            return total + (ingredient && item.quantity ? ingredient.price * Number(item.quantity) : 0);
        }, 0);

    const totalCost = getRecipeCost(recipeIngredients);
    const costPerServing = Number(servings) > 0 ? totalCost / Number(servings) : 0;

    const filteredRecipes = useMemo(
        () => recipes.filter((recipe) =>
                `${recipe.name} ${recipe.category}`.toLowerCase().includes(search.toLowerCase())
            ),
        [recipes, search]
    );

    const resetForm = () => {
        setName("");
        setCategory("Main Course");
        setServings("10");
        setNotes("");
        setRecipeIngredients([{ ingredientId: "", quantity: "" }]);
        setEditingId(null);
        setError("");
    };

    const updateRecipeIngredient = (index: number, field: keyof RecipeIngredientItem, value: string) => {
        setRecipeIngredients((current) =>
            current.map((item, i) => i === index ? { ...item, [field]: value } : item)
        );
    };

    const addIngredientRow = () => {
        setRecipeIngredients((current) => [...current, { ingredientId: "", quantity: "" }]);
    };

    const removeIngredientRow = (index: number) => {
        setRecipeIngredients((current) => current.filter((_, i) => i !== index));
    };

    const saveRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!name.trim()) return setError("Please enter a recipe name.");
        if (Number(servings) <= 0) return setError("Number of servings must be greater than zero.");

        const validIngredients = recipeIngredients.filter(
            (item) => item.ingredientId !== "" && Number(item.quantity) > 0
        );

        if (validIngredients.length === 0) return setError("Please add at least one ingredient with a quantity.");

        const duplicate = validIngredients.some(
            (item, index) => validIngredients.findIndex((other) => other.ingredientId === item.ingredientId) !== index
        );
        if (duplicate) return setError("An ingredient can only be added once per recipe.");

        const dishPayload = {
            name: name.trim(),
            category,
            recipeServings: Number(servings),
            description: notes.trim() || undefined
        };

        const recipePayload = validIngredients.map(item => ({
            ingredientId: Number(item.ingredientId),
            quantity: Number(item.quantity)
        }));

        try {
            let dishId = editingId;

            if (dishId !== null) {
                await updateDish(dishId, dishPayload);
            } else {
                const newDish = await createDish(dishPayload);
                dishId = newDish.id;
            }

            await setRecipe(dishId!, recipePayload);

            await loadData();
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save recipe");
        }
    };

    const editRecipe = (recipe: RecipeDish) => {
        setEditingId(recipe.id);
        setName(recipe.name);
        setCategory(recipe.category);
        setServings(String(recipe.servings));
        setNotes(recipe.notes);
        
        if (recipe.ingredients.length > 0) {
            setRecipeIngredients(recipe.ingredients.map(i => ({
                ingredientId: i.ingredientId,
                quantity: i.quantity
            })));
        } else {
            setRecipeIngredients([{ ingredientId: "", quantity: "" }]);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return;
        try {
            await deleteDish(id);
            await loadData();
            if (editingId === id) resetForm();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete recipe");
        }
    };

    const currency = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const totalRecipeCost = (recipe: RecipeDish) =>
        recipe.ingredients.reduce((total, item) => {
            const ingredient = getIngredient(item.ingredientId);
            return total + (ingredient ? ingredient.price * item.quantity : 0);
        }, 0);

    const averageCost = recipes.length > 0
        ? recipes.reduce((sum, recipe) => sum + totalRecipeCost(recipe), 0) / recipes.length
        : 0;

    const totalIngredientEntries = recipes.reduce((sum, recipe) => sum + recipe.ingredients.length, 0);

    if (isLoading) return <div style={{ padding: "30px" }}>Loading recipes and ingredients...</div>;

    return (
        <div className="recipes-page">
            <div className="recipes-heading">
                <div>
                    <h1>Recipe & Dish Management</h1>
                    <p>Manage recipes, ingredient quantities and estimated food costs.</p>
                </div>
            </div>

            <div className="recipe-stats">
                <div className="recipe-stat-card">
                    <span>Total Recipes</span>
                    <strong>{recipes.length}</strong>
                </div>
                <div className="recipe-stat-card">
                    <span>Average Recipe Cost</span>
                    <strong>{currency(averageCost)}</strong>
                </div>
                <div className="recipe-stat-card">
                    <span>Ingredient Entries</span>
                    <strong>{totalIngredientEntries}</strong>
                </div>
                <div className="recipe-stat-card">
                    <span>Available Ingredients</span>
                    <strong>{availableIngredients.length}</strong>
                </div>
            </div>

            {availableIngredients.length === 0 && (
                <div className="recipe-warning">
                    No ingredients found in Pricing Management. Add ingredients there before creating recipes.
                </div>
            )}

            <form className="recipe-form-card" onSubmit={saveRecipe}>
                <h2>{editingId ? "Edit Recipe" : "Add New Recipe"}</h2>

                <div className="recipe-form-grid">
                    <div className="recipe-field">
                        <label>Recipe / Dish Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vegetable Pulao" required />
                    </div>

                    <div className="recipe-field">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option>Main Course</option>
                            <option>Starter</option>
                            <option>Dessert</option>
                            <option>Beverage</option>
                            <option>Snacks</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="recipe-field">
                        <label>Number of Servings</label>
                        <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} required />
                    </div>

                    <div className="recipe-field">
                        <label>Preparation Notes</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional instructions" />
                    </div>
                </div>

                <div className="recipe-ingredients-heading">
                    <h3>Recipe Ingredients</h3>
                    <button type="button" className="recipe-secondary-button" onClick={addIngredientRow} disabled={availableIngredients.length === 0}>
                        + Add Ingredient
                    </button>
                </div>

                {recipeIngredients.map((item, index) => {
                    const selected = getIngredient(item.ingredientId);
                    const lineCost = selected && item.quantity ? selected.price * Number(item.quantity) : 0;

                    return (
                        <div className="recipe-ingredient-row" key={index}>
                            <div className="recipe-field">
                                <label>Ingredient</label>
                                <select value={item.ingredientId} onChange={(e) => updateRecipeIngredient(index, "ingredientId", e.target.value)} required>
                                    <option value="">Select ingredient</option>
                                    {availableIngredients.map((ingredient) => (
                                        <option key={ingredient.id} value={ingredient.id}>
                                            {ingredient.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="recipe-field">
                                <label>Quantity per Recipe</label>
                                <input type="number" min="0.001" step="any" value={item.quantity} onChange={(e) => updateRecipeIngredient(index, "quantity", e.target.value)} placeholder="Enter quantity" required />
                            </div>

                            <div className="recipe-field">
                                <label>Unit Price</label>
                                <input value={selected ? `${currency(selected.price)} / ${selected.unit}` : "Select ingredient"} readOnly />
                            </div>

                            <div className="recipe-field">
                                <label>Ingredient Cost</label>
                                <input value={currency(lineCost)} readOnly />
                            </div>

                            <button type="button" className="recipe-remove-button" onClick={() => removeIngredientRow(index)} disabled={recipeIngredients.length === 1}>
                                Remove
                            </button>
                        </div>
                    );
                })}

                {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "6px", marginTop: "15px" }}>{error}</p>}

                <div className="recipe-cost-summary">
                    <div>
                        <span>Total Recipe Cost</span>
                        <strong>{currency(totalCost)}</strong>
                    </div>
                    <div>
                        <span>Cost per Serving</span>
                        <strong>{currency(costPerServing)}</strong>
                    </div>
                </div>

                <div className="recipe-form-actions">
                    <button type="submit" className="recipe-primary-button" disabled={availableIngredients.length === 0}>
                        {editingId ? "Update Recipe" : "Save Recipe"}
                    </button>
                    {editingId && (
                        <button type="button" className="recipe-cancel-button" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <section className="recipe-list-card">
                <div className="recipe-list-heading">
                    <div>
                        <h2>Recipe List</h2>
                        <p>View and manage saved dishes.</p>
                    </div>
                    <input className="recipe-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recipes..." />
                </div>

                {filteredRecipes.length === 0 ? (
                    <div className="recipe-empty">
                        {recipes.length === 0 ? "No recipes added yet. Create your first recipe above." : "No recipes match your search."}
                    </div>
                ) : (
                    <div className="recipe-table-wrapper">
                        <table className="recipe-table">
                            <thead>
                                <tr>
                                    <th>Dish Name</th>
                                    <th>Category</th>
                                    <th>Servings</th>
                                    <th>Ingredients</th>
                                    <th>Total Cost</th>
                                    <th>Cost / Serving</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecipes.map((recipe) => (
                                    <tr key={recipe.id}>
                                        <td><strong>{recipe.name}</strong></td>
                                        <td>{recipe.category}</td>
                                        <td>{recipe.servings}</td>
                                        <td>{recipe.ingredients.length}</td>
                                        <td>{currency(totalRecipeCost(recipe))}</td>
                                        <td>{currency(totalRecipeCost(recipe) / recipe.servings)}</td>
                                        <td>
                                            <div className="recipe-table-actions">
                                                <button type="button" onClick={() => editRecipe(recipe)}>Edit</button>
                                                <button type="button" className="recipe-delete-button" onClick={() => handleDelete(recipe.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default RecipesPage;