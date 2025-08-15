import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

/**
 * Simple, reusable top navbar. 
 * - Uses the CSS you already added (.navbar, .brand, .button.ghost).
 * - Call <Navbar /> at the top of pages like Home.
 */
export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    if (typeof onLogout === "function") onLogout();
    // If you have a backend logout, call it here via fetch('/logout', {method:'POST'})
    navigate("/"); // back to login
  }

  // class-based active styling; define .navlink and .navlink.active in CSS if desired
  const baseLinkClass = "navlink";

  return (
    <header className="navbar">
      <div className="brand">Banking App</div>

      <nav style={{ display: "flex", gap: 14, marginLeft: 12 }}>
        <NavLink
          to="/home"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? "active" : ""}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? "active" : ""}`}
        >
          Accounts
        </NavLink>
        <NavLink
          to="/goals"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? "active" : ""}`}
        >
          Goals
        </NavLink>
      </nav>

      <div style={{ marginLeft: "auto" }}>
        <button className="button ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
