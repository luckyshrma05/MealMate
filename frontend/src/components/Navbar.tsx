import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h1
        onClick={() => navigate(auth?.user ? '/dashboard' : '/login')}
        className="text-2xl font-bold text-gray-900 cursor-pointer"
      >
        MealMate
      </h1>


      {isDashboard && auth?.user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">
            Hello, {auth.user.name}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}