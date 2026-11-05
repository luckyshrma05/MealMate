
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";

const foodCostData = [
    { name: "Vegetables", value: 30 },
    { name: "Grains", value: 25 },
    { name: "Dairy", value: 20 },
    { name: "Meat", value: 15 },
    { name: "Others", value: 10 },
];

const COLORS = [
    "#2563eb",
    "#0d9488",
    "#f59e0b",
    "#8b5cf6",
    "#64748b",
];

function FoodCostChart() {
    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Food Cost Analysis</h3>
                <p>Distribution of food expenditure</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
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
                    >
                        {foodCostData.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={COLORS[index]}
                            />
                        ))}
                    </Pie>

                    <Tooltip formatter={(value) => `${value}%`} />

                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default FoodCostChart;
