
import { Bell, Search, UserCircle } from "lucide-react";

interface HeaderProps {
    title: string;
}

function Header({ title }: HeaderProps) {
    return (
        <header className="dashboard-header">
            <div className="header-title">
                <h1>{title}</h1>
                <p>Welcome back to MealMate administration.</p>
            </div>

            <div className="header-actions">
                <button
                    className="header-icon-button"
                    aria-label="Search"
                    type="button"
                >
                    <Search size={20} />
                </button>

                <button
                    className="header-icon-button notification-button"
                    aria-label="Notifications"
                    type="button"
                >
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>

                <div className="header-profile">
                    <UserCircle size={32} />
                    <div>
                        <strong>Administrator</strong>
                        <span>Admin</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
