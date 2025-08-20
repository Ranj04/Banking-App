import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Goals.css';
import idOf from '../utils/idOf';

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

// Simple goal-to-goal transfer widget
function TransferBetweenGoals({ accounts, goals, onDone }) {
  const [fromAcc, setFromAcc] = React.useState('');
  const [toAcc, setToAcc] = React.useState('');
  const [fromGoal, setFromGoal] = React.useState('');
  const [toGoal, setToGoal] = React.useState('');
  const [amt, setAmt] = React.useState('');

  React.useEffect(() => {
    if (!fromAcc && accounts.length) setFromAcc(idOf(accounts[0]));
  }, [accounts, fromAcc]);

  const goalsFor = React.useCallback((accId) => goals.filter(g => idOf(g.accountId) === accId), [goals]);

  async function submit(){
    if(!fromAcc || !toAcc || !fromGoal || !toGoal || !amt) return;
    try {
      await fetch('/accounts/transfer', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          fromAccountId: fromAcc,
            toAccountId: toAcc,
            fromGoalId: fromGoal,
            toGoalId: toGoal,
            amount: Number(amt)
        })
      });
      setAmt('');
      onDone?.();
    } catch {/* ignore */}
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>Transfer funds between goals</h3>
      <div className="row" style={{gap:8, flexWrap:'wrap', marginTop:8}}>
        <select value={fromAcc} onChange={e=>{ setFromAcc(e.target.value); setFromGoal(''); }}>
          {accounts.map(a => <option key={idOf(a)} value={idOf(a)}>{a.name} ({a.type})</option>)}
        </select>
        <select value={fromGoal} onChange={e=>setFromGoal(e.target.value)}>
          <option value="">From goal…</option>
          {goalsFor(fromAcc).map(g => <option key={idOf(g)} value={idOf(g)}>{g.goal?.name || g.name}</option>)}
        </select>
      </div>
      <div className="row" style={{gap:8, flexWrap:'wrap', marginTop:8}}>
        <select value={toAcc} onChange={e=>{ setToAcc(e.target.value); setToGoal(''); }}>
          <option value="">To account…</option>
          {accounts.map(a => <option key={idOf(a)} value={idOf(a)}>{a.name} ({a.type})</option>)}
        </select>
        <select value={toGoal} onChange={e=>setToGoal(e.target.value)}>
          <option value="">To goal…</option>
          {goalsFor(toAcc).map(g => <option key={idOf(g)} value={idOf(g)}>{g.goal?.name || g.name}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Amount" value={amt} onChange={e=>setAmt(e.target.value)} />
      </div>
      <div style={{marginTop:10}}>
        <button className="btn btn-primary" disabled={!fromAcc || !toAcc || !fromGoal || !toGoal || !amt} onClick={submit}>Transfer</button>
      </div>
    </div>
  );
}

export default function Goals() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const [goals, setGoals] = useState([]);
  // Accounts for assigning a goal to an account
  const [accounts, setAccounts] = useState([]);
  // Inline allocation editing state
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
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
    category: 'General',
    dueDate: '',
    accountId: '',
  });

  // Load accounts helper + initial
  const loadAccounts = React.useCallback(() => {
    api('/accounts/list', { method: 'GET' })
      .then(r => setAccounts(r.data || []))
      .catch(() => setAccounts([]));
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // Default select first account if none chosen
  useEffect(() => {
    if (!form.accountId && accounts.length) {
      setForm(f => ({ ...f, accountId: accounts[0].id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // Preselect account if ?accountId= is present and valid
  useEffect(() => {
    const q = search.get('accountId');
    if (q && accounts.length) {
      const exists = accounts.find(a => (a.id || a._id?.$oid || a._id) === q);
      if (exists) setForm(f => ({ ...f, accountId: q }));
    }
  }, [search, accounts]);

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
    accountId: form.accountId,
      }),
    });
    setBusy(false);
  setForm({ type: 'savings', name: '', targetAmount: '', category: 'General', dueDate: '', accountId: accounts[0]?.id || '' });
    load();
  }

  // Inline contribution actions handled directly in JSX; removed standalone contribute() to avoid lint unused warning

  async function logSpend(category, amount) {
    if (!amount) return;
    await api('/spend/log', { method: 'POST', body: JSON.stringify({ category, amount: Number(amount) }) });
    load();
  }

  async function remove(goalId) {
  const idStr = (goalId || '').toString();
  if (!idStr || idStr.length !== 24) { alert('Invalid goal id'); return; }
  await api('/goals/delete', { method: 'POST', body: JSON.stringify({ goalId: idStr }) });
  load();
  }

  function startEdit(g, idVal) {
    const gid = idVal || idOf(g) || idOf(g?.goal?._id);
    if (!gid) return;
    setEditingId(gid);
    setEditVal(String(Number(g.allocatedAmount || 0).toFixed(2)));
  }

  async function saveEdit(g, idVal) {
    const gid = idVal || idOf(g) || idOf(g?.goal?._id);
    if (!gid) return;
    const amt = Number(editVal);
    if (isNaN(amt) || amt < 0) { alert('Enter a non-negative number'); return; }
    try {
      await api('/goals/setAllocation', { method:'POST', body: JSON.stringify({ goalId: gid, allocatedAmount: amt, enforceBalance: false }) });
      setEditingId(null); setEditVal("");
      load();
    } catch (e) {
      alert('Allocation update failed');
    }
  }

  function cancelEdit(){ setEditingId(null); setEditVal(""); }

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
        <button className="btn btn-ghost" onClick={() => nav('/accounts')}>Accounts</button>
        <button className="btn btn-primary" onClick={logout}>Log out</button>
      </div>

      <div className="cards-grid">
        {accounts.length > 0 && goals.length > 0 && (
          <TransferBetweenGoals accounts={accounts} goals={goals} onDone={() => { load(); loadAccounts(); }} />
        )}
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

            {accounts.length > 0 && (
              <label className="field">
                <span>Account</span>
                <select
                  value={form.accountId}
                  onChange={e => setForm({ ...form, accountId: e.target.value })}
                >
                  {accounts.map(a => {
                    const label = a.name ? `${a.name}${a.type ? ` (${a.type})` : ''}` : a.id;
                    return <option key={a.id} value={a.id}>{label}</option>;
                  })}
                </select>
              </label>
            )}

            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? 'Saving…' : 'Add goal'}
              </button>
            </div>
          </form>
        </section>
        {!accounts.length && (
          <div className="card" style={{textAlign:'center', marginTop:12}}>
            You don’t have any accounts yet. Create one in the <a href="/accounts">Accounts</a> tab.
          </div>
        )}

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
                const id = idOf(g) || idOf(g.goal?._id) || g.goalId || '';
                const isSavings = (g.goal?.type || '').toLowerCase() === 'savings';
                const title = `${g.goal?.name}${!isSavings && g.goal?.category ? ` (${g.goal.category})` : ''}`;
                const pct = Math.round(g.percent || 0);
                const acctLabel = g.accountName
                  ? `${g.accountName}${g.accountType ? ` · ${g.accountType}` : ''}`
                  : 'Unassigned';
                return (
                  <div key={id} className="goal-card">
                    <div className="goal-card__head">
                      <div className="goal-card__title">{title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`chip ${isSavings ? 'chip--green' : 'chip--blue'}`}>
                          {isSavings ? 'Savings' : 'Spending'}
                        </span>
                        <span className="chip">{acctLabel}</span>
                      </div>
                    </div>

                    <div className="goal-card__stats">
                      <div className="goal-card__amount">
                        {isSavings ? 'Saved' : 'Spent'} ${Number(g.progressAmount || 0).toFixed(2)} / ${Number(g.goal?.targetAmount || 0).toFixed(2)}
                      </div>
                      <div className="goal-card__percent">{pct}%</div>
                    </div>

                    <Progress percent={pct} />

                    {/* Allocation editing UI */}
                    <div style={{ marginTop: 8 }}>
                      <span className="subtle">Allocated:</span>{' '}
                      {editingId === id ? (
                        <>
                          <input
                            className="input"
                            style={{ width: 120 }}
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                          />
                          <button className="btn btn-primary" style={{marginLeft:6}} onClick={() => saveEdit(g, id)}>Save</button>
                          <button className="btn btn-ghost" style={{marginLeft:4}} onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <strong>${Number(g.allocatedAmount || 0).toFixed(2)}</strong>
                          <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => startEdit(g, id)}>Edit</button>
                        </>
                      )}
                    </div>

                    <div className="goal-card__actions">
                      {isSavings ? (
                        <>
                          <input className="input small" id={`contrib-${id}`} type="number" step="0.01" placeholder="Add amount" />
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              const el = document.getElementById(`contrib-${id}`);
                              const val = el?.value;
                              if (!id || id.length !== 24) { alert('Invalid goal id'); return; }
                              if (val) {
                                api('/goals/contribute', {
                                  method: 'POST',
                                  body: JSON.stringify({ goalId: id, amount: Number(val) })
                                })
                                  .then(() => { load(); if (el) el.value = ''; })
                                  .catch(() => alert('Contribution failed'));
                              }
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
