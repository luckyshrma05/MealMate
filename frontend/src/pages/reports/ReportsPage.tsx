
import { useEffect, useMemo, useState } from "react";
import "./ReportsPage.css";

interface QuotationItem {
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
    guests: number;
    items: QuotationItem[];
    status: "Draft" | "Sent" | "Accepted" | "Rejected";
    createdAt: string;
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

interface Ingredient {
    id: string;
    name: string;
    category: string;
    unit: string;
    supplier: string;
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
    ingredients: RecipeIngredient[];
}

interface ServingStandard {
    recipeId: string;
    bufferPercentage: number;
}

interface IngredientCost {
    ingredientName: string;
    quantity: number;
    unit: string;
    price: number;
    cost: number;
    available: boolean;
}

interface QuotationCost {
    totalCost: number;
    complete: boolean;
    linkedItems: number;
    unlinkedItems: number;
    ingredients: IngredientCost[];
}

const QUOTATIONS_KEY = "mealmate_quotations";
const CONSUMPTION_KEY = "mealmate_consumption";
const INGREDIENTS_KEY = "mealmate_ingredients";
const PRICE_UPDATES_KEY = "mealmate_price_updates";
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

function ReportsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [consumption, setConsumption] = useState<ConsumptionRecord[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [servingStandards, setServingStandards] = useState<ServingStandard[]>([]);
    const [priceUpdates, setPriceUpdates] = useState(0);

    const [period, setPeriod] = useState("all");

    useEffect(() => {
        setQuotations(readStorage<Quotation[]>(QUOTATIONS_KEY, []));
        setConsumption(readStorage<ConsumptionRecord[]>(CONSUMPTION_KEY, []));
        setIngredients(readStorage<Ingredient[]>(INGREDIENTS_KEY, []));
        setRecipes(readStorage<Recipe[]>(RECIPES_KEY, []));
        setServingStandards(readStorage<ServingStandard[]>(STANDARDS_KEY, []));
        setPriceUpdates(readStorage<number>(PRICE_UPDATES_KEY, 0));
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);

    const formatDate = (value: string) => {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString("en-IN");
    };

    const getQuotationTotal = (quotation: Quotation) =>
        (quotation.items || []).reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0) *
                Number(item.rate || 0),
            0
        );

    // Calculate estimated recipe cost for a quotation.
    const getQuotationCost = (quotation: Quotation): QuotationCost => {
        const ingredientCosts = new Map<string, IngredientCost>();
        let linkedItems = 0;
        let unlinkedItems = 0;
        let complete = true;

        (quotation.items || []).forEach((menuItem) => {
            if (!menuItem.recipeId) {
                unlinkedItems++;
                complete = false;
                return;
            }

            const recipe = recipes.find(
                (item) => item.id === menuItem.recipeId
            );

            if (!recipe || !recipe.servings || recipe.servings <= 0) {
                complete = false;
                return;
            }

            linkedItems++;

            const standard = servingStandards.find(
                (item) => item.recipeId === recipe.id
            );

            const buffer = standard?.bufferPercentage ?? 10;

            recipe.ingredients.forEach((recipeIngredient) => {
                const ingredient = ingredients.find(
                    (item) =>
                        item.name.trim().toLowerCase() ===
                        recipeIngredient.ingredientName.trim().toLowerCase()
                );

                if (!ingredient) {
                    complete = false;
                    return;
                }

                const requiredQuantity =
                    (recipeIngredient.quantity / recipe.servings) *
                    menuItem.quantity *
                    (1 + buffer / 100);

                const key = String(ingredient.id);

                const existing = ingredientCosts.get(key);

                if (existing) {
                    existing.quantity += requiredQuantity;
                    existing.cost += requiredQuantity * ingredient.price;
                } else {
                    ingredientCosts.set(key, {
                        ingredientName: ingredient.name,
                        quantity: requiredQuantity,
                        unit: ingredient.unit,
                        price: ingredient.price,
                        cost: requiredQuantity * ingredient.price,
                        available: true,
                    });
                }
            });
        });

        const details = Array.from(ingredientCosts.values());

        return {
            totalCost: details.reduce(
                (total, item) => total + item.cost,
                0
            ),
            complete: complete && linkedItems > 0,
            linkedItems,
            unlinkedItems,
            ingredients: details,
        };
    };

    // Date filtering.
    const filteredData = useMemo(() => {
        const now = new Date();

        const filterByPeriod = (value: string) => {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return false;

            if (period === "month") {
                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth()
                );
            }

            if (period === "year") {
                return date.getFullYear() === now.getFullYear();
            }

            return true;
        };

        return {
            quotations: quotations.filter((item) =>
                filterByPeriod(item.eventDate)
            ),
            consumption: consumption.filter((item) =>
                filterByPeriod(item.eventDate)
            ),
        };
    }, [quotations, consumption, period]);

    const quotationData = filteredData.quotations;
    const consumptionData = filteredData.consumption;

    // Revenue.
    const totalQuotationValue = quotationData.reduce(
        (total, item) => total + getQuotationTotal(item),
        0
    );

    const acceptedQuotations = quotationData.filter(
        (item) => item.status === "Accepted"
    );

    const acceptedRevenue = acceptedQuotations.reduce(
        (total, item) => total + getQuotationTotal(item),
        0
    );

    // Actual consumption and wastage.
    const totalConsumptionCost = consumptionData.reduce(
        (total, item) => total + item.actualQty * item.price,
        0
    );

    const totalWasteCost = consumptionData.reduce(
        (total, item) => total + item.wastedQty * item.price,
        0
    );

    const totalWasteQuantity = consumptionData.reduce(
        (total, item) => total + item.wastedQty,
        0
    );

    const totalPlannedQuantity = consumptionData.reduce(
        (total, item) => total + item.plannedQty,
        0
    );

    const totalActualQuantity = consumptionData.reduce(
        (total, item) => total + item.actualQty,
        0
    );

    const totalExcess = consumptionData.reduce(
        (total, item) =>
            total + Math.max(item.actualQty - item.plannedQty, 0),
        0
    );

    // Estimated recipe cost for accepted quotations.
    const acceptedCostDetails = acceptedQuotations.map((quotation) => ({
        quotation,
        costing: getQuotationCost(quotation),
    }));

    const estimatedFoodCost = acceptedCostDetails.reduce(
        (total, item) => total + item.costing.totalCost,
        0
    );


    const incompleteCostCount = acceptedCostDetails.filter(
        (item) => !item.costing.complete
    ).length;

    const foodCostPercentage =
        acceptedRevenue > 0
            ? (totalConsumptionCost / acceptedRevenue) * 100
            : 0;

    const estimatedFoodCostPercentage =
        acceptedRevenue > 0
            ? (estimatedFoodCost / acceptedRevenue) * 100
            : 0;

    const actualContribution = acceptedRevenue - totalConsumptionCost;
    const estimatedContribution = acceptedRevenue - estimatedFoodCost;

    const wastagePercentage =
        totalActualQuantity > 0
            ? (totalWasteQuantity / totalActualQuantity) * 100
            : 0;

    const statusCounts = {
        Draft: quotationData.filter((item) => item.status === "Draft").length,
        Sent: quotationData.filter((item) => item.status === "Sent").length,
        Accepted: acceptedQuotations.length,
        Rejected: quotationData.filter((item) => item.status === "Rejected").length,
    };

    // Monthly business performance.
    const monthlyData = useMemo(() => {
        const result: {
            month: string;
            quotationValue: number;
            acceptedValue: number;
            consumptionCost: number;
        }[] = [];

        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            const monthQuotations = quotations.filter((item) => {
                const itemDate = new Date(item.eventDate);

                return (
                    !Number.isNaN(itemDate.getTime()) &&
                    itemDate.getFullYear() === date.getFullYear() &&
                    itemDate.getMonth() === date.getMonth()
                );
            });

            const monthConsumption = consumption.filter((item) => {
                const itemDate = new Date(item.eventDate);

                return (
                    !Number.isNaN(itemDate.getTime()) &&
                    itemDate.getFullYear() === date.getFullYear() &&
                    itemDate.getMonth() === date.getMonth()
                );
            });

            result.push({
                month: date.toLocaleDateString("en-IN", {
                    month: "short",
                    year: "2-digit",
                }),

                quotationValue: monthQuotations.reduce(
                    (sum, item) => sum + getQuotationTotal(item),
                    0
                ),

                acceptedValue: monthQuotations
                    .filter((item) => item.status === "Accepted")
                    .reduce(
                        (sum, item) => sum + getQuotationTotal(item),
                        0
                    ),

                consumptionCost: monthConsumption.reduce(
                    (sum, item) => sum + item.actualQty * item.price,
                    0
                ),
            });
        }

        return result;
    }, [quotations, consumption]);

    const maxMonthlyValue = Math.max(
        1,
        ...monthlyData.flatMap((item) => [
            item.quotationValue,
            item.acceptedValue,
            item.consumptionCost,
        ])
    );

    // Event-wise performance.
    const eventData = acceptedQuotations.map((quotation) => {
        const quotationConsumption = consumptionData.filter(
            (record) => record.quotationId === quotation.id
        );

        const actualCost = quotationConsumption.reduce(
            (total, record) =>
                total + record.actualQty * record.price,
            0
        );

        const costing = getQuotationCost(quotation);
        const revenue = getQuotationTotal(quotation);

        return {
            quotation,
            revenue,
            estimatedCost: costing.totalCost,
            actualCost,
            contribution: revenue - actualCost,
            completeEstimate: costing.complete,
            hasActualRecords: quotationConsumption.length > 0,
        };
    });

    // Ingredient-level wastage analysis.
    const ingredientWasteMap = new Map<
        string,
        {
            name: string;
            unit: string;
            planned: number;
            actual: number;
            wasted: number;
            wasteCost: number;
        }
    >();

    consumptionData.forEach((record) => {
        const key = record.ingredientName.toLowerCase();
        const existing = ingredientWasteMap.get(key);

        if (existing) {
            existing.planned += record.plannedQty;
            existing.actual += record.actualQty;
            existing.wasted += record.wastedQty;
            existing.wasteCost += record.wastedQty * record.price;
        } else {
            ingredientWasteMap.set(key, {
                name: record.ingredientName,
                unit: record.unit,
                planned: record.plannedQty,
                actual: record.actualQty,
                wasted: record.wastedQty,
                wasteCost: record.wastedQty * record.price,
            });
        }
    });

    const ingredientWasteData = Array.from(
        ingredientWasteMap.values()
    ).sort((a, b) => b.wasteCost - a.wasteCost);

    return (
        <div className="reports-page">
            {/* HEADER */}
            <div className="reports-heading">
                <div>
                    <h1>Business Reports & Analytics</h1>
                    <p>
                        Monitor revenue, quotation performance, ingredient
                        costs and wastage.
                    </p>
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="reports-period-select"
                >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* BUSINESS OVERVIEW */}
            <div className="reports-section-title">
                <h2>Business Overview</h2>
                <span>Based on saved MealMate records</span>
            </div>

            <div className="reports-kpi-grid">
                <div className="reports-kpi">
                    <span>Total Quotations</span>
                    <h3>{quotationData.length}</h3>
                    <small>Customer quotations created</small>
                </div>

                <div className="reports-kpi">
                    <span>Accepted Quotation Value</span>
                    <h3>{formatCurrency(acceptedRevenue)}</h3>
                    <small>{acceptedQuotations.length} accepted quotations</small>
                </div>

                <div className="reports-kpi">
                    <span>Actual Consumption Cost</span>
                    <h3>{formatCurrency(totalConsumptionCost)}</h3>
                    <small>Based on recorded actual quantities</small>
                </div>

                <div className="reports-kpi">
                    <span>Actual Food Cost Percentage</span>
                    <h3>{foodCostPercentage.toFixed(1)}%</h3>
                    <small>Actual consumption cost / accepted value</small>
                </div>

                <div className="reports-kpi">
                    <span>Food Wastage Cost</span>
                    <h3>{formatCurrency(totalWasteCost)}</h3>
                    <small>{totalWasteQuantity.toFixed(2)} units wasted</small>
                </div>

                <div className="reports-kpi">
                    <span>Actual Contribution</span>
                    <h3>{formatCurrency(actualContribution)}</h3>
                    <small>Accepted value minus actual food cost</small>
                </div>
            </div>

            {/* ESTIMATED VS ACTUAL COST */}
            <section className="reports-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Estimated vs Actual Cost Analysis</h2>
                        <p>
                            Compare recipe-based estimated food cost with
                            actual ingredient consumption cost.
                        </p>
                    </div>
                </div>

                <div className="reports-quotation-summary">
                    <div>
                        <span>Estimated Food Cost</span>
                        <strong>{formatCurrency(estimatedFoodCost)}</strong>
                    </div>

                    <div>
                        <span>Actual Food Cost</span>
                        <strong>{formatCurrency(totalConsumptionCost)}</strong>
                    </div>

                    <div>
                        <span>Estimated Contribution</span>
                        <strong>{formatCurrency(estimatedContribution)}</strong>
                    </div>

                    <div>
                        <span>Actual Contribution</span>
                        <strong>{formatCurrency(actualContribution)}</strong>
                    </div>
                </div>

                <div style={{
                    marginTop: "18px",
                    padding: "14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                    }}>
                        <span>Estimated food cost</span>
                        <strong>{formatCurrency(estimatedFoodCost)}</strong>
                    </div>

                    <div style={{
                        height: "12px",
                        background: "#e2e8f0",
                        borderRadius: "20px",
                        overflow: "hidden",
                        marginBottom: "16px",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${Math.min(
                                acceptedRevenue > 0
                                    ? (estimatedFoodCost / acceptedRevenue) * 100
                                    : 0,
                                100
                            )}%`,
                            background: "#3b82f6",
                        }} />
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                    }}>
                        <span>Actual food cost</span>
                        <strong>{formatCurrency(totalConsumptionCost)}</strong>
                    </div>

                    <div style={{
                        height: "12px",
                        background: "#e2e8f0",
                        borderRadius: "20px",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${Math.min(
                                acceptedRevenue > 0
                                    ? (totalConsumptionCost / acceptedRevenue) * 100
                                    : 0,
                                100
                            )}%`,
                            background: "#16a34a",
                        }} />
                    </div>
                </div>

                <div style={{
                    marginTop: "14px",
                    color: "#64748b",
                    fontSize: "13px",
                }}>
                    Estimated food cost percentage:{" "}
                    <strong>{estimatedFoodCostPercentage.toFixed(1)}%</strong>
                    {" | "}
                    Actual food cost percentage:{" "}
                    <strong>{foodCostPercentage.toFixed(1)}%</strong>
                </div>

                {incompleteCostCount > 0 && (
                    <p style={{
                        color: "#b45309",
                        fontSize: "13px",
                        marginTop: "12px",
                    }}>
                        Estimated cost is incomplete for {incompleteCostCount}
                        {" "}accepted quotation(s). Some menu items may not have
                        linked recipes or ingredient prices.
                    </p>
                )}

                {acceptedQuotations.length === 0 && (
                    <p className="reports-empty">
                        No accepted quotations available for this period.
                    </p>
                )}
            </section>

            {/* QUOTATION PERFORMANCE */}
            <section className="reports-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Quotation Performance</h2>
                        <p>
                            Distribution of quotations by their current status.
                        </p>
                    </div>
                </div>

                <div className="reports-status-grid">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <div className="reports-status-card" key={status}>
                            <span>{status}</span>
                            <strong>{count}</strong>

                            <div className="reports-status-track">
                                <div
                                    className={`reports-status-fill status-${status.toLowerCase()}`}
                                    style={{
                                        width: `${quotationData.length
                                            ? (count / quotationData.length) * 100
                                            : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reports-quotation-summary">
                    <div>
                        <span>Total quotation value</span>
                        <strong>{formatCurrency(totalQuotationValue)}</strong>
                    </div>

                    <div>
                        <span>Accepted quotation value</span>
                        <strong>{formatCurrency(acceptedRevenue)}</strong>
                    </div>

                    <div>
                        <span>Acceptance rate</span>
                        <strong>
                            {quotationData.length
                                ? `${(
                                    (acceptedQuotations.length /
                                        quotationData.length) *
                                    100
                                ).toFixed(1)}%`
                                : "0%"}
                        </strong>
                    </div>
                </div>
            </section>

            {/* MONTHLY PERFORMANCE */}
            <section className="reports-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Monthly Business Performance</h2>
                        <p>
                            Comparison of quotation value, accepted value
                            and consumption cost over the last six months.
                        </p>
                    </div>
                </div>

                <div className="reports-legend">
                    <span>
                        <i className="legend-quotation" /> Quotation value
                    </span>
                    <span>
                        <i className="legend-accepted" /> Accepted value
                    </span>
                    <span>
                        <i className="legend-cost" /> Consumption cost
                    </span>
                </div>

                <div className="reports-monthly-chart">
                    {monthlyData.map((item) => (
                        <div className="reports-month-column" key={item.month}>
                            <div className="reports-bars">
                                <div
                                    className="reports-bar bar-quotation"
                                    style={{
                                        height: `${(item.quotationValue / maxMonthlyValue) * 100
                                            }%`,
                                    }}
                                    title={`Quotation value: ${formatCurrency(item.quotationValue)}`}
                                />

                                <div
                                    className="reports-bar bar-accepted"
                                    style={{
                                        height: `${(item.acceptedValue / maxMonthlyValue) * 100
                                            }%`,
                                    }}
                                    title={`Accepted value: ${formatCurrency(item.acceptedValue)}`}
                                />

                                <div
                                    className="reports-bar bar-cost"
                                    style={{
                                        height: `${(item.consumptionCost / maxMonthlyValue) * 100
                                            }%`,
                                    }}
                                    title={`Consumption cost: ${formatCurrency(item.consumptionCost)}`}
                                />
                            </div>

                            <span>{item.month}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* EVENT-WISE ANALYSIS */}
            <section className="reports-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Event-wise Profitability Analysis</h2>
                        <p>
                            Compare quotation revenue, estimated cost and
                            actual consumption cost for accepted events.
                        </p>
                    </div>
                </div>

                <div className="reports-table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Quotation</th>
                                <th>Customer</th>
                                <th>Revenue</th>
                                <th>Estimated Cost</th>
                                <th>Actual Cost</th>
                                <th>Contribution</th>
                                <th>Records</th>
                            </tr>
                        </thead>

                        <tbody>
                            {eventData.map((item) => (
                                <tr key={item.quotation.id}>
                                    <td>{item.quotation.quotationNumber}</td>
                                    <td>{item.quotation.customerName}</td>
                                    <td>{formatCurrency(item.revenue)}</td>
                                    <td>
                                        {item.completeEstimate
                                            ? formatCurrency(item.estimatedCost)
                                            : `${formatCurrency(item.estimatedCost)}*`}
                                    </td>
                                    <td>
                                        {formatCurrency(item.actualCost)}
                                    </td>
                                    <td>
                                        {item.hasActualRecords
                                            ? formatCurrency(item.contribution)
                                            : "Pending"}
                                    </td>
                                    <td>
                                        {item.hasActualRecords
                                            ? "Recorded"
                                            : "Pending"}
                                    </td>
                                </tr>
                            ))}

                            {eventData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="reports-empty">
                                        No accepted events available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p style={{
                    color: "#64748b",
                    fontSize: "12px",
                    marginTop: "12px",
                }}>
                    * Estimated costs may be incomplete if recipe links or
                    ingredient prices are missing. Actual event costs are
                    associated using the quotation ID saved in consumption records.
                </p>
            </section>

            {/* COST AND WASTAGE */}
            <div className="reports-lower-grid">
                <section className="reports-panel">
                    <h2>Cost & Wastage Analysis</h2>

                    <div className="reports-analysis-row">
                        <span>Total consumption cost</span>
                        <strong>{formatCurrency(totalConsumptionCost)}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Estimated wastage cost</span>
                        <strong>{formatCurrency(totalWasteCost)}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Wastage as % of actual consumption</span>
                        <strong>{wastagePercentage.toFixed(1)}%</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Total planned quantity</span>
                        <strong>{totalPlannedQuantity.toFixed(2)}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Total actual quantity</span>
                        <strong>{totalActualQuantity.toFixed(2)}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Excess consumption quantity</span>
                        <strong>{totalExcess.toFixed(2)}</strong>
                    </div>
                </section>

                <section className="reports-panel">
                    <h2>Management Snapshot</h2>

                    <div className="reports-analysis-row">
                        <span>Ingredients in price list</span>
                        <strong>{ingredients.length}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Available recipes</span>
                        <strong>{recipes.length}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Serving standards configured</span>
                        <strong>{servingStandards.length}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Recorded price updates</span>
                        <strong>{priceUpdates}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Consumption records</span>
                        <strong>{consumptionData.length}</strong>
                    </div>

                    <div className="reports-analysis-row">
                        <span>Quotation records</span>
                        <strong>{quotationData.length}</strong>
                    </div>
                </section>
            </div>

            {/* INGREDIENT WASTAGE TABLE */}
            <section className="reports-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Ingredient-wise Wastage Analysis</h2>
                        <p>
                            Identify ingredients contributing most to
                            recorded wastage costs.
                        </p>
                    </div>
                </div>

                <div className="reports-table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Planned</th>
                                <th>Actual</th>
                                <th>Wasted</th>
                                <th>Wastage Cost</th>
                            </tr>
                        </thead>

                        <tbody>
                            {ingredientWasteData.map((item) => (
                                <tr key={item.name}>
                                    <td>{item.name}</td>
                                    <td>
                                        {item.planned.toFixed(2)} {item.unit}
                                    </td>
                                    <td>
                                        {item.actual.toFixed(2)} {item.unit}
                                    </td>
                                    <td>
                                        {item.wasted.toFixed(2)} {item.unit}
                                    </td>
                                    <td>{formatCurrency(item.wasteCost)}</td>
                                </tr>
                            ))}

                            {ingredientWasteData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="reports-empty">
                                        No ingredient wastage records available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* RECENT QUOTATIONS */}
            <section className="reports-panel reports-recent-panel">
                <div className="reports-panel-heading">
                    <div>
                        <h2>Recent Quotations</h2>
                        <p>
                            Latest customer quotations saved in the system.
                        </p>
                    </div>
                </div>

                <div className="reports-table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Quotation No.</th>
                                <th>Customer</th>
                                <th>Event Date</th>
                                <th>Guests</th>
                                <th>Quotation Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {[...quotationData]
                                .sort(
                                    (a, b) =>
                                        new Date(b.createdAt).getTime() -
                                        new Date(a.createdAt).getTime()
                                )
                                .slice(0, 5)
                                .map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.quotationNumber}</td>
                                        <td>{item.customerName}</td>
                                        <td>{formatDate(item.eventDate)}</td>
                                        <td>{item.guests}</td>
                                        <td>
                                            {formatCurrency(getQuotationTotal(item))}
                                        </td>
                                        <td>
                                            <span
                                                className={`reports-status-badge badge-${item.status.toLowerCase()}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                            {quotationData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="reports-empty">
                                        No quotation records available for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <p className="reports-disclaimer">
                Reporting note: These figures are calculated from locally saved
                MealMate records. Accepted quotation value is an estimate of
                booked business, not verified cash received. Actual contribution
                excludes labour, transport, overheads, taxes and other costs.
                Estimated recipe costs depend on linked recipes, ingredient
                prices and serving standards. Event-wise actual costs require
                consumption records linked to their quotation IDs.
            </p>
        </div>
    );
}

export default ReportsPage;
