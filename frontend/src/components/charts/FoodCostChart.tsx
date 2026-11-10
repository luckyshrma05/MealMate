import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { getAllConsumptionRecords } from "../../services/consumptionService";

const COLORS = ["#2563eb", "#0d9488", "#f59e0b", "#8b5cf6", "#64748b", "#ec4899"];

function FoodCostChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [totalVolume, setTotalVolume] = useState(0);

    useEffect(() => {
        const loadChart = async () => {
            try {
                const records = await getAllConsumptionRecords();
                const categoryVolume = new Map<string, number>();

                records.forEach((record: any) => {
                    const consumed = Number(record.consumed || 0);
                    if (consumed <= 0) return;

                    const category = record.dish?.category || "Uncategorized";
                    categoryVolume.set(category, (categoryVolume.get(category) || 0) + consumed);
                });

                const data = Array.from(categoryVolume.entries()).map(([name, value]) => ({ name, value }));
                const total = data.reduce((sum, item) => sum + item.value, 0);

                setChartData(data);
                setTotalVolume(total);
            } catch (error) {
                console.error("Unable to load consumption data:", error);
            }
        };
        loadChart();
    }, []);

    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Consumption by Category</h3>
                <p>Total volume consumed across dish categories</p>
            </div>

            {chartData.length > 0 ? (
                <>
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>Total Volume Consumed</span>
                        <h3 style={{ margin: "4px 0" }}>{totalVolume.toFixed(1)} units</h3>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={100}
                                paddingAngle={4}
                                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)} units`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </>
            ) : (
                <p style={{ textAlign: "center", padding: "100px 10px", color: "#64748b" }}>
                    No consumption data available yet.
                </p>
            )}
        </div>
    );
}

export default FoodCostChart;