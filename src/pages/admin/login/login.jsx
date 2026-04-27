import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminSupabase, adminSupabaseAnonKey } from "../../../lib/supabase-admin";
import { useAuth } from "../../../hooks/use-auth";
import { ADMIN_ROLES, ADMIN_STATUS } from "../../../constants/admin";
import Navbar from "../../../components/navbar/navbar";
import {
  getCurrentAdminProfile,
  registerLoginEvent,
} from "../../../services/admin-users";
import "./login.css";

const RESET_REDIRECT =
  typeof window !== "undefined"
    ? `${window.location.origin}/admin/reset-password`
    : "/admin/reset-password";

function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const withTimeout = async (promise, ms, timeoutMessage) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const redirectByRole = (currentRole) => {
    if (currentRole === ADMIN_ROLES.SUPER_ADMIN) {
      navigate("/admin/users", { replace: true });
      return;
    }
    navigate("/admin/dashboard", { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedEmail = email.trim().toLowerCase();
      const { data, error: loginError } = await withTimeout(
        adminSupabase.auth.signInWithPassword({
          email: parsedEmail,
          password,
        }),
        12000,
        "El inicio de sesión tardó demasiado. Verifica tu conexión e inténtalo de nuevo.",
      );

      if (loginError) {
        setError(loginError.message);
        return;
      }

      const currentUser = data.user;
      const adminProfile = await withTimeout(
        getCurrentAdminProfile(currentUser),
        10000,
        "No se pudo validar el perfil admin a tiempo. Inténtalo nuevamente.",
      );

      if (!adminProfile?.role) {
        adminSupabase.auth.signOut().catch((signOutError) => {
          console.error("No se pudo cerrar sesión tras login no autorizado:", signOutError);
        });
        setError(
          "Tu cuenta no está autorizada en la tabla admins. Contacta a un SUPER_ADMIN.",
        );
        return;
      }

      if (adminProfile.status !== ADMIN_STATUS.ACTIVE) {
        adminSupabase.auth.signOut().catch((signOutError) => {
          console.error("No se pudo cerrar sesión tras cuenta inactiva:", signOutError);
        });
        setError(
          "Tu cuenta no está activa. Contacta a un super admin para habilitar acceso.",
        );
        return;
      }

      try {
        await registerLoginEvent(currentUser);
      } catch (registerError) {
        console.error("No se pudo registrar último acceso:", registerError);
      }

      redirectByRole(adminProfile.role);
    } catch (unexpectedError) {
      setError(unexpectedError.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setForgotLoading(true);
    setError(null);
    try {
      const parsed = forgotEmail.trim().toLowerCase();
      await fetch(`${adminSupabase.supabaseUrl}/functions/v1/send-reset-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminSupabaseAnonKey}`,
        },
        body: JSON.stringify({ email: parsed, redirectTo: RESET_REDIRECT }),
      });
    } finally {
      // Always show success to avoid leaking whether email is registered
      setForgotSent(true);
      setForgotLoading(false);
    }
  };

  if (!authLoading && user && profile?.status === ADMIN_STATUS.ACTIVE) {
    if (profile.role === ADMIN_ROLES.SUPER_ADMIN) {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="page login-page">
        <div className="container">
          <section className="login-layout card">
            <aside className="login-hero">
              <p className="purplelabel">Dashboard administrativo</p>
              <h2 className="login-title">
                Control y seguimiento de Serenamente 2.0
              </h2>
              <p className="login-subtitle">
                Ingresa con tu cuenta autorizada para acceder al panel de
                gestión, reportes y monitoreo del programa.
              </p>
            </aside>

            {showForgot ? (
              <div className="login-form">
                <p className="purplelabel">Recuperar acceso</p>
                <h3 className="login-form-title">¿Olvidaste tu contraseña?</h3>

                {forgotSent ? (
                  <div className="login-forgot-sent">
                    <p className="login-forgot-sent-title">Correo enviado</p>
                    <p>Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
                    <button
                      type="button"
                      className="login-back-link"
                      onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                    >
                      Volver al login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword}>
                    <p className="login-forgot-sub">
                      Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                    <label className="login-label" htmlFor="forgot-email">
                      Correo electrónico
                    </label>
                    <input
                      id="forgot-email"
                      className="login-input"
                      type="email"
                      placeholder="admin@serenamente.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <button
                      className="button admin-access-button login-submit"
                      type="submit"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Enviando..." : "Enviar enlace"}
                    </button>
                    <button
                      type="button"
                      className="login-back-link"
                      onClick={() => { setShowForgot(false); setError(null); }}
                    >
                      Volver al login
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form className="login-form" onSubmit={handleLogin}>
                <p className="purplelabel">Iniciar sesión</p>
                <h3 className="login-form-title">Login administrador</h3>

                <label className="login-label" htmlFor="admin-email">
                  Correo electrónico
                </label>
                <input
                  id="admin-email"
                  className="login-input"
                  type="email"
                  placeholder="admin@serenamente.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  required
                />

                <label className="login-label" htmlFor="admin-password">
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                  }}
                  required
                />

                <button
                  className="button admin-access-button login-submit"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>

                <button
                  type="button"
                  className="login-back-link"
                  onClick={() => { setShowForgot(true); setError(null); }}
                >
                  ¿Olvidaste tu contraseña?
                </button>

                {error && <p className="login-error">{error}</p>}
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
