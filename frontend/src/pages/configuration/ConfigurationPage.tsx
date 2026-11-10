import { useEffect, useState } from "react";
import { getRules, updateRule } from "../../services/planningService";
import { fetchDishes, getRecipe } from "../../services/catalogService";
import "./ConfigurationPage.css";

interface RecipeDish {
    id: number;
    name: string;
    recipeServings: number;
    recipeIngredients: any[];
}

function ConfigurationPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [dishes, setDishes] = useState<any[]>([]);
    
    
    const [defaultBuffer, setDefaultBuffer] = useState("10");
    const [maxBuffer, setMaxBuffer] = useState("100");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    
    const [selectedDishId, setSelectedDishId] = useState("");
    const [selectedDish, setSelectedDish] = useState<RecipeDish | null>(null);
    const [guestCount, setGuestCount] = useState("100");
    const [calculatorBuffer, setCalculatorBuffer] = useState("10");

    const loadData = async () => {
        setIsLoading(true);
        try {
           
            const rulesData = await getRules();
            let defBuf = rulesData.defaults.default_buffer;
            let maxBuf = rulesData.defaults.max_buffer;

            
            rulesData.rules.forEach((r: any) => {
                if (r.name === "default_buffer") defBuf = r.value;
                if (r.name === "max_buffer") maxBuf = r.value;
            });

            setDefaultBuffer(String(defBuf));
            setMaxBuffer(String(maxBuf));
            setCalculatorBuffer(String(defBuf)); 

            
            const dishData = await fetchDishes();
            setDishes(dishData.filter((d: any) => d.isActive !== false));
            
        } catch (err) {
            setError("Unable to load planning rules or dishes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const saveRules = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setError("");

        const defVal = Number(defaultBuffer);
        const maxVal = Number(maxBuffer);

        if (!Number.isFinite(defVal) || !Number.isFinite(maxVal) || defVal < 0 || maxVal < 0) {
            return setError("Buffers must be valid positive numbers.");
        }
        if (defVal > maxVal) {
            return setError("Default buffer cannot exceed the max buffer limit.");
        }

        try {
            
            await updateRule("default_buffer", defVal);
            await updateRule("max_buffer", maxVal);
            
            setMessage("Global buffer rules successfully updated.");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update rules.");
        }
    };

    const handleDishSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedDishId(id);
        
        if (!id) {
            setSelectedDish(null);
            return;
        }

        try {
            
            const fullDish = await getRecipe(id);
            setSelectedDish(fullDish);
        } catch (err) {
            console.error("Failed to load recipe details", err);
        }
    };

    
    const guests = Math.max(0, Number(guestCount) || 0);
    const buffer = Math.max(0, Number(calculatorBuffer) || 0);

    const ingredientRequirements = selectedDish && selectedDish.recipeServings > 0
        ? selectedDish.recipeIngredients.map((ri: any) => {
            const quantityPerServing = ri.quantity / selectedDish.recipeServings;
            const baseQuantity = quantityPerServing * guests;
            const finalQuantity = baseQuantity * (1 + buffer / 100);

            return {
                name: ri.ingredient.name,
                unit: ri.ingredient.unit,
                perServing: quantityPerServing,
                baseQuantity,
                finalQuantity,
            };
        })
        : [];

    const formatQuantity = (value: number) =>
        value.toLocaleString("en-IN", { maximumFractionDigits: 3 });

    if (isLoading) return <div style={{ padding: "30px" }}>Loading configuration...</div>;

    return (
        <div className="configuration-page">
            <div className="configuration-heading">
                <div>
                    <h1>Planning & Buffer Rules</h1>
                    <p>Configure company-wide food buffer limits and test ingredient quantities.</p>
                </div>
            </div>

            {message && (
                <div className="configuration-message">
                    {message}
                    <button type="button" onClick={() => setMessage("")}>×</button>
                </div>
            )}
            
            {error && (
                <div className="configuration-message" style={{ color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" }}>
                    {error}
                    <button type="button" onClick={() => setError("")}>×</button>
                </div>
            )}

            <form className="configuration-card" onSubmit={saveRules}>
                <h2>Global Buffer Rules</h2>
                
                <div className="configuration-info" style={{ marginTop: 0, marginBottom: "20px" }}>
                    <strong>How buffers work in MealMate</strong>
                    <p>
                        The "Default Buffer" is automatically applied to all new events to ensure adequate food quantities. 
                        The "Max Buffer" prevents staff from accidentally entering excessively high buffer percentages during event creation.
                    </p>
                </div>

                <div className="configuration-form-grid">
                    <div className="configuration-field">
                        <label>Default Event Buffer (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={defaultBuffer}
                            onChange={(e) => setDefaultBuffer(e.target.value)}
                            required
                        />
                        <small>Automatically applied to all new events.</small>
                    </div>

                    <div className="configuration-field">
                        <label>Maximum Allowed Buffer (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={maxBuffer}
                            onChange={(e) => setMaxBuffer(e.target.value)}
                            required
                        />
                        <small>Strict upper limit for all users.</small>
                    </div>
                </div>

                <div className="configuration-actions">
                    <button type="submit" className="configuration-primary-button">
                        Save Global Rules
                    </button>
                </div>
            </form>

            <section className="configuration-card">
                <h2>Event Quantity Calculator</h2>
                <p className="configuration-description">
                    Test how your recipes scale based on guest counts and buffer rules.
                </p>

                <div className="configuration-form-grid" style={{ marginTop: "20px" }}>
                    <div className="configuration-field">
                        <label>Select Dish to Test</label>
                        <select value={selectedDishId} onChange={handleDishSelect}>
                            <option value="">-- Select a Dish --</option>
                            {dishes.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="configuration-field">
                        <label>Number of Guests</label>
                        <input
                            type="number"
                            min="1"
                            value={guestCount}
                            onChange={(e) => setGuestCount(e.target.value)}
                        />
                    </div>
                    
                    <div className="configuration-field">
                        <label>Test Buffer (%)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={calculatorBuffer}
                            onChange={(e) => setCalculatorBuffer(e.target.value)}
                        />
                    </div>
                </div>

                {selectedDish && (
                    <>
                        <div className="configuration-summary">
                            <div>
                                <span>Guests</span>
                                <strong>{guests}</strong>
                            </div>
                            <div>
                                <span>Applied Buffer</span>
                                <strong>{buffer}%</strong>
                            </div>
                            <div>
                                <span>Recipe Yield</span>
                                <strong>{selectedDish.recipeServings} Servings</strong>
                            </div>
                        </div>

                        <h3 className="configuration-subheading">Required Ingredient Quantities</h3>

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
                                            <th>Final (With Buffer)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredientRequirements.map((item, index) => (
                                            <tr key={index}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{formatQuantity(item.perServing)} {item.unit}</td>
                                                <td>{formatQuantity(item.baseQuantity)} {item.unit}</td>
                                                <td>
                                                    <strong style={{ color: "#16a34a" }}>
                                                        {formatQuantity(item.finalQuantity)} {item.unit}
                                                    </strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

export default ConfigurationPage;