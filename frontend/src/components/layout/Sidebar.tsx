
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    IndianRupee,
    FileText,
    Utensils,
    BarChart3,
    ChefHat,
    Settings,
} from "lucide-react";

const navigationItems = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
    },
    {
        name: "Pricing",
        path: "/admin/pricing",
        icon: IndianRupee,
    },
    {
        name: "Quotations",
        path: "/admin/quotations",
        icon: FileText,
    },
    {
        name: "Consumption",
        path: "/admin/consumption",
        icon: Utensils,
    },
    {
        name: "Reports",
        path: "/admin/reports",
        icon: BarChart3,
    },
    {
        name: "Recipes",
        path: "/admin/recipes",
        icon: ChefHat,
    },
    {
        name: "Serving Standards",
        path: "/admin/configuration",
        icon: Settings
    },
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <ChefHat size={30} />
                <h2>MealMate</h2>
            </div>

            <p className="sidebar-heading">MAIN MENU</p>

            <nav className="sidebar-nav">
                {navigationItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.path === "/admin"}
                            className={({ isActive }) =>
                                isActive ? "sidebar-link active" : "sidebar-link"
                            }
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <p>MealMate Admin</p>
                <span>Management Portal</span>
            </div>
        </aside>
    );
}

export default Sidebar;