
import { useEffect, useMemo, useState } from "react";
import "./ConfigurationPage.css";


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

const RECIPES_KEY = "mealmate_recipes";
const STANDARDS_KEY = "mealmate_serving_standards";


function ConfigurationPage() {
    const [loaded, setLoaded] = useState(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [standards, setStandards] = useState<ServingStandard[]>([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState("");
    const [bufferPercentage, setBufferPercentage] = useState("10");
    const [guestCount, setGuestCount] = useState("100");
    const [message, setMessage] = useState("");

    useEffect(() => {
        try {
            const savedRecipes = localStorage.getItem(RECIPES_KEY);
            const savedStandards = localStorage.getItem(STANDARDS_KEY);

            const parsedRecipes: Recipe[] = savedRecipes
                ? JSON.parse(savedRecipes)
                : [];

            const parsedStandards: ServingStandard[] = savedStandards
                ? JSON.parse(savedStandards)
                : [];

            setRecipes(parsedRecipes);
            setStandards(parsedStandards);
            setLoaded(true);

            if (parsedRecipes.length > 0) {
                setSelectedRecipeId(parsedRecipes[0].id);
            }
        } catch {
            setMessage("Unable to load saved recipes or serving standards.");
        }
    }, []);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem(STANDARDS_KEY, JSON.stringify(standards));
    }, [standards, loaded]);

    const selectedRecipe = recipes.find(
        (recipe) => recipe.id === selectedRecipeId
    );

    const savedStandard = standards.find(
        (standard) => standard.recipeId === selectedRecipeId
    );

    const effectiveBuffer = savedStandard?.bufferPercentage ?? 10;

    const totalIngredients = useMemo(
        () =>
            recipes.reduce(
                (total, recipe) => total + recipe.ingredients.length,
                0
            ),
        [recipes]
    );

    const saveStandard = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = Number(bufferPercentage);

        if (!selectedRecipe) {
            setMessage("Please select a recipe.");
            return;
        }

        if (!Number.isFinite(value) || value < 0 || value > 100) {
            setMessage("Buffer must be between 0% and 100%.");
            return;
        }

        setStandards((current) => {
            const exists = current.some(
                (standard) => standard.recipeId === selectedRecipeId
            );

            if (exists) {
                return current.map((standard) =>
                    standard.recipeId === selectedRecipeId
                        ? { ...standard, bufferPercentage: value }
                        : standard
                );
            }

            return [
                ...current,
                {
                    recipeId: selectedRecipeId,
                    bufferPercentage: value,
                },
            ];
        });

        setMessage(`Serving standard saved for ${selectedRecipe.name}.`);
    };

    const resetStandard = () => {
        setStandards((current) =>
            current.filter((standard) => standard.recipeId !== selectedRecipeId)
        );
        setBufferPercentage("10");
        setMessage("Custom buffer removed. Default buffer is now 10%.");
    };

    const guests = Math.max(0, Number(guestCount) || 0);
    const buffer = effectiveBuffer;

    const ingredientRequirements =
        selectedRecipe && selectedRecipe.servings > 0
            ? selectedRecipe.ingredients.map((ingredient) => {
                const quantityPerServing =
                    ingredient.quantity / selectedRecipe.servings;

                const baseQuantity = quantityPerServing * guests;
                const finalQuantity = baseQuantity * (1 + buffer / 100);

                return {
                    name: ingredient.ingredientName,
                    perServing: quantityPerServing,
                    baseQuantity,
                    finalQuantity,
                };
            })
            : [];

    const formatQuantity = (value: number) =>
        value.toLocaleString("en-IN", {
            maximumFractionDigits: 3,
        });

    return (
        <div className="configuration-page">
            <div className="configuration-heading">
                <div>
                    <h1>Serving Standards & Buffer Rules</h1>
                    <p>
                        Configure dish-wise preparation standards and additional buffer
                        quantities.
                    </p>
                </div>
            </div>

            <div className="configuration-stats">
                <div className="configuration-stat-card">
                    <span>Total Recipes</span>
                    <strong>{recipes.length}</strong>
                </div>

                <div className="configuration-stat-card">
                    <span>Configured Standards</span>
                    <strong>{standards.length}</strong>
                </div>

                <div className="configuration-stat-card">
                    <span>Ingredient Entries</span>
                    <strong>{totalIngredients}</strong>
                </div>
            </div>

            {message && (
                <div className="configuration-message">
                    {message}
                    <button type="button" onClick={() => setMessage("")}>
                        ×
                    </button>
                </div>
            )}

            {recipes.length === 0 ? (
                <div className="configuration-empty">
                    <h2>No recipes available</h2>
                    <p>
                        First create recipes in Recipe Management. Serving standards are
                        calculated from their saved ingredient quantities and servings.
                    </p>
                </div>
            ) : (
                <>
                    <form className="configuration-card" onSubmit={saveStandard}>
                        <h2>Configure Dish Standard</h2>

                        <div className="configuration-form-grid">
                            <div className="configuration-field">
                                <label>Select Dish / Recipe</label>
                                <select
                                    value={selectedRecipeId}
                                    onChange={(event) => {
                                        const nextId = event.target.value;
                                        setSelectedRecipeId(nextId);

                                        const existing = standards.find(
                                            (standard) => standard.recipeId === nextId
                                        );

                                        setBufferPercentage(
                                            String(existing?.bufferPercentage ?? 10)
                                        );
                                        setMessage("");
                                    }}
                                    required
                                >
                                    {recipes.map((recipe) => (
                                        <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="configuration-field">
                                <label>Buffer Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={bufferPercentage}
                                    onChange={(event) =>
                                        setBufferPercentage(event.target.value)
                                    }
                                    required
                                />
                                <small>
                                    Additional quantity to prepare beyond the base requirement.
                                </small>
                            </div>
                        </div>

                        <div className="configuration-info">
                            <strong>How the serving standard works</strong>
                            <p>
                                Ingredient quantity per serving is derived from the saved
                                recipe quantity divided by its number of servings. You can
                                configure an additional buffer percentage for each dish.
                            </p>
                        </div>

                        <div className="configuration-actions">
                            <button type="submit" className="configuration-primary-button">
                                Save Serving Standard
                            </button>
                            <button
                                type="button"
                                className="configuration-reset-button"
                                onClick={resetStandard}
                            >
                                Reset to Default
                            </button>
                        </div>
                    </form>

                    <section className="configuration-card">
                        <h2>Event Quantity Calculator</h2>
                        <p className="configuration-description">
                            Calculate the ingredient quantities required for a selected dish
                            and guest count.
                        </p>

                        <div className="configuration-form-grid">
                            <div className="configuration-field">
                                <label>Selected Dish</label>
                                <input
                                    value={selectedRecipe?.name || ""}
                                    readOnly
                                />
                            </div>

                            <div className="configuration-field">
                                <label>Number of Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={guestCount}
                                    onChange={(event) => setGuestCount(event.target.value)}
                                />
                            </div>
                        </div>

                        <div className="configuration-summary">
                            <div>
                                <span>Number of Guests</span>
                                <strong>{guests}</strong>
                            </div>
                            <div>
                                <span>Configured Buffer</span>
                                <strong>{buffer}%</strong>
                            </div>
                            <div>
                                <span>Dish</span>
                                <strong>{selectedRecipe?.name || "—"}</strong>
                            </div>
                        </div>

                        <h3 className="configuration-subheading">
                            Required Ingredient Quantities
                        </h3>

                        {ingredientRequirements.length === 0 ? (
                            <div className="configuration-empty">
                                No ingredients are available in this recipe.
                            </div>
                        ) : (
                            <div className="configuration-table-wrapper">
                                <table className="configuration-table">
                                    <thead>
                                        <tr>
                                            <th>Ingredient</th>
                                            <th>Per Serving</th>
                                            <th>Base Requirement</th>
                                            <th>Requirement with Buffer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredientRequirements.map((item, index) => (
                                            <tr key={`${item.name}-${index}`}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{formatQuantity(item.perServing)}</td>
                                                <td>{formatQuantity(item.baseQuantity)}</td>
                                                <td>
                                                    <strong>
                                                        {formatQuantity(item.finalQuantity)}
                                                    </strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p className="configuration-footnote">
                            Quantities use the same units as the corresponding ingredient
                            quantities in Recipe Management. The calculator currently
                            calculates one selected dish at a time.
                        </p>
                    </section>

                    <section className="configuration-card">
                        <h2>Saved Serving Standards</h2>

                        {standards.length === 0 ? (
                            <div className="configuration-empty">
                                No custom serving standards saved. Recipes currently use the
                                default 10% buffer.
                            </div>
                        ) : (
                            <div className="configuration-table-wrapper">
                                <table className="configuration-table">
                                    <thead>
                                        <tr>
                                            <th>Dish</th>
                                            <th>Recipe Servings</th>
                                            <th>Buffer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standards.map((standard) => {
                                            const recipe = recipes.find(
                                                (item) => item.id === standard.recipeId
                                            );

                                            if (!recipe) return null;

                                            return (
                                                <tr key={standard.recipeId}>
                                                    <td><strong>{recipe.name}</strong></td>
                                                    <td>{recipe.servings}</td>
                                                    <td>{standard.bufferPercentage}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default ConfigurationPage;
