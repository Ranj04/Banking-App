import React from 'react';
import Header, { useUsername } from './components/Header';

const idOf = (obj) =>
    (obj?.id) || (obj?._id?.$oid) || (obj?._id) || (typeof obj === 'string' ? obj : '');

export default function Home() {
    const username = useUsername();

    const [accounts, setAccounts] = React.useState([]);
    const [goals, setGoals] = React.useState([]);

    // Quick Actions
    const [accountId, setAccountId] = React.useState('');
    const [goalId, setGoalId] = React.useState('');
    const [amount, setAmount] = React.useState('');

    // Transfer
    const [fromGoalId, setFromGoalId] = React.useState('');
    const [toGoalId, setToGoalId] = React.useState('');
    const [transferAmt, setTransferAmt] = React.useState('');

    // Recent activity
    const [txns, setTxns] = React.useState([]);
    // Flash messages
    const [flash, setFlash] = React.useState(null);
    function pushFlash(type, text) {
        setFlash({ type, text, id: Date.now() });
        setTimeout(() => setFlash(f => (f && f.id === flash?.id ? null : f)), 4000);
    }

    const reload = async () => {
        const [a, g] = await Promise.all([
            fetch('/accounts/list', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
            fetch('/goals/list', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
        ]);
        const accs = a?.data || [];
        const gls  = g?.data || [];
        setAccounts(accs);
        setGoals(gls);
        if (!accountId && accs.length) setAccountId(idOf(accs[0]));
        if (!fromGoalId && gls.length) setFromGoalId(idOf(gls[0]));

        await loadRecent();
    };

    async function loadRecent() {
        // Try a few endpoints your backend has used: /getTransactions, /transactions, /transactions/list
        const candidates = ['/getTransactions', '/transactions', '/transactions/list'];
        let data = [];
        for (const url of candidates) {
            try {
                const r = await fetch(url, { credentials: 'include' });
                if (!r.ok) continue;
                const j = await r.json();
                data = j?.data || j?.transactions || j || [];
                if (Array.isArray(data)) break;
            } catch {}
        }
        // Normalize & sort
        const norm = (data || []).map(t => {
            // Determine amount with broad fallbacks
            const cents = t.amountCents ?? t.valueCents ?? null;
            let raw = t.amount ?? t.value ?? t.delta ?? t.change ?? (cents != null ? cents / 100 : null);
            if (raw == null) {
                // Combine deposit / withdraw naming patterns
                raw = t.depositAmount ?? (t.withdrawAmount != null ? -Math.abs(t.withdrawAmount) : null);
            }
            if (raw == null && typeof t.amountStr === 'string') {
                const m = t.amountStr.replace(/[$,]/g,'');
                const num = Number(m); if (!Number.isNaN(num)) raw = num;
            }
            if (raw == null) raw = 0;
            const amt = Number(raw);
            return {
                id: t.id || t._id?.$oid || t._id || Math.random().toString(36).slice(2),
                type: t.type || t.transactionType || t.action || (amt >= 0 ? 'credit' : 'debit'),
                amount: amt,
                accountName: t.accountName || t.account?.name || t.account || '',
                goalName: t.goalName || t.goal?.name || t.goal || '',
                createdAt: Number(t.createdAt ?? t.timestamp ?? Date.parse(t.date) ?? Date.now()),
            };
        });
        norm.sort((a,b) => b.createdAt - a.createdAt);
        setTxns(norm.slice(0,5));
    }

    React.useEffect(() => { reload(); }, []);

    const goalsForAccount = goals.filter(g => idOf(g.accountId) === accountId);

    async function deposit() {
        if (!amount || !accountId || !goalId) return;
        try {
            await fetch('/createDeposit', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount), accountId, goalId }),
            });
            pushFlash('success', `Deposited $${Number(amount).toFixed(2)} to goal.`);
        } catch {
            pushFlash('error', 'Deposit failed');
        }
        setAmount('');
        await reload();
    }

    async function withdraw() {
        if (!amount || !accountId || !goalId) return;
        try {
            await fetch('/withdraw', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount), accountId, goalId }),
            });
            pushFlash('success', `Withdrew $${Number(amount).toFixed(2)} from goal.`);
        } catch {
            pushFlash('error', 'Withdrawal failed');
        }
        setAmount('');
        await reload();
    }

    async function transfer() {
        if (!fromGoalId || !toGoalId || !transferAmt) return;
        try {
            await fetch('/goals/transfer', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromGoalId, toGoalId, amount: Number(transferAmt) }),
            });
            pushFlash('success', `Moved $${Number(transferAmt).toFixed(2)} between goals.`);
        } catch {
            pushFlash('error', 'Transfer failed');
        }
        setTransferAmt('');
        await reload();
    }

    function connectBank() {
        // Placeholder; wire to Plaid Link later
        alert('Bank linking coming soon (Plaid Link placeholder).');
    }

    return (
        <>
            <Header />
            <div className="page">
                <h1>Welcome{username ? `, ${username}` : ''}!</h1>

                {/* QUICK ACTIONS */}
                <div className="card">
                    <h3>Quick Actions</h3>
                    <div className="row">
                        <div className="select-wrap">
                        <select
                            value={accountId}
                            onChange={e => { setAccountId(e.target.value); setGoalId(''); }}
                        >
                            {accounts.map(a => (
                                <option key={idOf(a)} value={idOf(a)}>
                                    {a.name} — ${Number(a.balance || 0).toFixed(2)}
                                </option>
                            ))}
                        </select></div>

                        <div className="select-wrap"><select value={goalId} onChange={e => setGoalId(e.target.value)}>
                            <option value="">Select goal…</option>
                            {goalsForAccount.map(g => (
                                <option key={idOf(g)} value={idOf(g)}>
                                    {g.goal?.name || g.name}
                                </option>
                            ))}
                        </select></div>

                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />

                        <button onClick={deposit} className="btn btn-primary">Deposit</button>
                        <button onClick={withdraw} className="btn">Withdraw</button>
                    </div>
                </div>

                {/* TRANSFER BETWEEN GOALS */}
                <div className="card">
                    <h3>Transfer between goals</h3>
                    <div className="row">
                            <div className="select-wrap"><select value={fromGoalId} onChange={e => setFromGoalId(e.target.value)}>
                            <option value="">From goal…</option>
                            {goals.map(g => (
                                <option key={idOf(g)} value={idOf(g)}>
                                    {(g.accountName || g.account?.name || '')}: {g.goal?.name || g.name}
                                </option>
                            ))}
                            </select></div>

                            <div className="select-wrap"><select value={toGoalId} onChange={e => setToGoalId(e.target.value)}>
                            <option value="">To goal…</option>
                            {goals.map(g => (
                                <option key={idOf(g)} value={idOf(g)}>
                                    {(g.accountName || g.account?.name || '')}: {g.goal?.name || g.name}
                                </option>
                            ))}
                            </select></div>

                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={transferAmt}
                            onChange={e => setTransferAmt(e.target.value)}
                        />

                        <button onClick={transfer} className="btn btn-primary">Transfer</button>
                    </div>
                </div>

                {/* CONNECT BANK (stub) */}
                <div className="card">
                    <h3>Link your bank</h3>
                    <p className="muted">Connect your real bank to pull balances (Plaid Link placeholder).</p>
                    <button className="btn" onClick={connectBank}>Connect bank</button>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="card">
                    <h3>Recent activity</h3>
                    {txns.length === 0 ? (
                        <div className="muted">No transactions yet.</div>
                    ) : (
                        <table className="txn-table">
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Account</th>
                                    <th>Goal</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                                                        {txns.map(t => {
                                                                        const amtClass = t.amount > 0 ? 'amt-pos' : (t.amount < 0 ? 'amt-neg' : '');
                                                                        return (
                                                                        <tr key={t.id}>
                                                                                <td className={amtClass}>{t.amount >= 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}</td>
                                        <td>{t.type}</td>
                                        <td>{t.accountName}</td>
                                        <td>{t.goalName}</td>
                                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                                    </tr>
                                                                );})}
                            </tbody>
                        </table>
                    )}
                </div>
                                {flash && (
                                    <div className={`flash ${flash.type}`}>{flash.text}</div>
                                )}
            </div>
        </>
    );
}
