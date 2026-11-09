
import { useEffect, useState } from "react";

import {
    FileText,
    IndianRupee,
    Utensils,
    TrendingDown,
} from "lucide-react";

import "./AdminDashboardPage.css";
import RevenueChart from "../../components/charts/RevenueChart";
import FoodCostChart from "../../components/charts/FoodCostChart";

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
    eventDate: string;
    items: QuotationItem[];
    status: "Draft" | "Sent" | "Accepted" | "Rejected";
    createdAt: string;
}

interface ConsumptionRecord {
    id: string;
    eventName: string;
    eventDate: string;
    ingredientName: string;
    price: number;
    plannedQty: number;
    actualQty: number;
    wastedQty: number;
}

interface DashboardStat {
    title: string;
    value: string;
    description: string;
    icon: typeof FileText;
}

function readStorage<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) as T : fallback;
    } catch {
        return fallback;
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function AdminDashboardPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [consumption, setConsumption] = useState<ConsumptionRecord[]>([]);

    useEffect(() => {
        setQuotations(
            readStorage<Quotation[]>("mealmate_quotations", [])
        );

        setConsumption(
            readStorage<ConsumptionRecord[]>("mealmate_consumption", [])
        );
    }, []);

    // Accepted quotation value.
    const acceptedQuotations = quotations.filter(
        (quotation) => quotation.status === "Accepted"
    );

    const acceptedRevenue = acceptedQuotations.reduce(
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

    // Actual consumption cost.
    const actualConsumptionCost = consumption.reduce(
        (total, record) =>
            total +
            Number(record.actualQty || 0) *
            Number(record.price || 0),
        0
    );

    // Wastage cost.
    const wastageCost = consumption.reduce(
        (total, record) =>
            total +
            Number(record.wastedQty || 0) *
            Number(record.price || 0),
        0
    );

    // Food cost percentage.
    const foodCostPercentage =
        acceptedRevenue > 0
            ? (actualConsumptionCost / acceptedRevenue) * 100
            : 0;

    // Wastage cost percentage.
    const wastagePercentage =
        actualConsumptionCost > 0
            ? (wastageCost / actualConsumptionCost) * 100
            : 0;

    const dashboardStats: DashboardStat[] = [
        {
            title: "Total Quotations",
            value: String(quotations.length),
            description: `${acceptedQuotations.length} accepted quotations`,
            icon: FileText,
        },
        {
            title: "Accepted Revenue",
            value: formatCurrency(acceptedRevenue),
            description: "Value of accepted quotations",
            icon: IndianRupee,
        },
        {
            title: "Food Cost",
            value: `${foodCostPercentage.toFixed(1)}%`,
            description: "Actual consumption cost / accepted revenue",
            icon: Utensils,
        },
        {
            title: "Food Wastage",
            value: `${wastagePercentage.toFixed(1)}%`,
            description: "Wastage cost / actual consumption cost",
            icon: TrendingDown,
        },
    ];

    return (
        <div className="dashboard-page">

            <div className="dashboard-heading">
                <h2>Business Overview</h2>
                <p>Here's what's happening with your business.</p>
            </div>

            <div className="dashboard-stats">

                {dashboardStats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={stat.title}>

                            <div className="stat-card-top">
                                <span>{stat.title}</span>

                                <div className="stat-icon">
                                    <Icon size={22} />
                                </div>
                            </div>

                            <h3>{stat.value}</h3>

                            <p>{stat.description}</p>

                        </div>
                    );
                })}

            </div>

            <RevenueChart />

            <FoodCostChart />

        </div>
    );
}

export default AdminDashboardPage;
