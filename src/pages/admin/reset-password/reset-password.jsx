import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminSupabase } from "../../../lib/supabase-admin";
import Navbar from "../../../components/navbar/navbar";
import "./reset-password.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
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
      setTimeout(() => navigate("/admin/login", { replace: true }), 3000);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page reset-page">
        <div className="container">
          <section className="card reset-card">
            <p className="purplelabel">Recuperación de acceso</p>
            <h1 className="reset-title">Nueva contraseña</h1>

            {success ? (
              <div className="reset-success">
                <p className="reset-success-title">Contraseña actualizada</p>
                <p>Tu contraseña fue cambiada correctamente. Serás redirigido al login en unos segundos.</p>
                <Link to="/admin/login" className="button button--primary">
                  Ir al login
                </Link>
              </div>
            ) : !sessionReady ? (
              <div className="reset-waiting">
                <p>Verificando enlace de recuperación...</p>
                <p className="reset-waiting-sub">
                  Si llegaste aquí por error,{" "}
                  <Link to="/admin/login">vuelve al login</Link>.
                </p>
              </div>
            ) : (
              <form className="reset-form" onSubmit={handleSubmit}>
                <p className="reset-subtitle">
                  Elige una contraseña segura para tu cuenta.
                </p>

                <label className="login-label" htmlFor="reset-password">
                  Nueva contraseña
                </label>
                <input
                  id="reset-password"
                  className="login-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />

                <label className="login-label" htmlFor="reset-confirm">
                  Confirmar contraseña
                </label>
                <input
                  id="reset-confirm"
                  className="login-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  className="button button--primary reset-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </button>

                {error ? <p className="login-error">{error}</p> : null}
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
