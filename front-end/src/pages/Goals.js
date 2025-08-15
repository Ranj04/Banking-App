import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Goals.css';

// tiny helper to call our API consistently
async function api(path, init = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

function Progress({ percent }) {
  const pct = Math.max(0, Math.min(100, Number(percent || 0)));
  return (
    <div className="progress">
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Goals() {
  const nav = useNavigate();
  const [goals, setGoals] = useState([]);
  // A) spending summary memo
  const summary = React.useMemo(() => {
    const spending = (goals || []).filter(g => (g.goal?.type || '').toLowerCase() === 'spending');
    const totalLimit = spending.reduce((acc, g) => acc + Number(g.goal?.targetAmount || 0), 0);
    const totalSpent = spending.reduce((acc, g) => acc + Number(g.progressAmount || 0), 0);
    const pct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
    const period = spending[0]?.periodLabel || 'This month';
    return { totalLimit, totalSpent, pct, period, count: spending.length };
  }, [goals]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: 'savings',
    name: '',
    targetAmount: '',
    category: 'Food',
    dueDate: '',
  });

  async function load() {
    const r = await api('/goals/list', { method: 'GET' });
    setGoals(r.data || []);
  }

  useEffect(() => { load(); }, []);

  async function createGoal(e) {
    e.preventDefault();
    setBusy(true);
    await api('/goals/create', {
      method: 'POST',
      body: JSON.stringify({
        type: form.type,
        name: form.name,
        targetAmount: Number(form.targetAmount),
        category: form.type === 'spending' ? form.category : undefined,
        dueDateMillis: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
      }),
    });
    setBusy(false);
    setForm({ type: 'savings', name: '', targetAmount: '', category: 'Food', dueDate: '' });
    load();
  }

  async function contribute(goalId, amount) {
    if (!amount) return;
    await api('/goals/contribute', { method: 'POST', body: JSON.stringify({ goalId, amount: Number(amount) }) });
    load();
  }

  async function logSpend(category, amount) {
    if (!amount) return;
    await api('/spend/log', { method: 'POST', body: JSON.stringify({ category, amount: Number(amount) }) });
    load();
  }

  async function remove(goalId) {
    await api('/goals/delete', { method: 'POST', body: JSON.stringify({ goalId }) });
    load();
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST' });
    } catch (_) {}
    localStorage.removeItem('userName');
    nav('/');
  }

  return (
    <main className="home-container goals-page">
      {/* Page actions */}
      <div className="page-actions">
  <button className="btn btn-ghost" onClick={() => nav('/home')}>← Home</button>
        <button className="btn btn-primary" onClick={logout}>Log out</button>
      </div>

      <div className="cards-grid">
        {/* Create Goal */}
        <section className="card goals-card">
          <header className="card__header">
            <h2>Create A Goal</h2>
            <span className="subtle">Savings target or monthly spending limit</span>
          </header>

          <form className="form-grid" onSubmit={createGoal}>
            <label className="field">
              <span>Type</span>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="savings">Savings goal</option>
                <option value="spending">Spending limit</option>
              </select>
            </label>

            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Emergency Fund / Food Budget"
              />
            </label>

            <label className="field">
              <span>{form.type === 'savings' ? 'Target amount' : 'Monthly limit'}</span>
              <input
                type="number" step="0.01"
                value={form.targetAmount}
                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="e.g. 500"
              />
            </label>

            {form.type === 'spending' && (
              <label className="field">
                <span>Category</span>
                <input
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Food, Transport, Fun…"
                />
              </label>
            )}

            {form.type === 'savings' && (
              <label className="field">
                <span>Due date (optional)</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </label>
            )}

            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? 'Saving…' : 'Add goal'}
              </button>
            </div>
          </form>
        </section>

        {/* B) Monthly spending summary */}
        <section className="card summary-card">
          <header className="card__header">
            <h2>Monthly Spending Summary</h2>
            <span className="subtle">{summary.period}</span>
          </header>
          <div className="summary-stats">
            <div className="summary-row">
              <div className="stat">
                <div className="stat__label">Total spent</div>
                <div className="stat__value">${summary.totalSpent.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat__label">Total limit</div>
                <div className="stat__value">${summary.totalLimit.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat__label">Active budgets</div>
                <div className="stat__value">{summary.count}</div>
              </div>
            </div>
            <Progress percent={summary.pct} />
            <div className="muted small">You’re at {Math.round(summary.pct)}% of your combined monthly budgets.</div>
          </div>
        </section>

        {/* Your Goals (full width) */}
        <section className="card goals-list recent-activity">
          <header className="card__header">
            <h2>Your Goals</h2>
          </header>

          {goals.length === 0 ? (
            <div className="empty">No goals yet — create one above.</div>
          ) : (
            <div className="goals-grid">
              {goals.map((g) => {
                const id = g.goal?._id?.$oid || g.goal?._id || '';
                const isSavings = (g.goal?.type || '').toLowerCase() === 'savings';
                const title = `${g.goal?.name}${!isSavings && g.goal?.category ? ` (${g.goal.category})` : ''}`;
                const pct = Math.round(g.percent || 0);
                return (
                  <div key={id} className="goal-card">
                    <div className="goal-card__head">
                      <div className="goal-card__title">{title}</div>
                      <span className={`chip ${isSavings ? 'chip--green' : 'chip--blue'}`}>
                        {isSavings ? 'Savings' : 'Spending'}
                      </span>
                    </div>

                    <div className="goal-card__stats">
                      <div className="goal-card__amount">
                        {isSavings ? 'Saved' : 'Spent'} ${Number(g.progressAmount || 0).toFixed(2)} / ${Number(g.goal?.targetAmount || 0).toFixed(2)}
                      </div>
                      <div className="goal-card__percent">{pct}%</div>
                    </div>

                    <Progress percent={pct} />

                    <div className="goal-card__actions">
                      {isSavings ? (
                        <>
                          <input className="input small" id={`contrib-${id}`} type="number" step="0.01" placeholder="Add amount" />
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              const el = document.getElementById(`contrib-${id}`);
                              const val = el?.value;
                              if (val) { contribute(id, val); if (el) el.value = ''; }
                            }}
                          >
                            Contribute
                          </button>
                        </>
                      ) : (
                        <>
                          <input className="input small" id={`spend-${id}`} type="number" step="0.01" placeholder="Log spend" />
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              const el = document.getElementById(`spend-${id}`);
                              const val = el?.value;
                              if (val) { logSpend(g.goal?.category || 'General', val); if (el) el.value = ''; }
                            }}
                          >
                            Log spend
                          </button>
                          <span className="muted">Period: {g.periodLabel}</span>
                        </>
                      )}
                      <button className="btn btn-danger" onClick={() => remove(id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
