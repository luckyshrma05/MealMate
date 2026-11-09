import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoutes";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/createEvent";
import SelectDishes from "./pages/selectDishes";


import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import PricingPage from "./pages/pricing/PricingPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import ConsumptionPage from "./pages/consumption/ConsumptionPage";
import ReportsPage from "./pages/reports/ReportsPage";
import RecipesPage from "./pages/recipes/RecipesPage";
import ConfigurationPage from "./pages/configuration/ConfigurationPage";

function App() {
  return (
    <Routes>
      
      <Route path="/login" element={<Login />} />

      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path="/events/:eventId/dishes" element={<ProtectedRoute><SelectDishes /></ProtectedRoute>} />

      
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="consumption" element={<ConsumptionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="configuration" element={<ConfigurationPage />} />
      </Route>

      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;