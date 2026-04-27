import { useState } from "react";
import "./faq.css";

const SUPABASE_URL = import.meta.env.VITE_ADMIN_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY;

function FAQ() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ nombre, email, mensaje }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");

      setSuccess(true);
      setNombre("");
      setEmail("");
      setMensaje("");
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page faq">
      <section className="faq__hero">
        <div className="container">
          <p className="page-title">¿Tienes alguna duda?</p>
        </div>
      </section>

      <section className="section">
        <div className="container faq__list">
          <details className="faq__item" open>
            <summary>
              <span className="faq__step">
                ¿Serenamente 2.0 es un tratamiento psicológico?
              </span>
            </summary>
            <p className="faq__lead">
              No. Serenamente 2.0 es un proyecto de acompañamiento psicológico
              preventivo que no sustituye un tratamiento psicológico ni
              psiquiátrico. Su objetivo es apoyar el bienestar emocional.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Quién puede entrar al dashboard?
              </span>
            </summary>
            <p className="faq__lead">
              Solo administradores autorizados. El acceso requerirá
              autenticación antes de ver datos.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Cómo puede ayudarte la inteligencia artificial en Serenamente
                2.0?
              </span>
            </summary>
            <p className="faq__lead">
              La inteligencia artificial apoya la personalización de los
              contenidos y el seguimiento de tu proceso, adaptando las
              actividades a tus necesidades emocionales.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Quién puede participar en Serenamente 2.0?
              </span>
            </summary>
            <p className="faq__lead">
              Pueden participar personas mayores de edad que experimentan
              dificultades emocionales como ansiedad, depresión o estrés y
              desean fortalecer su bienestar emocional.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">¿Cómo puedo registrarme?</span>
            </summary>
            <p className="faq__lead">
              Primero debes descargar la app Serenamente 2.0 en dispositivos
              Android. Una vez instalada, podrás crear tu cuenta utilizando un
              correo electrónico válido y seguir los pasos de registro dentro de
              la aplicación.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Qué requisitos necesito para participar?
              </span>
            </summary>
            <p className="faq__lead">
              Necesitas ser mayor de edad, contar con un correo electrónico
              activo, un número de teléfono celular válido y el compromiso de
              realizar las actividades del programa.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Todas las personas que se registran pueden participar?
              </span>
            </summary>
            <p className="faq__lead">
              No necesariamente. Serenamente 2.0 forma parte de un proyecto de
              investigación, por lo que existen criterios de inclusión y
              exclusión que se revisan durante el registro.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿En qué dispositivos puedo usar Serenamente 2.0?
              </span>
            </summary>
            <p className="faq__lead">
              La app está disponible para dispositivos Android. Se recomienda
              utilizar un teléfono inteligente o tableta con conexión a
              internet.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Serenamente 2.0 tiene algún costo?
              </span>
            </summary>
            <p className="faq__lead">
              No. La app es completamente gratuita, ya que forma parte de un
              proyecto académico desarrollado en la UNAM.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿En qué se basa el diseño del programa?
              </span>
            </summary>
            <p className="faq__lead">
              El programa integra estrategias psicológicas basadas en la
              evidencia científica, sustentadas en investigaciones del modelo
              transdiagnóstico y apoyadas por tecnología e inteligencia
              artificial.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Cuál es la duración del programa?
              </span>
            </summary>
            <p className="faq__lead">
              Puedes acceder a la app en cualquier momento, los 7 días de la
              semana. El programa tiene una duración aproximada de varias
              semanas, con actividades distribuidas de manera progresiva.
            </p>
          </details>
          <details className="faq__item">
            <summary>
              <span className="faq__step">
                ¿Mi información es confidencial?
              </span>
            </summary>
            <p className="faq__lead">
              Sí. Todos los datos que proporcionas son tratados con estricta
              confidencialidad conforme al aviso de privacidad del proyecto.
              [hipervínculo al aviso de privacidad]
            </p>
          </details>
        </div>
      </section>

      <section className="section faq__contact-section">
        <div className="container">
          <div className="faq__contact-card card">
            <p className="purplelabel">Contacto</p>
            <p className="faq__contact-title">¿No encontraste lo que buscabas?</p>
            <p className="faq__contact-subtitle">
              Escríbenos y te responderemos a la brevedad.
            </p>

            {success ? (
              <div className="faq__contact-success">
                <p className="faq__contact-success-title">¡Mensaje enviado!</p>
                <p className="faq__contact-success-body">
                  Gracias por escribirnos. Te responderemos pronto al correo que proporcionaste.
                </p>
              </div>
            ) : (
              <form className="faq__contact-form" onSubmit={handleSubmit}>
                <div className="faq__contact-row">
                  <div className="faq__contact-field">
                    <label className="login-label" htmlFor="contact-nombre">Nombre</label>
                    <input
                      id="contact-nombre"
                      className="login-input"
                      type="text"
                      value={nombre}
                      onChange={(e) => { setNombre(e.target.value); setError(""); }}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="faq__contact-field">
                    <label className="login-label" htmlFor="contact-email">Correo electrónico</label>
                    <input
                      id="contact-email"
                      className="login-input"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>
                </div>

                <label className="login-label" htmlFor="contact-mensaje">Mensaje</label>
                <textarea
                  id="contact-mensaje"
                  className="login-input faq__contact-textarea"
                  value={mensaje}
                  onChange={(e) => { setMensaje(e.target.value); setError(""); }}
                  placeholder="Escribe tu duda aquí..."
                  required
                />

                {error && <p className="login-error">{error}</p>}

                <button
                  type="submit"
                  className="button admin-access-button faq__contact-submit"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar mensaje"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FAQ;
