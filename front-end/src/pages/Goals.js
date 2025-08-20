import React from 'react';
import Header from '../components/Header';

const idOf = (obj) =>
  (obj?.id) || (obj?._id?.$oid) || (obj?._id) || (typeof obj === 'string' ? obj : '');

export default function GoalsPage() {
  const [accounts, setAccounts] = React.useState([]);
  const [goals, setGoals] = React.useState([]);

  const [accountId, setAccountId] = React.useState('');
  const [name, setName] = React.useState('');
  const [target, setTarget] = React.useState('');

  async function reload() {
    const [a, g] = await Promise.all([
      fetch('/accounts/list', { credentials: 'include' }).then(r => r.json()),
      fetch('/goals/list', { credentials: 'include' }).then(r => r.json()),
    ]);
    const accs = a?.data || [];
    setAccounts(accs);
    setGoals(g?.data || []);
    if (!accountId && accs.length) setAccountId(idOf(accs[0]));
  }

  React.useEffect(() => { reload(); }, []);

  async function createGoal() {
    if (!name.trim() || !accountId) return;
    await fetch('/goals/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        targetAmount: Number(target || 0),
        accountId,
    type: 'savings',
      }),
    });
    setName('');
    setTarget('');
    await reload();
  }

  return (
    <>
      <Header />
      <div className="page">
        <h1>Goals</h1>

      <div className="card">
        <h3>Create a goal</h3>
        <div className="row">
          <input
            placeholder="Goal name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            placeholder="Target (optional)"
            type="number"
            step="0.01"
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
          <select value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => (
              <option key={idOf(a)} value={idOf(a)}>{a.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={createGoal}>Add goal</button>
        </div>
      </div>

      <div className="grid">
        {goals.map(g => (
          <div key={idOf(g)} className="card goal-card">
            <div className="card__title">
              <div>{g.goal?.name || g.name}</div>
              <span className="pill">in {g.accountName || g.account?.name || 'Savings'}</span>
            </div>
            <div className="muted">
              Allocated: ${Number(g.allocatedAmount || 0).toFixed(2)}
              {g.targetAmount ? ` / $${Number(g.targetAmount).toFixed(2)}` : ''}
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
