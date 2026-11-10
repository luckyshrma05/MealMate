import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getAllQuotations } from "../../services/quotationService";

interface RevenueData {
    month: string;
    quotationValue: number;
}

function RevenueChart() {
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

    useEffect(() => {
        const loadChart = async () => {
            try {
                const quotations = await getAllQuotations();
                const now = new Date();
                const data: RevenueData[] = [];

                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    
                    const monthQuotations = quotations.filter((q: any) => {
                        const qDate = new Date(q.createdAt);
                        return qDate.getFullYear() === date.getFullYear() && qDate.getMonth() === date.getMonth();
                    });

                    const quotationValue = monthQuotations.reduce((sum: number, q: any) => sum + (q.totalCost || 0), 0);

                    data.push({
                        month: date.toLocaleDateString("en-IN", { month: "short" }),
                        quotationValue,
                    });
                }
                setRevenueData(data);
            } catch (error) {
                console.error("Unable to load revenue data:", error);
            }
        };
        loadChart();
    }, []);

    const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Revenue Overview</h3>
                <p>Monthly quoted value generation</p>
            </div>

            {revenueData.some((item) => item.quotationValue > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="quotationValue"
                            name="Total Quoted Value"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p style={{ textAlign: "center", padding: "100px 10px", color: "#64748b" }}>
                    No quotation revenue data available yet.
                </p>
            )}
        </div>
    );
}

export default RevenueChart;