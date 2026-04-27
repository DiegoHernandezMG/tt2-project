import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";
import suaeyd from "../../assets/7-serenamente-logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
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
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nosotros"
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
            >
              Nosotros
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/comenzar"
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
            >
              Comenzar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/faq"
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
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
