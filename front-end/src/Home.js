import React from 'react';
import Header, { useUsername } from './components/Header';
import QuickActions from './components/QuickActions';
import { listGoals } from './api/goalsApi';

export default function Home() {
    const username = useUsername();

    const [accounts, setAccounts] = React.useState([]); // only for header stats / future
    const [goals, setGoals] = React.useState([]); // not directly used after QuickActions; kept for possible summary
    const [txns, setTxns] = React.useState([]); // recent activity list
    React.useEffect(() => { reload(); }, []);

    async function loadRecent() {
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
        const norm = (data || []).map(t => {
            const cents = t.amountCents ?? t.valueCents ?? null;
            let raw = t.amount ?? t.value ?? t.delta ?? t.change ?? (cents != null ? cents / 100 : null);
            if (raw == null) raw = t.depositAmount ?? (t.withdrawAmount != null ? -Math.abs(t.withdrawAmount) : null);
            if (raw == null && typeof t.amountStr === 'string') {
                const m = t.amountStr.replace(/[$,]/g,'');
                const n = Number(m); if (!Number.isNaN(n)) raw = n;
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

    async function reload() {
        const accRes = await fetch('/accounts/list', { credentials: 'include' }).then(r => r.json()).catch(() => ({}));
        setAccounts(accRes?.data || []);
        const gls = await listGoals();
        setGoals(gls);
        await loadRecent();
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

                <QuickActions onAnyChange={loadRecent} />

                {/* Transfer feature removed for now; handled separately if reintroduced */}

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
                                    const signed = (t.type === 'withdraw' || t.type === 'debit') ? -Math.abs(Number(t.amount || 0)) : Math.abs(Number(t.amount || 0));
                                    const amtClass = signed > 0 ? 'amt-pos' : (signed < 0 ? 'amt-neg' : '');
                                    return (
                                    <tr key={t.id}>
                                        <td className={amtClass}>{signed >= 0 ? '+' : '-'}${Math.abs(signed).toFixed(2)}</td>
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
                {/* QuickActions handles its own toasts; legacy flash removed */}
            </div>
        </>
    );
}
