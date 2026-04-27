import { Link } from "react-router-dom";
import "./start.css";
import qrImage from "../../../assets/8-qr.png";

function Start() {
  return (
    <div className="page start">
      <section className="start__hero">
        <div className="container">
          <p className="page-title">¡Vamos a comenzar!</p>
          <p className="start__lead">
            Para iniciar tu experiencia en Serenamente 2.0, es necesario que
            descargues la aplicación móvil. Serenamente 2.0 funciona
            exclusivamente como app móvil para dispositivos Android, por lo que
            el registro y uso del programa se realizan únicamente desde la
            aplicación.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid--3">
          <div className="card">
            <span className="start__step">Paso 1</span>
            <div className="start__lead-wrap">
              <p className="start__lead">
                Escanea el código QR que aparece en esta sección desde tu
                dispositivo Android.
              </p>
            </div>
          </div>
          <div className="card">
            <span className="start__step">Paso 2</span>
            <div className="start__lead-wrap">
              <p className="start__lead">Descarga la app Serenamente 2.0.</p>
            </div>
          </div>
          <div className="card">
            <span className="start__step">Paso 3</span>
            <div className="start__lead-wrap">
              <p className="start__lead">
                Una vez instalada, abre la aplicación y sigue los pasos para
                crear tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container start__cta">
          <div>
            <img
              src={qrImage}
              alt="QR de la aplicación móvil"
              className="start__panel-image"
            ></img>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Start;
