
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

const revenueData = [
    { month: "Jan", revenue: 25000 },
    { month: "Feb", revenue: 32000 },
    { month: "Mar", revenue: 28000 },
    { month: "Apr", revenue: 45000 },
    { month: "May", revenue: 52000 },
    { month: "Jun", revenue: 48000 },
    { month: "Jul", revenue: 65000 },
    { month: "Aug", revenue: 72000 },
    { month: "Sep", revenue: 60000 },
    { month: "Oct", revenue: 85000 },
    { month: "Nov", revenue: 78000 },
    { month: "Dec", revenue: 95000 },
];

function RevenueChart() {
    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Revenue Overview</h3>
                <p>Monthly revenue performance</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip
                        formatter={(value) =>
                            `₹${Number(value).toLocaleString("en-IN")}`
                        }
                    />

                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default RevenueChart;
