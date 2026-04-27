import { NavLink, useNavigate } from "react-router-dom";
import { adminSupabase } from "../../lib/supabase-admin";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from "../../constants/admin";
import { useAuth } from "../../hooks/use-auth";
import "./admin-topbar.css";

function AdminTopbar() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const roleLabel = loading
    ? "Cargando..."
    : ADMIN_ROLE_LABELS[profile?.role] || profile?.role || "Sin rol";
  const displayName = loading ? "Cargando..." : profile?.fullName || "Usuario";

  const handleLogout = async () => {
    await adminSupabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="admin-topbar card">
      <div>
        <p className="purplelabel">Panel administrativo</p>
        <p className="admin-topbar__user">
          {displayName} · {roleLabel}
        </p>
      </div>

      <div className="admin-topbar__controls">
        <nav className="admin-topbar__nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link is-active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>

          {profile?.role === ADMIN_ROLES.SUPER_ADMIN ? (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
            >
              Usuarios
            </NavLink>
          ) : null}
        </nav>

        <div className="admin-topbar__right">
          <NavLink
            to="/admin/profile"
            className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}
          >
            Mi perfil
          </NavLink>
          <button
            type="button"
            className="button admin-access-button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
