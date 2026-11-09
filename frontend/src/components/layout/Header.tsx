import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { AuthContext } from "../../context/authContext";

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth?.logout();
    navigate("/login");
  };

  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h1>{title}</h1>
        <p>Welcome back to MealMate administration.</p>
      </div>

      <div className="header-actions">
        <button className="header-icon-button" aria-label="Search" type="button">
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
            <strong>{auth?.user?.name || "Administrator"}</strong>
            <span>{auth?.user?.role || "Admin"}</span>
          </div>
        </div>

        <button
          className="header-icon-button"
          aria-label="Logout"
          type="button"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;