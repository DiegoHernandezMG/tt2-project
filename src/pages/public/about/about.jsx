import "./about.css";
import lorena from "../../../assets/picsWeAre/1-lorena.png";
import anabel from "../../../assets/picsWeAre/2-anabel.png";
import jose from "../../../assets/picsWeAre/3-jose.png";
import javier from "../../../assets/picsWeAre/4-javier.png";
import griselda from "../../../assets/picsWeAre/5-griselda.png";
import stephanie from "../../../assets/picsWeAre/6-stephanie.png";
import yeimi from "../../../assets/picsWeAre/7-Yeimi.png";
import diego from "../../../assets/picsWeAre/8-Diego.png";

function About() {
  return (
    <div className="page about">
      <section className="about__hero">
        <div className="container">
          <p className="page-title">¿Quiénes somos?</p>
          <p className="about__lead">
            Somos un grupo de investigadores dentro de la UNAM FES Iztacala y
            respaldados por el laboratorio en investigación LAPSIIT, CONACYHT.
            Nuestra misión en SerenaMente es crear soluciones innovadoras que
            promuevan el bienestar emocional. Nos esforzamos por proporcionar
            herramientas accesibles y fáciles de usar que ayudan a las personas
            a llevar una vida más plena. Como grupo de investigación trabajamos
            en estrecha colaboración con psicólogos, profesionales en
            tecnología, para desarrollar soluciones basadas en la evidencia
            científica. En SerenaMente nos comprometemos a salvaguardar la
            privacidad de nuestros usuarios y proporcionar información clara
            sobre nuestros sistemas y procesos.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about__cards">
          <div className="card">
            <img src={lorena} alt="Lorena" className="about__avatar"></img>
            <h3>Dra. Lorena Alejandra Flores Plata</h3>
            <p>
              Doctora en Psicología y Salud por la Universidad Nacional Autónoma
              de México. Profesora de carrera asociada C de tiempo completo en
              la Facultad de Estudios Superiores Iztacala. Docente en el SUAyED
              desde hace 11 años en módulos metodológicos, clínicos y de la
              salud. Actualmente es la responsable del Laboratorio de Psicología
              e Innovación Tecnológico (LABPSIIT). En sus líneas de trabajo
              están la incorporación de tecnologías a la salud mental,
              convivencia escolar, las emociones y el bienestar. Es coautora de
              libros en UNAM, SEP y Santillana, artículos científicos y de
              difusión en convivencia, educación a distancia y tratamientos
              psicológicos. Forma parte del Sistema Nacional de Investigadores
              de México.
            </p>
          </div>
          <div className="card">
            <img src={anabel} alt="Anabel" className="about__avatar"></img>
            <h3>Dra. Anabel de la Rosa Gómez</h3>
            <p>
              Doctora en Psicología por la Universidad Nacional Autónoma de
              México. Profesora titular B de tiempo completo adscrita a la
              licenciatura en Psicología del Sistema de Universidad Abierta y
              Educación a Distancia (SUAyED). Coordinadora de Educación a
              Distancia de la Facultad de Estudios Superiores Iztacala, UNAM.
              Responsable académica del Laboratorio de Psicología e Innovación
              Tecnológica- LABPSIIT- y del Centro de Apoyo Psicológico y
              Educativo a Distancia (CAPED). Miembro del Sistema Nacional de
              Investigadores, Nivel II. Responsable técnica del proyecto CONACyT
              PRONACES SALUD MENTAL, 1401. Sus líneas de investigación:
              telepsicología, evaluación de intervenciones psicológicas
              digitales para la salud mental, vulnerabilidad al trauma.
            </p>
          </div>
          <div className="card">
            <img src={jose} alt="José" className="about__avatar"></img>
            <h3>Dr. José Alfredo Jiménez Benítez</h3>
            <p>
              Ingeniero en Electrónica con especialidad en Sistemas Digitales y
              Computadoras (UAM-Azcapotzalco) Maestro en Tecnología Avanzada con
              especialidad en Tiempo Real y Control (IPN) Doctor en Tecnología
              Avanzada con especialidad en Sistemas (IPN) Diplomado en Formación
              Docente en el 2008 (IPN) Diplomado en Formación Docente basado en
              Competencias en 2011 (IPN) Diplomado en Inteligencia Emocional en
              2017 (IPN) Licenciado en Psicología (UNAM) Diplomado en educación
              híbrida en 2022 (IPN) Diplomado en recursos didácticos digitales
              en 2023 (IPN)
            </p>
          </div>
          <div className="card">
            <img src={javier} alt="Javier" className="about__avatar"></img>
            <h3>Mtro. Javier Darío Ríos Castillo</h3>
            <p>
              Candidato a Doctor en Ciencias Médicas por la Universidad Nacional
              Autónoma de México en la Facultad de Medicina de la misma
              institución. Su investigación y práctica profesional se enfoca en
              el campo de la psicología de la salud desde un enfoque de género,
              abarcando tratamiento psicoterapéutico del consumo nocivo de
              sustancias y promoción de la salud mental en varones, así como
              investigación en la prevención de la violencia ginecológica y la
              violencia obstétrica. Profesor de Asignatura "A" de la
              Licenciatura en Psicología del Sistema de Universidad Abierta y
              Educación a Distancia de la UNAM, miembros de los claustros de
              Psicología Clínica y Psicología en el Campo de Salud de la misma
              entidad académica. Maestro en Psicología de las Adicciones con
              formación primaria en Psicología Clínica. Tiene experiencia en
              diferentes escenarios dirigidos al cuidado de la salud mental:
              desde atención telefónica en crisis, pasando por el trabajo en
              comunidades con adolescentes en situación de riesgo, en hospitales
              con pacientes de enfermedades crónicas y sus familiares, así como
              en centros de atención de prevención de las adicciones de la
              Ciudad de México y el Estado de México.
            </p>
          </div>
          <div className="card">
            <img src={griselda} alt="Griselda" className="about__avatar"></img>
            <h3>Psic. Griselda Suzán Montoya</h3>
            <p>
              Realizó sus estudios en Psicología en la Facultad de Estudios
              Superiores Iztacala de la UNAM con Mención Honorífica. Cuenta con
              entrenamientos en Mindfulness, Modelo Transdiagnóstico, Terapia
              Centrada en la Compasión y Terapia de Aceptación y Compromiso.
              Actualmente es doctorante en Psicología en la UNAM. Es asesora
              terapeuta en el Proyecto Xtab para la prevención de las conductas
              lesivas y suicidas en adolescentes. Dentro del LABPSIIT colabora
              en proyectos de investigación en salud mental, análisis de datos y
              divulgación.
            </p>
          </div>
          <div className="card">
            <img
              src={stephanie}
              alt="Stephanie"
              className="about__avatar"
            ></img>
            <h3>Psic. Stephanie Cortes Abad</h3>
            <p>
              En el ámbito de la salud, realizó una participación aplicando un
              taller sobre Mejoramiento de la Calidad de Vida con Hábitos
              Saludables como factor preventivo de la depresión en adultos
              mayores. Su interés por abordar temas relevantes en el área de
              prevención se refleja en su incursión en el campo organizacional,
              donde realizó una propuesta de evaluación para la Prevención de
              Riesgos Asociados al Estrés en el Área de Producción de la empresa
              Goliardxs Estudios. Con respecto al campo clínico, incursionó
              desarrollado una propuesta de instrumento para la evaluación del
              constructo de Deseo autodestructivo, demostrando un compromiso
              profundo con la identificación y prevención de situaciones
              críticas, además mostró un interés en temas del campo clínico,
              desde la perspectiva preventiva al realizar un taller
              psicoeducativo tratando el tema de prevención de abuso hacia
              menores de edad, dirigido a padres de familia o tutores.
              Ejecutando las intervenciones desde un enfoque integral que
              evidencia su capacidad para abordar problemáticas complejas con
              empatía y profesionalismo.
            </p>
          </div>
          <div className="card">
            <img src={yeimi} alt="Yeimi" className="about__avatar"></img>
            <h3>Yeimi Guadalupe Carmona Santiago</h3>
            <p>
              Estudiante del último semestre de Ingeniería en Sistemas
              Computacionales, con experiencia en el desarrollo de proyectos
              tecnológicos orientados al análisis de datos, la calidad de
              procesos y el bienestar humano. Su formación se ha complementado
              con experiencia profesional, participando activamente en entornos
              organizacionales donde ha aplicado soluciones digitales para la
              optimización de información y la toma de decisiones. Ha
              desarrollado proyectos interdisciplinarios que integran ingeniería
              de software y enfoques de salud mental, destacando el diseño y
              desarrollo de SerenaMente 2.0, una plataforma digital enfocada en
              la prevención y el bienestar emocional mediante un modelo
              transdiagnóstico. En estos proyectos ha demostrado capacidad para
              traducir necesidades complejas en sistemas tecnológicos
              funcionales, escalables y éticamente responsables. Su perfil se
              distingue por la disciplina profesional y una visión integral que
              articula la innovación tecnológica con el impacto social,
              consolidándose como una profesionista en formación orientada al
              desarrollo de soluciones digitales de alto valor.
            </p>
          </div>
          <div className="card">
            <img src={diego} alt="Yeimi" className="about__avatar"></img>
            <h3>Diego Armando Hernández Suarez</h3>
            <p>
              Estudiante del último semestre de la Ingeniería en Sistemas
              Computacionales, especializado en el área de Data Analytics.
              Apasionado de la música y las nuevas tecnologías.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
