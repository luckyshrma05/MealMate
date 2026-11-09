
import { useEffect, useMemo, useState } from "react";
import "./RecipesPage.css";

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
    notes: string;
    ingredients: RecipeIngredient[];
    createdAt: string;
}

const INGREDIENTS_KEY = "mealmate_ingredients";
const RECIPES_KEY = "mealmate_recipes";

function readStorage<T,>(key: string, fallback: T): T {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) as T : fallback;
    } catch {
        return fallback;
    }
}

function RecipesPage() {
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Main Course");
    const [servings, setServings] = useState("10");
    const [notes, setNotes] = useState("");
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([
        { ingredientName: "", quantity: 0 },
    ]);

    useEffect(() => {
        setAvailableIngredients(readStorage<Ingredient[]>(INGREDIENTS_KEY, []));
        setRecipes(readStorage<Recipe[]>(RECIPES_KEY, []));
    }, []);

    useEffect(() => {
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    }, [recipes]);

    const getIngredient = (ingredientName: string) =>
        availableIngredients.find(
            (item) => item.name.toLowerCase() === ingredientName.toLowerCase()
        );

    const getRecipeCost = (items: RecipeIngredient[]) =>
        items.reduce((total, item) => {
            const ingredient = getIngredient(item.ingredientName);
            return total + (ingredient ? ingredient.price * item.quantity : 0);
        }, 0);

    const totalCost = getRecipeCost(recipeIngredients);
    const costPerServing =
        Number(servings) > 0 ? totalCost / Number(servings) : 0;

    const filteredRecipes = useMemo(
        () =>
            recipes.filter((recipe) =>
                `${recipe.name} ${recipe.category}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [recipes, search]
    );

    const resetForm = () => {
        setName("");
        setCategory("Main Course");
        setServings("10");
        setNotes("");
        setRecipeIngredients([{ ingredientName: "", quantity: 0 }]);
        setEditingId(null);
    };

    const updateRecipeIngredient = (
        index: number,
        field: keyof RecipeIngredient,
        value: string
    ) => {
        setRecipeIngredients((current) =>
            current.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]: field === "quantity" ? Number(value) : value,
                    }
                    : item
            )
        );
    };

    const addIngredientRow = () => {
        setRecipeIngredients((current) => [
            ...current,
            { ingredientName: "", quantity: 0 },
        ]);
    };

    const removeIngredientRow = (index: number) => {
        setRecipeIngredients((current) =>
            current.filter((_, i) => i !== index)
        );
    };

    const saveRecipe = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim()) {
            alert("Please enter a recipe name.");
            return;
        }

        if (Number(servings) <= 0) {
            alert("Number of servings must be greater than zero.");
            return;
        }

        const validIngredients = recipeIngredients.filter(
            (item) => item.ingredientName && item.quantity > 0
        );

        if (validIngredients.length === 0) {
            alert("Please add at least one ingredient with a quantity.");
            return;
        }

        const duplicate = validIngredients.some(
            (item, index) =>
                validIngredients.findIndex(
                    (other) => other.ingredientName === item.ingredientName
                ) !== index
        );

        if (duplicate) {
            alert("An ingredient can only be added once per recipe.");
            return;
        }

        const updatedRecipe: Recipe = {
            id: editingId || `recipe_${Date.now()}`,
            name: name.trim(),
            category,
            servings: Number(servings),
            notes: notes.trim(),
            ingredients: validIngredients,
            createdAt: new Date().toISOString(),
        };

        if (editingId) {
            setRecipes((current) =>
                current.map((recipe) =>
                    recipe.id === editingId ? updatedRecipe : recipe
                )
            );
        } else {
            setRecipes((current) => [updatedRecipe, ...current]);
        }

        resetForm();
    };

    const editRecipe = (recipe: Recipe) => {
        setEditingId(recipe.id);
        setName(recipe.name);
        setCategory(recipe.category);
        setServings(String(recipe.servings));
        setNotes(recipe.notes);
        setRecipeIngredients(recipe.ingredients);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteRecipe = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) {
            return;
        }

        setRecipes((current) => current.filter((recipe) => recipe.id !== id));

        if (editingId === id) resetForm();
    };

    const currency = (value: number) =>
        `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const totalRecipeCost = (recipe: Recipe) =>
        getRecipeCost(recipe.ingredients);

    const averageCost =
        recipes.length > 0
            ? recipes.reduce((sum, recipe) => sum + totalRecipeCost(recipe), 0) /
            recipes.length
            : 0;

    const totalIngredientEntries = recipes.reduce(
        (sum, recipe) => sum + recipe.ingredients.length,
        0
    );

    return (
        <div className="recipes-page">
            <div className="recipes-heading">
                <div>
                    <h1>Recipe & Dish Management</h1>
                    <p>
                        Manage recipes, ingredient quantities and estimated food costs.
                    </p>
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
                    No ingredients found in Pricing Management. Add ingredients there
                    before creating recipes.
                </div>
            )}

            <form className="recipe-form-card" onSubmit={saveRecipe}>
                <h2>{editingId ? "Edit Recipe" : "Add New Recipe"}</h2>

                <div className="recipe-form-grid">
                    <div className="recipe-field">
                        <label>Recipe / Dish Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Vegetable Pulao"
                            required
                        />
                    </div>

                    <div className="recipe-field">
                        <label>Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
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
                        <input
                            type="number"
                            min="1"
                            value={servings}
                            onChange={(e) => setServings(e.target.value)}
                            required
                        />
                    </div>

                    <div className="recipe-field">
                        <label>Preparation Notes</label>
                        <input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional instructions"
                        />
                    </div>
                </div>

                <div className="recipe-ingredients-heading">
                    <h3>Recipe Ingredients</h3>
                    <button
                        type="button"
                        className="recipe-secondary-button"
                        onClick={addIngredientRow}
                        disabled={availableIngredients.length === 0}
                    >
                        + Add Ingredient
                    </button>
                </div>

                {recipeIngredients.map((item, index) => {
                    const selected = getIngredient(item.ingredientName);
                    const lineCost = selected
                        ? selected.price * item.quantity
                        : 0;

                    return (
                        <div className="recipe-ingredient-row" key={index}>
                            <div className="recipe-field">
                                <label>Ingredient</label>
                                <select
                                    value={item.ingredientName}
                                    onChange={(e) =>
                                        updateRecipeIngredient(
                                            index,
                                            "ingredientName",
                                            e.target.value
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select ingredient</option>
                                    {availableIngredients.map((ingredient) => (
                                        <option
                                            key={ingredient.id || ingredient.name}
                                            value={ingredient.name}
                                        >
                                            {ingredient.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="recipe-field">
                                <label>Quantity per Recipe</label>
                                <input
                                    type="number"
                                    min="0.001"
                                    step="any"
                                    value={item.quantity || ""}
                                    onChange={(e) =>
                                        updateRecipeIngredient(index, "quantity", e.target.value)
                                    }
                                    placeholder="Enter quantity"
                                    required
                                />
                            </div>

                            <div className="recipe-field">
                                <label>Unit Price</label>
                                <input
                                    value={
                                        selected
                                            ? `${currency(selected.price)} / ${selected.unit}`
                                            : "Select ingredient"
                                    }
                                    readOnly
                                />
                            </div>

                            <div className="recipe-field">
                                <label>Ingredient Cost</label>
                                <input value={currency(lineCost)} readOnly />
                            </div>

                            <button
                                type="button"
                                className="recipe-remove-button"
                                onClick={() => removeIngredientRow(index)}
                                disabled={recipeIngredients.length === 1}
                            >
                                Remove
                            </button>
                        </div>
                    );
                })}

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
                    <button
                        type="submit"
                        className="recipe-primary-button"
                        disabled={availableIngredients.length === 0}
                    >
                        {editingId ? "Update Recipe" : "Save Recipe"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="recipe-cancel-button"
                            onClick={resetForm}
                        >
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
                    <input
                        className="recipe-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search recipes..."
                    />
                </div>

                {filteredRecipes.length === 0 ? (
                    <div className="recipe-empty">
                        {recipes.length === 0
                            ? "No recipes added yet. Create your first recipe above."
                            : "No recipes match your search."}
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
                                        <td>
                                            {currency(totalRecipeCost(recipe) / recipe.servings)}
                                        </td>
                                        <td>
                                            <div className="recipe-table-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => editRecipe(recipe)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="recipe-delete-button"
                                                    onClick={() => deleteRecipe(recipe.id)}
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
            </section>
        </div>
    );
}

export default RecipesPage;
