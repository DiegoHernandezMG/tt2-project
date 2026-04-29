import { useEffect, useState } from "react";
import { adminSupabase } from "../../../lib/supabase-admin";
import "./mobile-verify-email.css";

function MobileVerifyEmailPage() {
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"

  useEffect(() => {
    document.title = "Verificación de correo — SerenaMente";

    adminSupabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        adminSupabase.auth.signOut();
        setStatus("success");
      }
    });

    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        adminSupabase.auth.signOut();
        setStatus("success");
      } else if (event === "TOKEN_REFRESHED") {
        setStatus("error");
      }
    });

    const timeout = setTimeout(() => {
      setStatus((prev) => prev === "verifying" ? "error" : prev);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="mobile-verify-page">
      <div className="mobile-verify-card">
        <div className="mobile-verify-header">
          <p className="mobile-verify-brand">SerenaMente</p>
          <p className="mobile-verify-brand-sub">Verificación de correo</p>
        </div>

        <div className="mobile-verify-body">
          {status === "verifying" && (
            <div className="mobile-verify-waiting">
              <p>Verificando tu cuenta...</p>
              <p className="mobile-verify-waiting-sub">
                Esto tomará solo un momento.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="mobile-verify-success">
              <p className="mobile-verify-success-title">Correo verificado</p>
              <p className="mobile-verify-success-text">
                Tu cuenta de SerenaMente ha sido activada correctamente. Ya puedes volver a la app e iniciar sesión.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mobile-verify-error-box">
              <p className="mobile-verify-error-title">Enlace inválido o expirado</p>
              <p className="mobile-verify-error-text">
                El enlace de verificación ya no es válido. Por favor regístrate de nuevo desde la app.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileVerifyEmailPage;
