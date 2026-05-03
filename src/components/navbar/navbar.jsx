import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";
import suaeyd from "../../assets/7-serenamente-logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="container navbar__inner">
        <div>
          <NavLink to="/">
            <img src={suaeyd} alt="logo suayed" className="navbar__logo-img" />
          </NavLink>
        </div>

        <button
          className="navbar__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <ul className={`navbar__links ${open ? "is-open" : ""}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}
              onClick={() => setOpen(false)}
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nosotros"
              className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}
              onClick={() => setOpen(false)}
            >
              Nosotros
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/comenzar"
              className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}
              onClick={() => setOpen(false)}
            >
              Comenzar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/faq"
              className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}
              onClick={() => setOpen(false)}
            >
              Dudas
            </NavLink>
          </li>
        </ul>

        <div className="navbar__actions">
          <NavLink to="/admin/login" className="admin-access-button">
            Acceso admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
