import React from 'react';
import Header from '../components/Header';

const idOf = (obj) =>
  (obj?.id) || (obj?._id?.$oid) || (obj?._id) || (typeof obj === 'string' ? obj : '');

function StackedGoalBar({ balance, goals }) {
  const total = Math.max(0, Number(balance || 0));
  const allocated = goals.reduce((s, g) => s + Number(g.allocatedAmount ?? g.amountAllocated ?? 0), 0);
  const palette = ['#5AB0FF', '#FFAF5A', '#9A8CFF', '#58DDA3', '#FF6E91', '#C1D161', '#00C9C8'];

  return (
    <div>
      <div className="stackbar" title={`Allocated: $${allocated.toFixed(2)} / $${total.toFixed(2)}`}>
        {goals.map((g, i) => {
          const amt = Number(g.allocatedAmount ?? g.amountAllocated ?? 0);
          const width = total > 0 ? (amt / total) * 100 : 0;
          return (
            <div
              key={idOf(g)}
              className="stackbar__seg"
              style={{ width: `${width}%`, background: palette[i % palette.length] }}
              title={`${g.name || g.goal?.name}: $${amt.toFixed(2)} (${total ? Math.round(width) : 0}%)`}
            />
          );
        })}
        {total - allocated > 0 && (
          <div
            className="stackbar__seg unalloc"
            style={{ width: `${((total - allocated) / total) * 100}%` }}
            title={`Unallocated: $${(total - allocated).toFixed(2)}`}
          />
        )}
      </div>

      <div className="legend">
        {goals.map((g, i) => (
          <span key={idOf(g)} className="legend__item">
            <i className="legend__dot" style={{ background: palette[i % palette.length] }} />
            {(g.name || g.goal?.name)} — ${Number(g.allocatedAmount ?? g.amountAllocated ?? 0).toFixed(2)}
          </span>
        ))}
        {total - allocated > 0 && (
          <span className="legend__item">
            <i className="legend__dot unalloc" />
            Unallocated — ${(total - allocated).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = React.useState([]);
  const [goals, setGoals] = React.useState([]);

  const [name, setName] = React.useState('');
  const [initialBalance, setInitialBalance] = React.useState('');

  const reload = async () => {
    const [a, g] = await Promise.all([
      fetch('/accounts/list', { credentials: 'include' }).then(r => r.json()),
      fetch('/goals/list', { credentials: 'include' }).then(r => r.json()),
    ]);
    setAccounts(a?.data || []);
    setGoals(g?.data || []);
  };

  React.useEffect(() => { reload(); }, []);

  const goalsByAccount = React.useMemo(() => {
    const map = {};
    for (const goal of goals) {
      const aid = idOf(goal.accountId);
      if (!aid) continue;
      (map[aid] ||= []).push({ ...goal, id: idOf(goal), accountId: aid });
    }
    return map;
  }, [goals]);

  async function createAccount() {
    if (!name.trim()) return;
    await fetch('/accounts/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
  type: 'savings',
        initialBalance: Number(initialBalance || 0),
      }),
    });
    setName('');
    setInitialBalance('');
    await reload();
  }

  return (
    <>
      <Header />
      <div className="page">
        <h1>Accounts</h1>

      <div className="card">
        <h3>Create a savings account</h3>
        <div className="row">
          <input
            placeholder="Account name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            placeholder="Initial amount (optional)"
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={e => setInitialBalance(e.target.value)}
          />
          <button className="btn btn-primary" onClick={createAccount}>Create</button>
        </div>
      </div>

      <div className="card">
        <h3>Connect your bank</h3>
        <p className="muted">Hook up your external bank to view balances. (Plaid integration placeholder)</p>
        <button className="btn">Connect with Plaid</button>
      </div>

      <div className="grid">
        {accounts.map(a => {
          const aid = idOf(a);
          const list = goalsByAccount[aid] || [];
          return (
            <div key={aid} className="card">
              <div className="card__title">
                <div>{a.name}</div>
                <span className="pill">savings</span>
              </div>
              <div className="muted">Balance: ${Number(a.balance || 0).toFixed(2)}</div>
              <StackedGoalBar balance={a.balance} goals={list} />
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}
