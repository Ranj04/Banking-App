import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

// Helper to safely format timestamps (not currently used here but available for future use)
function formatTimestamp(ts) {
  try { return new Date(ts).toLocaleString(); }
  catch { return ts ?? ""; }
}

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  async function post(path, payload, opts = {}) {
    setPending(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: opts.credentials || 'include', // default include so auth cookie always sent
      });
      // some endpoints may not return JSON; fall back safely
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true, data };
      return { ok: false, data, status: res.status };
    } catch (e) {
      return { ok: false, data: null, error: e?.message || "Network error" };
    } finally {
      setPending(false);
    }
  }

  async function onCreate() {
    if (!userName || !password) {
      setMsg({ type: "error", text: "Enter a username and password" });
      return;
    }
  const r = await post("/createUser", { userName, password }); // credentials included by default
    if (r.ok) {
      try { localStorage.setItem('userName', userName); } catch {}
      setMsg({ type: "success", text: r.data?.message || "Account created" });
      setPassword("");
    } else {
      setMsg({ type: "error", text: r.data?.message || "Could not create account" });
    }
  }

  async function onLogin() {
    if (!userName || !password) {
      setMsg({ type: "error", text: "Enter a username and password" });
      return;
    }
  const r = await post("/login", { userName, password }); // credentials included by default
    if (r.ok) {
      // remember who is logged in for later use then hard redirect
      try { localStorage.setItem('userName', userName); } catch {}
      window.location.href = '/home';
    } else {
      setMsg({ type: "error", text: r.data?.message || "Invalid credentials" });
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card">
  <h1 style={{ textAlign: 'center' }}>Banking App</h1>
  <p className="sub" style={{ textAlign: 'center' }}>Sign in or create your account to start tracking your savings today!</p>

        <div className="field">
          <label className="label">Username</label>
          <input
            className="input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Ranjiv"
            autoComplete="username"
            disabled={pending}
          />
        </div>

        <div className="field">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={pending}
          />
        </div>

        {msg.text && (
          <div className={`alert ${msg.type === "success" ? "success" : "error"}`}>
            {msg.text}
          </div>
        )}

        <div className="actions">
          <button className="button" onClick={onLogin} disabled={pending}>
            {pending ? "Please wait…" : "Login"}
          </button>
          <button className="button ghost" onClick={onCreate} disabled={pending}>
            {pending ? "Please wait…" : "Create Account"}
          </button>
        </div>

        <div className="helper">By continuing, you agree to the terms.</div>
      </div>
    </div>
  );
}
