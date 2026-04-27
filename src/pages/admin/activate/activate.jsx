import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { activateAdminInvitation } from "../../../services/admin-users";
import "./activate.css";

function ActivatePage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("El enlace de invitación es inválido.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await activateAdminInvitation({ email, password });
      setSuccess(true);
    } catch (activateError) {
      setError(activateError.message || "No se pudo activar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page activate-page">
      <div className="container">
        <section className="card activate-card">
          <p className="eyebrow">Activación de cuenta</p>
          <h1>Activar acceso ADMIN</h1>
          <p>
            Configura tu contraseña para entrar al dashboard con tu cuenta de
            psicólogo.
          </p>

          {success ? (
            <div className="activate-success">
              <p className="stat-label">Cuenta activada</p>
              <p>Ya puedes iniciar sesión con tu correo y contraseña.</p>
              <Link to="/admin/login" className="button button--primary">
                Ir a login
              </Link>
            </div>
          ) : (
            <form className="activate-form" onSubmit={handleSubmit}>
              <label className="login-label" htmlFor="activate-email">
                Correo
              </label>
              <input
                id="activate-email"
                className="login-input"
                type="email"
                value={email}
                readOnly
              />

              <label className="login-label" htmlFor="activate-password">
                Contraseña
              </label>
              <input
                id="activate-password"
                className="login-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />

              <label className="login-label" htmlFor="activate-password-confirm">
                Confirmar contraseña
              </label>
              <input
                id="activate-password-confirm"
                className="login-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <button
                className="button button--primary activate-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Activando..." : "Activar cuenta"}
              </button>
            </form>
          )}

          {error ? <p className="login-error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

export default ActivatePage;
