
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
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

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Dashboard Layout */}
      <Route path="/admin" element={<AdminLayout />}>

        {/* Default Admin Dashboard */}
        <Route index element={<AdminDashboardPage />} />

        {/* Other Admin Sections */}
        <Route
          path="pricing"
          element={<PricingPage />}
        />

        <Route
          path="quotations"
          element={<QuotationsPage />}
        />

        <Route
          path="consumption"
          element={<ConsumptionPage />}
        />

        <Route
          path="reports"
          element={<ReportsPage />}
        />
        <Route
          path="recipes"
          element={<RecipesPage />} />
        <Route
          path="configuration"
          element={<ConfigurationPage />}
        />

      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Invalid Routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;
