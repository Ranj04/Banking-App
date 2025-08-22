import React from 'react';
import Header, { useUsername } from './components/Header';
import QuickActions from './components/QuickActions';
import { listGoals } from './api/goalsApi';

export default function Home() {
    const username = useUsername();
    const [accounts, setAccounts] = React.useState([]);
    const [goals, setGoals] = React.useState([]);
    const [txns, setTxns] = React.useState([]);

    React.useEffect(() => { reload(); }, []);

    async function loadRecent() {
        const candidates = ['/transactions', '/transactions/list', '/getTransactions'];
        for (const url of candidates) {
            try {
                const r = await fetch(url, { credentials: 'include' });
                if (!r.ok) continue;
                const j = await r.json();
                const raw = j?.data || j?.transactions || j || [];
                if (!Array.isArray(raw)) continue;

                const normalized = raw.map(t => {
                    // numeric amount
                    const cents = t.amountCents ?? t.valueCents ?? null;
                    let rawAmt = t.amount ?? t.value ?? (cents != null ? cents / 100 : null);
                    if (rawAmt == null && typeof t.amountStr === 'string') {
                        const n = Number(t.amountStr.replace(/[$,]/g, '')); if (!Number.isNaN(n)) rawAmt = n;
                    }
                    if (rawAmt == null) rawAmt = 0;
                    const type = (t.type || t.transactionType || '').toLowerCase();

                    // prefer enriched names from backend
                    const displayAccount = t.displayAccount || t.accountName || t.account?.name || t.account || '';
                    const displayGoal = t.displayGoal || t.goalName || t.goal?.name || t.goal || '';

                    // withdraw should display negative
                    const signed = type === 'withdraw' ? -Math.abs(Number(rawAmt || 0)) : Number(rawAmt || 0);

                    return {
                        id: t.id || t._id?.$oid || t._id || crypto.randomUUID(),
                        type: type || (signed >= 0 ? 'deposit' : 'withdraw'),
                        amount: signed,
                        accountName: displayAccount,
                        goalName: displayGoal,
                        createdAt: Number(t.createdAt ?? t.timestamp ?? Date.parse(t.date) ?? Date.now()),
                    };
                });

                normalized.sort((a, b) => b.createdAt - a.createdAt);
                setTxns(normalized.slice(0, 5));
                return;
            } catch { /* try next */ }
        }
        setTxns([]);
    }

    async function reload() {
        try {
            console.log('Home: Loading accounts...');
            const accRes = await fetch('/accounts/list', { credentials: 'include' });
            console.log('Home: Accounts response status:', accRes.status);
            if (accRes.ok) {
                const data = await accRes.json();
                console.log('Home: Accounts response data:', data);
                if (data.success === false) {
                    console.error('Failed to load accounts:', data.message);
                    setAccounts([]);
                } else {
                    const accountsData = data?.data || [];
                    console.log('Home: Setting accounts:', accountsData);
                    setAccounts(accountsData);
                }
            } else {
                console.error('Failed to load accounts:', accRes.status);
                setAccounts([]);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            setAccounts([]);
        }
        try {
            const gls = await listGoals();
            setGoals(gls);
        } catch (error) {
            console.error('Error loading goals:', error);
            setGoals([]);
        }
        await loadRecent();
    }

    return (
        <>
            <Header />
            <div className="page">
                <div className="page__inner">
                    <div className="card card--padded">
                        <h1>Welcome, {username || 'Friend'}!</h1>
                    </div>
                    <div className="card card--padded">
                        <QuickActions onAnyChange={loadRecent} />
                    </div>
                    <div className="card card--padded">
                        <h3>Recent activity</h3>
                        {txns.length === 0 ? (
                            <div className="muted">No transactions yet.</div>
                        ) : (
                            <table className="txn-table">
                                <thead>
                                    <tr>
                                        <th>Amount</th><th>Type</th><th>Account</th><th>Goal</th><th>Time</th>
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
