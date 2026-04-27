import { useState } from "react";
import AdminTopbar from "../../../components/admin-topbar/admin-topbar";
import { ADMIN_ROLE_LABELS, ADMIN_STATUS_LABELS } from "../../../constants/admin";
import { useAuth } from "../../../hooks/use-auth";
import { adminSupabase } from "../../../lib/supabase-admin";
import { updateAdminProfile } from "../../../services/admin-users";
import "./profile.css";

const fmt = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [nombre, setNombre] = useState(profile?.fullName?.split(" ")[0] || "");
  const [apellido, setApellido] = useState(
    profile?.fullName?.split(" ").slice(1).join(" ") || "",
  );
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  const handleUpdateName = async (event) => {
    event.preventDefault();
    setNameError("");
    setNameSuccess(false);
    if (!nombre.trim()) { setNameError("El nombre es obligatorio."); return; }
    setNameLoading(true);
    try {
      await updateAdminProfile({ adminId: profile.id, nombre, apellido });
      await refreshProfile();
      setNameSuccess(true);
    } catch (err) {
      setNameError(err.message || "No se pudo actualizar el nombre.");
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPassError("");
    setPassSuccess(false);
    if (newPassword.length < 8) { setPassError("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (newPassword !== confirmPassword) { setPassError("Las contraseñas no coinciden."); return; }

    setPassLoading(true);
    try {
      const { error: signInError } = await adminSupabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error("La contraseña actual es incorrecta.");

      const { error: updateError } = await adminSupabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);

      setPassSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="page profile-page">
      <section className="section">
        <div className="container">
          <AdminTopbar />

          <div className="profile-grid">
            {/* Info card */}
            <div className="card profile-info-card">
              <p className="purplelabel">Tu cuenta</p>
              <p className="profile-name">{profile?.fullName || "—"}</p>

              <div className="profile-info-list">
                <div className="profile-info-row">
                  <span className="stat-label">Correo</span>
                  <span>{user?.email || "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span className="stat-label">Rol</span>
                  <span>{ADMIN_ROLE_LABELS[profile?.role] || profile?.role || "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span className="stat-label">Estado</span>
                  <span>{ADMIN_STATUS_LABELS[profile?.status] || profile?.status || "—"}</span>
                </div>
                <div className="profile-info-row">
                  <span className="stat-label">Último acceso</span>
                  <span>{fmt(profile?.lastLoginAt)}</span>
                </div>
              </div>
            </div>

            <div className="profile-right-col">
              {/* Edit name card */}
              <form className="card profile-form-card" onSubmit={handleUpdateName}>
                <p className="purplelabel">Editar perfil</p>
                <p className="profile-section-title">Nombre</p>

                <label className="login-label" htmlFor="profile-nombre">Nombre</label>
                <input
                  id="profile-nombre"
                  className="login-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setNameSuccess(false); setNameError(""); }}
                  placeholder="Tu nombre"
                  required
                />

                <label className="login-label" htmlFor="profile-apellido">Apellido</label>
                <input
                  id="profile-apellido"
                  className="login-input"
                  type="text"
                  value={apellido}
                  onChange={(e) => { setApellido(e.target.value); setNameSuccess(false); setNameError(""); }}
                  placeholder="Tu apellido"
                />

                <button
                  type="submit"
                  className="button admin-access-button profile-submit"
                  disabled={nameLoading}
                >
                  {nameLoading ? "Guardando..." : "Guardar nombre"}
                </button>

                {nameSuccess && <p className="profile-success">Nombre actualizado correctamente.</p>}
                {nameError && <p className="login-error">{nameError}</p>}
              </form>

              {/* Change password card */}
              <form className="card profile-form-card" onSubmit={handleChangePassword}>
                <p className="purplelabel">Seguridad</p>
                <p className="profile-section-title">Cambiar contraseña</p>

                <label className="login-label" htmlFor="profile-current-pass">Contraseña actual</label>
                <input
                  id="profile-current-pass"
                  className="login-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPassSuccess(false); setPassError(""); }}
                  placeholder="••••••••"
                  required
                />

                <label className="login-label" htmlFor="profile-new-pass">Nueva contraseña</label>
                <input
                  id="profile-new-pass"
                  className="login-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPassSuccess(false); setPassError(""); }}
                  placeholder="Mínimo 8 caracteres"
                  required
                />

                <label className="login-label" htmlFor="profile-confirm-pass">Confirmar contraseña</label>
                <input
                  id="profile-confirm-pass"
                  className="login-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPassSuccess(false); setPassError(""); }}
                  required
                />

                <button
                  type="submit"
                  className="button admin-access-button profile-submit"
                  disabled={passLoading}
                >
                  {passLoading ? "Actualizando..." : "Cambiar contraseña"}
                </button>

                {passSuccess && <p className="profile-success">Contraseña actualizada correctamente.</p>}
                {passError && <p className="login-error">{passError}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
