import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { ADMIN_STATUS } from "../constants/admin";

function ProtectedRoute({ children, allowedRoles = null, requireActive = true }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
  if (!user) return <Navigate to="/admin/login" />;
  if (requireActive && profile?.status !== ADMIN_STATUS.ACTIVE) {
    return <Navigate to="/admin/login" replace />;
  }
  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profile?.role)
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
