import React from "react";
import Navbar from "./components/Navbar";
import { useNavigate } from "react-router-dom";
import './Home.css';

// helper for ids used everywhere
const idOf = (obj) => (obj?.id) || (obj?._id?.$oid) || (obj?._id) || (typeof obj === 'string' ? obj : '');

export const Home = () => {
    // userName retained via localStorage if needed later but currently unused
    const [amount, setAmount] = React.useState('');
    const [transactions, setTransactions] = React.useState([]);
    // Removed legacy transfer state (toId) and error display for legacy path
    const [toast, setToast] = React.useState(null); // { type, text }
    const toastRef = React.useRef();
    const [accounts, setAccounts] = React.useState([]);
    const [selectedAccount, setSelectedAccount] = React.useState('');
    const [goals, setGoals] = React.useState([]);
    const [selectedGoalId, setSelectedGoalId] = React.useState('');

    const navigate = useNavigate();

    // Removed unused goToSavingsGoal helper

    function handleAmountChange(event) {
        let newAmount = event.target.value;

        setAmount(newAmount);
    }

    async function apiFetch(url, opts={}){
        const res = await fetch(url, { credentials:'include', ...opts });
        if(res.status === 401){ navigate('/'); throw new Error('Unauthorized'); }
        return res;
    }

    function getTransactions() {
        apiFetch('/getTransactions')
            .then(async res => {
                if(!res.ok) throw new Error(`HTTP ${res.status}`);
                const apiResult = await res.json().catch(()=>({}));
                setTransactions(Array.isArray(apiResult?.data) ? apiResult.data : []);
            })
            .catch(e => console.log('getTransactions failed:', e.message || e));
    }

    // goalId alias for clarity if needed in future extensions
    const goalId = (g) => idOf(g) || idOf(g?.goal?._id) || g?.goalId || '';// eslint-disable-line no-unused-vars


    // Financing handler removed (feature disabled)

    function showToast(type, text){
        if(toastRef.current){ clearTimeout(toastRef.current); }
        setToast({ type, text });
        toastRef.current = setTimeout(()=> setToast(null), 3500);
    }

    async function refreshAccountsAndGoals(){
        try {
            const acc = await fetch('/accounts/list', { credentials:'include' }).then(r=>r.json()).catch(()=>({}));
            setAccounts(acc?.data || []);
            const gs = await fetch('/goals/list', { credentials:'include' }).then(r=>r.json()).catch(()=>({}));
            setGoals(gs?.data || []);
        } catch {/* ignore */}
    }

    async function doDeposit() {
        if(!amount || !selectedAccount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
        try {
            const r = await apiFetch('/createDeposit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount: val, accountId: selectedAccount, goalId: selectedGoalId || undefined }) });
            if(!r.ok) throw new Error();
            setAmount('');
            await Promise.all([
                fetch('/accounts/list', { credentials:'include' }).then(r=>r.json()).then(d=>setAccounts(d?.data||[])),
                fetch('/goals/list', { credentials:'include' }).then(r=>r.json()).then(d=>setGoals(d?.data||[]))
            ]);
            getTransactions();
            showToast('success','Deposit successful');
        } catch { showToast('error','Deposit failed'); }
    }

    // Repay handler removed (feature disabled)

    async function doWithdraw() {
        if(!amount || !selectedAccount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
        try {
            const r = await apiFetch('/withdraw', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount: val, accountId: selectedAccount, goalId: selectedGoalId || undefined }) });
            if(!r.ok) throw new Error();
            setAmount('');
            await Promise.all([
                fetch('/accounts/list', { credentials:'include' }).then(r=>r.json()).then(d=>setAccounts(d?.data||[])),
                fetch('/goals/list', { credentials:'include' }).then(r=>r.json()).then(d=>setGoals(d?.data||[]))
            ]);
            getTransactions();
            showToast('success','Withdraw successful');
        } catch { showToast('error','Withdrawal failed'); }
    }

    React.useEffect(() => {
        getTransactions(); // calls /getTransactions
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // initial loads (separate calls as requested)
    React.useEffect(() => {
        fetch('/accounts/list', { credentials:'include' })
            .then(r=>r.json())
            .then(d=>{ const list = d?.data || []; setAccounts(list); if(!selectedAccount && list.length) setSelectedAccount(idOf(list[0])); })
            .catch(()=>{});
        fetch('/goals/list', { credentials:'include' })
            .then(r=>r.json())
            .then(d=> setGoals(d?.data||[]))
            .catch(()=>{});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goalsForAccount = goals.filter(g => idOf(g.accountId) === selectedAccount);

    // Generic transfer helper accepting payload with optional goal ids
    async function doTransfer(payload){
        if(!payload || typeof payload !== 'object') return;
        const { fromAccountId, toAccountId, amount, fromGoalId, toGoalId } = payload;
        if(!fromAccountId || !toAccountId || !amount || Number(amount) <= 0) return;
        try {
            await fetch('/accounts/transfer', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ fromAccountId, toAccountId, amount: Number(amount), fromGoalId, toGoalId })
            });
            // refresh balances + activity
            fetch('/accounts/list', { credentials:'include' })
                .then(r=>r.json()).then(d=>setAccounts(d?.data||[])).catch(()=>{});
            getTransactions();
            showToast('success','Transfer complete');
        } catch {
            showToast('error','Transfer failed');
        }
    }

    // Minimal inline widget if not using a separate component file
        function TransferWidget({ accounts, goals, onTransfer }) {
            const firstId = accounts.length ? idOf(accounts[0]) : '';
            const [from, setFrom] = React.useState(firstId);
            const [to, setTo] = React.useState('');
            const [amt, setAmt] = React.useState('');
            const [fromGoalId, setFromGoalId] = React.useState('');
            const [toGoalId, setToGoalId] = React.useState('');

            React.useEffect(() => {
                if (accounts.length && !from) setFrom(idOf(accounts[0]));
            }, [accounts, from]);

            const fromGoals = React.useMemo(() => goals.filter(g => idOf(g.accountId) === from), [goals, from]);
            const toGoals = React.useMemo(() => goals.filter(g => idOf(g.accountId) === to), [goals, to]);

            return (
                <>
                    <div className="row" style={{gap:8, flexWrap:'wrap', marginBottom:8}}>
                        <select className="input" value={from} onChange={e=>{ setFrom(e.target.value); setFromGoalId(''); }}>
                            {accounts.map(a => {
                                const aid = idOf(a); return <option key={aid} value={aid}>{a.name} ({a.type})</option>;
                            })}
                        </select>
                        <select className="input" value={fromGoalId} onChange={e=>setFromGoalId(e.target.value)}>
                            <option value="">From goal (optional)</option>
                            {fromGoals.map(g => { const gid = idOf(g); return <option key={gid} value={gid}>{g.goal?.name || g.name}</option>; })}
                        </select>
                    </div>
                    <div className="row" style={{gap:8, flexWrap:'wrap', marginBottom:8}}>
                        <select className="input" value={to} onChange={e=>{ setTo(e.target.value); setToGoalId(''); }}>
                            <option value="">To account…</option>
                            {accounts.map(a => { const aid = idOf(a); return <option key={aid} value={aid}>{a.name} ({a.type})</option>; })}
                        </select>
                        <select className="input" value={toGoalId} onChange={e=>setToGoalId(e.target.value)}>
                            <option value="">To goal (optional)</option>
                            {toGoals.map(g => { const gid = idOf(g); return <option key={gid} value={gid}>{g.goal?.name || g.name}</option>; })}
                        </select>
                        <input className="input" type="number" step="0.01" placeholder="Amount" value={amt} onChange={e=>setAmt(e.target.value)} />
                    </div>
                    <div className="row">
                        <button className="button ghost" disabled={!from || !to || !amt} onClick={() => onTransfer({ fromAccountId: from, toAccountId: to, amount: Number(amt), fromGoalId: fromGoalId || undefined, toGoalId: toGoalId || undefined })}>Transfer</button>
                    </div>
                </>
            );
        }

    // Legacy logout removed (Navbar handles logout)

    // Legacy transfer handler removed (superseded by doTransfer)

    function formatTimestamp(ts){
        if(!ts) return '';
        try { return new Date(ts).toLocaleString(); } catch { return ''; }
    }

    // Create alias functions to match new JSX naming (deposit/withdraw etc.)
    const deposit = doDeposit; // alias for JSX
    const withdraw = doWithdraw;
    // financing & repay intentionally disabled in new UI but keep references
    const totalBalance = React.useMemo(
        () => accounts.reduce((s,a)=> s + Number(a.balance || 0), 0),
        [accounts]
    );
    const balanceDisplay = `$${totalBalance.toFixed(2)}`;
    const balanceFormatted = balanceDisplay; // alias for new JSX snippet naming

    // Map accountId -> display name for quick lookup in activity table
    const accountNameById = React.useMemo(() => {
        const m = {};
        accounts.forEach(a => { m[idOf(a)] = `${a.name} (${a.type})`; });
        return m;
    }, [accounts]);

            return (
                <>
                    <Navbar />
                    <main className="home-container">{/* renamed structural wrapper */}
                        <div className="page-wrap">
                            <div className="cards-grid">{/* renamed from dashboard-grid */}
                                {/* Card A — Welcome / Quick actions */}
                                <div className="card welcome-card">
                                    <div className="row" style={{justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:8}}>
                                        <h1>Welcome!</h1>
                                        <span className="balance-badge">{balanceFormatted || '$0.00'}</span>
                                    </div>
                                    <div className="divider" />
                                    <h2 className="section-title">Quick actions</h2>
                                    <div className="input-group" style={{marginBottom:10}}>
                                        <span className="prefix">$</span>
                                        <input
                                            className="input"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            inputMode="decimal"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {accounts.length > 0 && (
                                        <div style={{marginBottom:12}}>
                                            <select
                                                className="input"
                                                value={selectedAccount}
                                                onChange={e=>{ setSelectedAccount(e.target.value); setSelectedGoalId(''); }}
                                            >
                                                {accounts.map(a => (
                                                    <option key={a.id} value={a.id} >
                                                        {a.name} ({a.type}) — ${Number(a.balance || 0).toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
                                            <div style={{marginTop:8}}>
                                                <select className="input" value={selectedGoalId} onChange={e=> setSelectedGoalId(e.target.value)}>
                                                    <option value="">— No specific goal —</option>
                                                    {goalsForAccount.map(g => {
                                                        const gid = idOf(g); return <option key={gid} value={gid}>{g.goal?.name || g.name}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <div className="toolbar" style={{marginTop:6}}>
                                        <button className="button" onClick={deposit} disabled={!amount}>Deposit</button>
                                        <button className="button ghost" onClick={withdraw} disabled={!amount}>Withdraw</button>
                                        <button className="button ghost" disabled>Financing</button>
                                        <button className="button ghost" disabled>Repay</button>
                                    </div>
                                    {toast && (
                                        <div className={`alert ${toast.type === 'error' ? 'error' : 'success'}`} style={{marginTop:8}}>
                                            {toast.text}
                                        </div>
                                    )}
                                </div>

                                {/* Card B — Transfer */}
                                <div className="card transfer-card">
                                    <h2 className="section-title">Transfer</h2>
                                    {accounts.length ? (
                                        <TransferWidget accounts={accounts} goals={goals} onTransfer={doTransfer} />
                                    ) : (
                                        <p className="helper">Create at least two accounts to transfer funds.</p>
                                    )}
                                </div>

                                {/* Card C — Recent activity */}
                                <div className="card recent-activity">
                                    <h2 className="section-title">Recent activity</h2>
                                    <div className="table-wrapper" style={{marginTop:8}}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th><th>Amount</th><th>Account</th><th>When</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(transactions) && transactions.length > 0 ? (
                                                    transactions.map((t,i)=>(
                                                        <tr key={i}>
                                                            <td><span className="tag">{t.transactionType}</span></td>
                                                            <td>${Number(t.amount).toFixed(2)}</td>
                                                            <td>{accountNameById[idOf(t.accountId) || t.accountId] || '—'}</td>
                                                            <td>{formatTimestamp(t.timestamp)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign:'center', color:'var(--muted)' }}>
                                                            No transactions yet
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Removed legacy error state display (error var no longer defined) */}
                                </div>
                            </div>
                        </div>
                    </main>
                </>
            );
};
