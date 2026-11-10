import { useEffect, useState } from "react";
import { FileText, IndianRupee, Utensils, TrendingDown } from "lucide-react";
import { getAllQuotations } from "../../services/quotationService";
import { getAdminWasteReport } from "../../services/reportService";
import RevenueChart from "../../components/charts/RevenueChart";
import FoodCostChart from "../../components/charts/FoodCostChart";
import "./AdminDashboardPage.css";

interface DashboardStat {
    title: string;
    value: string;
    description: string;
    icon: any;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function AdminDashboardPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        getAllQuotations().then(setQuotations).catch(console.error);
        getAdminWasteReport().then(setReport).catch(console.error);
    }, []);

    // Calculate live KPIs
    const totalQuotedValue = quotations.reduce((total, q) => total + (q.totalCost || 0), 0);
    
    let totalPrepared = 0;
    let totalWasted = 0;

    if (report?.unitBreakdown) {
        report.unitBreakdown.forEach((item: any) => {
            totalPrepared += item.prepared;
            totalWasted += item.waste;
        });
    }

    const globalWastePercentage = totalPrepared > 0 ? (totalWasted / totalPrepared) * 100 : 0;

    const dashboardStats: DashboardStat[] = [
        {
            title: "Total Quotations",
            value: String(quotations.length),
            description: "Total quotations generated",
            icon: FileText,
        },
        {
            title: "Quoted Revenue",
            value: formatCurrency(totalQuotedValue),
            description: "Total value of all quotations",
            icon: IndianRupee,
        },
        {
            title: "Dishes Prepared",
            value: String(totalPrepared),
            description: "Total volume prepared across events",
            icon: Utensils,
        },
        {
            title: "Global Food Wastage",
            value: `${globalWastePercentage.toFixed(1)}%`,
            description: "Overall wastage across all events",
            icon: TrendingDown,
        },
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-heading">
                <h2>Business Overview</h2>
                <p>Live metrics from your MealMate database.</p>
            </div>

            <div className="dashboard-stats">
                {dashboardStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div className="stat-card" key={stat.title}>
                            <div className="stat-card-top">
                                <span>{stat.title}</span>
                                <div className="stat-icon"><Icon size={22} /></div>
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