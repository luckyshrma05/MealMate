
import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";

interface ConsumptionRecord {
    ingredientName: string;
    price: number;
    actualQty: number;
}

interface Ingredient {
    id: string;
    name: string;
    category?: string;
}

interface FoodCostData {
    name: string;
    value: number;
}

const COLORS = [
    "#2563eb",
    "#0d9488",
    "#f59e0b",
    "#8b5cf6",
    "#64748b",
    "#ec4899",
    "#0891b2",
    "#65a30d",
];

function FoodCostChart() {
    const [foodCostData, setFoodCostData] = useState<FoodCostData[]>([]);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        try {
            const savedConsumption =
                localStorage.getItem("mealmate_consumption");

            const savedIngredients =
                localStorage.getItem("mealmate_ingredients");

            const consumption: ConsumptionRecord[] =
                savedConsumption ? JSON.parse(savedConsumption) : [];

            const ingredients: Ingredient[] =
                savedIngredients ? JSON.parse(savedIngredients) : [];

            const categoryCosts = new Map<string, number>();

            consumption.forEach((record) => {
                const actualCost =
                    Number(record.actualQty || 0) *
                    Number(record.price || 0);

                if (actualCost <= 0) return;

                const ingredient = ingredients.find(
                    (item) =>
                        item.name.trim().toLowerCase() ===
                        record.ingredientName.trim().toLowerCase()
                );

                const category = ingredient?.category || "Others";

                categoryCosts.set(
                    category,
                    (categoryCosts.get(category) || 0) + actualCost
                );
            });

            const data = Array.from(categoryCosts.entries()).map(
                ([name, value]) => ({
                    name,
                    value,
                })
            );

            const total = data.reduce(
                (sum, item) => sum + item.value,
                0
            );

            setFoodCostData(data);
            setTotalCost(total);
        } catch (error) {
            console.error("Unable to load food cost data:", error);
            setFoodCostData([]);
            setTotalCost(0);
        }
    }, []);

    const formatCurrency = (value: number) =>
        `₹${value.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        })}`;

    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Food Cost Analysis</h3>
                <p>Actual ingredient expenditure by category</p>
            </div>

            {foodCostData.length > 0 ? (
                <>
                    <div style={{
                        textAlign: "center",
                        marginBottom: "8px",
                    }}>
                        <span style={{
                            color: "#64748b",
                            fontSize: "13px",
                        }}>
                            Total Consumption Cost
                        </span>

                        <h3 style={{ margin: "4px 0" }}>
                            {formatCurrency(totalCost)}
                        </h3>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={foodCostData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={100}
                                paddingAngle={4}
                                label={({ percent }) =>
                                    `${((percent ?? 0) * 100).toFixed(1)}%`
                                }
                            >
                                {foodCostData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                formatter={(value) =>
                                    formatCurrency(Number(value))
                                }
                            />

                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </>
            ) : (
                <p style={{
                    textAlign: "center",
                    padding: "100px 10px",
                    color: "#64748b",
                }}>
                    No actual consumption cost data available yet.
                </p>
            )}
        </div>
    );
}

export default FoodCostChart;
