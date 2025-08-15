import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

/**
 * Simple, reusable top navbar. 
 * - Uses the CSS you already added (.navbar, .brand, .button.ghost).
 * - Call <Navbar /> at the top of pages like Home.
 */
function possessive(name) {
  if (!name) return null;
  const trimmed = name.trim();
  const endsWithS = /s$/i.test(trimmed);
  return `${trimmed}${endsWithS ? "'" : "'s"}`;
}

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try { setUserName(localStorage.getItem('userName') || ''); } catch {}
  }, []);

  async function handleLogout() {
    if (typeof onLogout === "function") onLogout();
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    try { localStorage.removeItem('userName'); } catch {}
    navigate("/"); // back to login
  }

  // class-based active styling; define .navlink and .navlink.active in CSS if desired
  const baseLinkClass = "navlink";

  return (
    <header className="navbar">
      <div className="brand">{userName ? `${possessive(userName)} Banking App` : 'Banking App'}</div>

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
