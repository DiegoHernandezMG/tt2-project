import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { adminSupabase } from "../../lib/supabase-admin";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from "../../constants/admin";
import { useAuth } from "../../hooks/use-auth";
import "./admin-topbar.css";

function AdminTopbar() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const roleLabel = loading
    ? "Cargando..."
    : ADMIN_ROLE_LABELS[profile?.role] || profile?.role || "Sin rol";
  const displayName = loading ? "Cargando..." : profile?.fullName || "Usuario";

  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await adminSupabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="admin-topbar card">
      <div>
        <p className="purplelabel">Panel administrativo</p>
        <p className="admin-topbar__user">{displayName} · {roleLabel}</p>
      </div>

      <div className="admin-topbar__controls">
        <nav className="admin-topbar__nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>
            Pacientes
          </NavLink>
          {profile?.role === ADMIN_ROLES.SUPER_ADMIN && (
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="admin-topbar__right">
          <NavLink to="/admin/profile" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>
            Mi perfil
          </NavLink>
          <button type="button" className="button admin-access-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <button className="admin-topbar__toggle" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
        ☰
      </button>

      {createPortal(
        <>
          {open && <div className="admin-drawer__overlay" onClick={close} />}
          <div className={`admin-drawer ${open ? "is-open" : ""}`}>
            <button className="admin-drawer__close" onClick={close} aria-label="Cerrar menú">✕</button>

            <div className="admin-drawer__user">
              <p className="admin-drawer__user-name">{displayName}</p>
              <p className="admin-drawer__user-role">{roleLabel}</p>
            </div>

            <ul className="admin-drawer__links">
              <li>
                <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"} onClick={close}>
                  Pacientes
                </NavLink>
              </li>
              {profile?.role === ADMIN_ROLES.SUPER_ADMIN && (
                <li>
                  <NavLink to="/admin/users" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>
                    Admin
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink to="/admin/profile" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>
                  Mi perfil
                </NavLink>
              </li>
            </ul>

            <div className="admin-drawer__footer">
              <button type="button" className="button admin-access-button admin-drawer__logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}

export default AdminTopbar;
