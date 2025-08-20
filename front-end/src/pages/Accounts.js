import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Accounts.css';
import idOf from '../utils/idOf';

async function api(path, init = {}) {
  const res = await fetch(path, { credentials:'include', headers:{'Content-Type':'application/json'}, ...init });
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

export default function Accounts() {
  const nav = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]); // added goals state
  const [form, setForm] = useState({ name:'', type:'spending' });
  async function logout() {
    try { await api('/logout', { method: 'POST' }); } catch {}
    try { localStorage.removeItem('userName'); } catch {}
    nav('/');
  }

  const load = async () => {
    const [accRes, goalRes] = await Promise.all([
      api('/accounts/list'),
      api('/goals/list').catch(()=>({ data: [] }))
    ]);
    setAccounts(accRes.data || []);
    setGoals(goalRes.data || []);
  };
  useEffect(() => { load(); }, []);

  // Group goals by account for quick lookup
  const goalsByAccount = React.useMemo(() => {
    const m = {};
    for (const g of goals) {
      const aid = idOf(g.accountId);
      if (!aid) continue;
      (m[aid] ||= []).push({ ...g, id: idOf(g), accountId: aid });
    }
    return m;
  }, [goals]);

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
      {accounts.map(a => {
        const aid = idOf(a);
        const list = goalsByAccount[aid] || [];
        return (
          <div className="card acct-card" key={aid}>
            <div className="acct-head">
              <strong>{a.name}</strong>
              <span className={`chip ${a.type === 'savings' ? 'chip--green' : 'chip--blue'}`}>{a.type}</span>
            </div>
            <div className="acct-balance">Balance: ${Number(a.balance || 0).toFixed(2)}</div>
            <StackedGoalBar balance={Number(a.balance||0)} goals={list} />
            <InlineFundGoal accountId={aid} goals={list} onDone={load} />
            <div className="acct-actions" style={{marginTop:10, display:'flex', justifyContent:'flex-end'}}>
              <a className="btn btn-ghost" href={`/goals?accountId=${aid}`}>+ Add goal</a>
            </div>
          </div>
        );
      })}
    </section>

    {/* Empty state (centered) */}
    {!accounts.length && (
      <div className="card empty-card">No accounts yet. Create one above.</div>
    )}
  </main>
);
}

// Minimal stacked bar component
function StackedGoalBar({ balance, goals }) {
  const allocated = goals.reduce((s, g) => s + Number(g.allocatedAmount || 0), 0);
  const base = Math.max(balance, allocated, 1);
  const unallocated = Math.max(balance - allocated, 0);

  const colorOf = React.useCallback((name) => {
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${h} 60% 52%)`;
  }, []);

  return (
    <div className="bar-wrap" aria-label="Goal allocation">
      <div className="bar-track">
        {goals.map(g => {
          const name = g.goal?.name || g.name || 'Goal';
          const amt = Number(g.allocatedAmount || 0);
            if (amt <= 0) return null;
          const pct = Math.min((amt / base) * 100, 100);
          const label = `${name} — $${amt.toFixed(2)} (${((amt / base) * 100).toFixed(1)}%)`;
          return (
            <div
              key={g.id}
              className="bar-seg"
              style={{ width: `${pct}%`, background: colorOf(name) }}
              data-label={label}
              aria-label={label}
              role="img"
            />
          );
        })}
        {unallocated > 0 && (
          <div
            className="bar-seg bar-unallocated"
            style={{ width: `${(unallocated / base) * 100}%` }}
            data-label={`Unallocated — $${unallocated.toFixed(2)} (${((unallocated / base) * 100).toFixed(1)}%)`}
          />
        )}
      </div>

      {goals.length > 0 && (
        <div className="bar-legend">
          {goals.filter(g => (g.allocatedAmount || 0) > 0).map(g => {
            const name = g.goal?.name || g.name || 'Goal';
            return (
              <span key={g.id} className="legend-item">
                <i className="legend-dot" style={{ background: colorOf(name) }} />
                {name}
              </span>
            );
          })}
          {unallocated > 0 && (
            <span className="legend-item">
              <i className="legend-dot legend-dot--unalloc" />
              Unallocated
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function InlineFundGoal({ accountId, goals, onDone }) {
  const [open, setOpen] = React.useState(false);
  const [goalId, setGoalId] = React.useState('');
  const [amt, setAmt] = React.useState('');

  React.useEffect(() => {
    if (goals.length && !goalId) setGoalId(goals[0].id);
  }, [goals, goalId]);

  if (!goals.length) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!goalId || !amt || Number(amt) <= 0) return;
    try {
      await fetch('/createDeposit', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ accountId, goalId, amount: Number(amt) })
      });
      setAmt(''); setOpen(false);
      onDone?.();
    } catch {}
  };

  return (
    <div className="acct-fund-goal">
      {!open ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)}>+ Fund goal</button>
      ) : (
        <form onSubmit={submit} className="fund-row">
          <select value={goalId} onChange={e=>setGoalId(e.target.value)}>
            {goals.map(g => <option key={g.id} value={g.id}>{g.goal?.name || g.name}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Amount" value={amt} onChange={e=>setAmt(e.target.value)} />
          <button className="btn btn-primary" type="submit">Add</button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
