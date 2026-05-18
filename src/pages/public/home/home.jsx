import { Link } from "react-router-dom";
import suaeyd from "../../../assets/2-suayed.png";
import labpsiit from "../../../assets/3-labpsiit.png";
import unam from "../../../assets/4-unam.png";
import escom from "../../../assets/5-escom.png";
import ipn from "../../../assets/6-ipn.png";
import "./home.css";

function Home() {
  return (
    <div className="page home">
      <section className="home__hero">
        <div className="container home__hero-grid">
          <div className="home__hero-content">
            <p className="page-title">¿Qué es SERENAMENTE 2.0?</p>
            <p className="home__lead">
              Serenamente 2.0 es una app móvil para dispositivos Android,
              desarrollada por el Laboratorio de Psicología e Innovación
              Tecnológica de la Facultad de Estudios Superiores Iztacala, UNAM.
              Está diseñada para acompañarte si atraviesas síntomas de ansiedad,
              depresión, estrés u otras dificultades emocionales, a través de
              una plataforma digital que integra estrategias psicológicas
              basadas en la evidencia con el apoyo de inteligencia artificial,
              adaptándose a tus necesidades y a tu ritmo.
            </p>
          </div>

          <div className="home__hero-panel">
            <div className="home__panel-video-wrapper">
              <iframe
                className="home__panel-video"
                src="https://www.youtube.com/embed/O8AxFHXWLyg"
                title="Video informativo SerenaMente 2.0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="home__hero-content">
            <p className="home__lead">
              Cuenta con el respaldo y colaboración de investigadoras e
              investigadores de las siguientes instituciones.
            </p>
          </div>
          <div className="home__logos">
            <a
              href="https://suayed.iztacala.unam.mx/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={suaeyd} alt="logo suayed" />
            </a>
            <a
              href="https://labpsiit.iztacala.unam.mx/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={labpsiit} alt="logo labpsiit" />
            </a>
            <a
              href="https://www.unam.mx/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={unam} alt="logo unam" />
            </a>
            <a
              href="https://www.escom.ipn.mx/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={escom} alt="logo escom" />
            </a>
            <a
              href="https://www.ipn.mx/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={ipn} alt="logo ipn" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
