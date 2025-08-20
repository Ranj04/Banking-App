import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Accounts.css';

async function api(path, init = {}) {
  const res = await fetch(path, { credentials:'include', headers:{'Content-Type':'application/json'}, ...init });
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

export default function Accounts() {
  const nav = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name:'', type:'spending' });
  async function logout() {
    try { await api('/logout', { method: 'POST' }); } catch {}
    try { localStorage.removeItem('userName'); } catch {}
    nav('/');
  }

  const load = async () => {
    const r = await api('/accounts/list');
    setAccounts(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/accounts/create', { method:'POST', body: JSON.stringify(form) });
    setForm({ name:'', type:'spending' });
    load();
  };

  return (
  <main className="home-container accounts-page">
    <div className="page-actions">
      <button className="btn btn-ghost" onClick={() => nav('/home')}>← Home</button>
      <button className="btn btn-ghost" onClick={() => nav('/goals')}>Goals</button>
      <button className="btn btn-primary" onClick={logout}>Log out</button>
    </div>
    <h2>Accounts</h2>

    {/* Create account (centered, consistent card) */}
    <section className="card accounts-create">
      <header className="card__header">
        <h3>Create an account</h3>
        <span className="subtle">Choose Savings or Spending</span>
      </header>

      <form onSubmit={create} className="form-row">
        <input
          className="input"
          placeholder="Account name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <div className="select-wrap">
          <select
            className="select"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="spending">Spending</option>
            <option value="savings">Savings</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Create</button>
      </form>
    </section>

    {/* Accounts grid */}
    <section className="cards-grid accounts-grid">
      {accounts.map(a => (
        <div className="card acct-card" key={a.id}>
          <div className="acct-head">
            <strong>{a.name}</strong>
            <span className={`chip ${a.type === 'savings' ? 'chip--green' : 'chip--blue'}`}>{a.type}</span>
          </div>
          <div className="acct-balance">Balance: ${Number(a.balance || 0).toFixed(2)}</div>
        </div>
      ))}
    </section>

    {/* Empty state (centered) */}
    {!accounts.length && (
      <div className="card empty-card">No accounts yet. Create one above.</div>
    )}
  </main>
);
}
