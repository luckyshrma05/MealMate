
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

import "./AdminLayout.css";

function AdminLayout() {
    const location = useLocation();

    const pageTitles: Record<string, string> = {
        "/admin": "Dashboard",
        "/admin/pricing": "Pricing Management",
        "/admin/quotations": "Quotations",
        "/admin/consumption": "Food Consumption",
        "/admin/reports": "Business Reports",
    };

    const currentTitle = pageTitles[location.pathname] || "MealMate Admin";

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="admin-main">
                <Header title={currentTitle} />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
