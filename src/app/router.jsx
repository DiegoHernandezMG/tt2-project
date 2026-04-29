import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "../layouts/public-layout";

// Public pages
import Home from "../pages/public/home/home";
import About from "../pages/public/about/about";
import Start from "../pages/public/start/start";
import FAQ from "../pages/public/faq/faq";

// Admin pages
import Login from "../pages/admin/login/login";
import Dashboard from "../pages/admin/dashboard/dashboard";
import UsersPage from "../pages/admin/users/users";
import ActivatePage from "../pages/admin/activate/activate";
import ResetPasswordPage from "../pages/admin/reset-password/reset-password";
import MobileResetPasswordPage from "../pages/public/mobile-reset-password/mobile-reset-password";
import MobileVerifyEmailPage from "../pages/public/mobile-verify-email/mobile-verify-email";
import ProfilePage from "../pages/admin/profile/profile";
import { ADMIN_ROLES } from "../constants/admin";

// Auth
import ProtectedRoute from "../components/protected-route";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌍 Web pública con layout */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/nosotros"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/comenzar"
          element={
            <PublicLayout>
              <Start />
            </PublicLayout>
          }
        />

        <Route
          path="/faq"
          element={
            <PublicLayout>
              <FAQ />
            </PublicLayout>
          }
        />

        {/* 🔐 Admin */}
        <Route path="/mobile-reset-password" element={<MobileResetPasswordPage />} />
        <Route path="/mobile-verify-email" element={<MobileVerifyEmailPage />} />

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/activate" element={<ActivatePage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPER_ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
