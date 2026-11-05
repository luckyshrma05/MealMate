

import {
    FileText,
    IndianRupee,
    Utensils,
    TrendingDown,
} from "lucide-react";

import "./AdminDashboardPage.css";
import RevenueChart from "../../components/charts/RevenueChart";
import FoodCostChart from "../../components/charts/FoodCostChart";

const dashboardStats = [
    {
        title: "Total Quotations",
        value: "128",
        description: "Total quotations generated",
        icon: FileText,
    },
    {
        title: "Total Revenue",
        value: "₹4,80,000",
        description: "Revenue generated",
        icon: IndianRupee,
    },
    {
        title: "Food Cost",
        value: "32%",
        description: "Percentage of revenue",
        icon: Utensils,
    },
    {
        title: "Food Wastage",
        value: "4.2%",
        description: "Estimated food wastage",
        icon: TrendingDown,
    },
];



function AdminDashboardPage() {
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
