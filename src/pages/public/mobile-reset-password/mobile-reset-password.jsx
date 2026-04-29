import { useEffect, useState } from "react";
import { adminSupabase } from "../../../lib/supabase-admin";
import "./mobile-reset-password.css";

function MobileResetPasswordPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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
      const { error: updateError } = await adminSupabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setSuccess(true);
      await adminSupabase.auth.signOut();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-reset-page">
      <div className="mobile-reset-card">
        <div className="mobile-reset-header">
          <p className="mobile-reset-brand">SerenaMente</p>
          <p className="mobile-reset-brand-sub">Recuperación de contraseña</p>
        </div>

        <div className="mobile-reset-body">
          {success ? (
            <div className="mobile-reset-success">
              <p className="mobile-reset-success-title">Contraseña actualizada</p>
              <p className="mobile-reset-success-text">
                Tu contraseña fue cambiada correctamente. Ya puedes volver a la app e iniciar sesión con tu nueva contraseña.
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="mobile-reset-waiting">
              <p>Verificando enlace de recuperación...</p>
              <p className="mobile-reset-waiting-sub">
                Si llegaste aquí por error, puedes cerrar esta ventana.
              </p>
            </div>
          ) : (
            <form className="mobile-reset-form" onSubmit={handleSubmit}>
              <h1 className="mobile-reset-title">Nueva contraseña</h1>
              <p className="mobile-reset-subtitle">
                Elige una contraseña segura para tu cuenta de SerenaMente.
              </p>

              <label className="mobile-reset-label" htmlFor="mobile-reset-password">
                Nueva contraseña
              </label>
              <input
                id="mobile-reset-password"
                className="mobile-reset-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />

              <label className="mobile-reset-label" htmlFor="mobile-reset-confirm">
                Confirmar contraseña
              </label>
              <input
                id="mobile-reset-confirm"
                className="mobile-reset-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button
                className="mobile-reset-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>

              {error ? <p className="mobile-reset-error">{error}</p> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileResetPasswordPage;
