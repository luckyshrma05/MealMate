
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import SectionPlaceholder from "./pages/admin/SectionPlaceholder";
import PricingPage from "./pages/pricing/PricingPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import ConsumptionPage from "./pages/consumption/ConsumptionPage";

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
          element={<SectionPlaceholder title="Business Reports" />}
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
