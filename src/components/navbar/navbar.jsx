import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import "./navbar.css";
import suaeyd from "../../assets/7-serenamente-logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const close = () => setOpen(false);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="container navbar__inner">
        <NavLink to="/" onClick={close}>
          <img src={suaeyd} alt="logo SerenaMente" className="navbar__logo-img" />
        </NavLink>

        <ul className="navbar__links">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>Inicio</NavLink></li>
          <li><NavLink to="/nosotros" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>Nosotros</NavLink></li>
          <li><NavLink to="/comenzar" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>Comenzar</NavLink></li>
          <li><NavLink to="/faq" className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>Dudas</NavLink></li>
        </ul>

        <div className="navbar__actions">
          <NavLink to="/admin/login" className="admin-access-button">Acceso admin</NavLink>
        </div>

        <button className="navbar__toggle" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
          ☰
        </button>
      </div>

      {createPortal(
        <>
          {open && <div className="navbar__overlay" onClick={close} />}
          <div className={`navbar__drawer ${open ? "is-open" : ""}`}>
            <button className="navbar__drawer-close" onClick={close} aria-label="Cerrar menú">✕</button>
            <ul className="navbar__drawer-links">
              <li><NavLink to="/" end className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>Inicio</NavLink></li>
              <li><NavLink to="/nosotros" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>Nosotros</NavLink></li>
              <li><NavLink to="/comenzar" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>Comenzar</NavLink></li>
              <li><NavLink to="/faq" className={({ isActive }) => isActive ? "drawer-link is-active" : "drawer-link"}>Dudas</NavLink></li>
            </ul>
            <div className="navbar__drawer-footer">
              <NavLink to="/admin/login" className="admin-access-button">Acceso admin</NavLink>
            </div>
          </div>
        </>,
        document.body
      )}
    </nav>
  );
}

export default Navbar;
