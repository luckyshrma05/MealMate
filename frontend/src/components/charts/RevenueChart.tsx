
import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface QuotationItem {
    id: number;
    name: string;
    quantity: number;
    rate: number;
}

interface Quotation {
    id: number;
    eventDate: string;
    items: QuotationItem[];
    status: "Draft" | "Sent" | "Accepted" | "Rejected";
}

interface RevenueData {
    month: string;
    quotationValue: number;
    acceptedRevenue: number;
}

function RevenueChart() {
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("mealmate_quotations");
            const quotations: Quotation[] = saved ? JSON.parse(saved) : [];

            const now = new Date();
            const data: RevenueData[] = [];

            for (let i = 11; i >= 0; i--) {
                const date = new Date(
                    now.getFullYear(),
                    now.getMonth() - i,
                    1
                );

                const monthQuotations = quotations.filter((quotation) => {
                    const eventDate = new Date(quotation.eventDate);

                    return (
                        !Number.isNaN(eventDate.getTime()) &&
                        eventDate.getFullYear() === date.getFullYear() &&
                        eventDate.getMonth() === date.getMonth()
                    );
                });

                const quotationValue = monthQuotations.reduce(
                    (total, quotation) =>
                        total +
                        (quotation.items || []).reduce(
                            (sum, item) =>
                                sum +
                                Number(item.quantity || 0) *
                                Number(item.rate || 0),
                            0
                        ),
                    0
                );

                const acceptedRevenue = monthQuotations
                    .filter((quotation) => quotation.status === "Accepted")
                    .reduce(
                        (total, quotation) =>
                            total +
                            (quotation.items || []).reduce(
                                (sum, item) =>
                                    sum +
                                    Number(item.quantity || 0) *
                                    Number(item.rate || 0),
                                0
                            ),
                        0
                    );

                data.push({
                    month: date.toLocaleDateString("en-IN", {
                        month: "short",
                    }),
                    quotationValue,
                    acceptedRevenue,
                });
            }

            setRevenueData(data);
        } catch (error) {
            console.error("Unable to load revenue data:", error);
            setRevenueData([]);
        }
    }, []);

    const formatCurrency = (value: number) =>
        `₹${value.toLocaleString("en-IN")}`;

    return (
        <div className="chart-card">
            <div className="chart-heading">
                <h3>Revenue Overview</h3>
                <p>Monthly quotation value and accepted revenue</p>
            </div>

            {revenueData.some(
                (item) => item.quotationValue > 0
            ) ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="month" />

                        <YAxis
                            tickFormatter={(value) =>
                                `₹${Number(value).toLocaleString("en-IN")}`
                            }
                        />

                        <Tooltip
                            formatter={(value) =>
                                formatCurrency(Number(value))
                            }
                        />

                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="quotationValue"
                            name="Total Quotation Value"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />

                        <Line
                            type="monotone"
                            dataKey="acceptedRevenue"
                            name="Accepted Revenue"
                            stroke="#0d9488"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p style={{
                    textAlign: "center",
                    padding: "100px 10px",
                    color: "#64748b",
                }}>
                    No quotation revenue data available yet.
                </p>
            )}
        </div>
    );
}

export default RevenueChart;
