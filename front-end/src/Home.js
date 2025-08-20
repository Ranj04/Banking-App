import React from "react";
import Navbar from "./components/Navbar";
import { useNavigate } from "react-router-dom";
import './Home.css';

export const Home = () => {
    const userName = (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('userName') : null;
    const [amount, setAmount] = React.useState('');
    const [transactions, setTransactions] = React.useState([]);
    const [toId, setToId] = React.useState('');
    const [error, setError] = React.useState('');
    const [toast, setToast] = React.useState(null); // { type, text }
    const toastRef = React.useRef();
    const [accounts, setAccounts] = React.useState([]);
    const [selectedAccount, setSelectedAccount] = React.useState('');

    const navigate = useNavigate();

    const goToSavingsGoal = () => {
        navigate("/savings-goal");
    };

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


       function handleFinancing() {
            if(!amount) return;
            const val = Number(amount);
            if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
            const httpSetting = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: val }),
            };
            apiFetch('/financing', httpSetting)
                .then(r=>{ if(!r.ok) throw new Error(); showToast('success','Financing successful'); getTransactions(); setAmount(''); })
                .catch(()=> showToast('error','Financing failed'));
        }

    function showToast(type, text){
        if(toastRef.current){ clearTimeout(toastRef.current); }
        setToast({ type, text });
        toastRef.current = setTimeout(()=> setToast(null), 3500);
    }

    function handleDeposit() {
        if(!amount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
    const httpSetting = { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ amount: Number(amount), accountId: selectedAccount || null }) };
        apiFetch('/createDeposit', httpSetting)
            .then(r => { if(!r.ok) throw new Error(); showToast('success','Deposit successful'); getTransactions(); setAmount(''); 
                // refresh accounts balances
                fetch('/accounts/list', { credentials:'include' }).then(r=>r.json()).then(d=>setAccounts(d?.data||[])).catch(()=>{});
            })
            .catch(()=> showToast('error','Deposit failed'));
    }

    function handleRepay() {
        if(!amount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
        const httpSetting = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: val }),
        };
        apiFetch('/repay', httpSetting)
            .then(r=>{ if(!r.ok) throw new Error(); showToast('success','Repay successful'); getTransactions(); setAmount(''); })
            .catch(()=> showToast('error','Repay failed'));
    }

    function handleWithdraw() {
        if(!amount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
    const httpSetting = { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ amount: val, accountId: selectedAccount || null }) };
        apiFetch('/withdraw', httpSetting)
            .then(r => { if(!r.ok) throw new Error(); showToast('success','Withdraw successful'); getTransactions(); setAmount(''); 
                fetch('/accounts/list', { credentials:'include' }).then(r=>r.json()).then(d=>setAccounts(d?.data||[])).catch(()=>{});
            })
            .catch(()=> showToast('error','Withdrawal failed'));
    }

    React.useEffect(() => {
        getTransactions(); // calls /getTransactions
    }, []);

    React.useEffect(() => {
        fetch('/accounts/list', { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                const list = d?.data || [];
                setAccounts(list);
                if (!selectedAccount && list.length) setSelectedAccount(list[0].id);
            })
            .catch(() => {});
    }, []);

    // Generic transfer API helper (simplified abstraction)
    async function doTransfer(fromAccountId, toAccountId, amount){
        if(!fromAccountId || !toAccountId || !amount || Number(amount) <= 0) return;
        try {
            await fetch('/accounts/transfer', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ fromAccountId, toAccountId, amount: Number(amount) })
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
    function TransferWidget({ accounts, onTransfer }) {
        const [from, setFrom] = React.useState(accounts[0]?.id || '');
        const [to, setTo] = React.useState('');
        const [amt, setAmt] = React.useState('');

        React.useEffect(() => {
            if (accounts.length && !from) setFrom(accounts[0].id);
        }, [accounts, from]);

        return (
            <>
                <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                    <select className="input" value={from} onChange={e=>setFrom(e.target.value)}>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                    </select>
                    <select className="input" value={to} onChange={e=>setTo(e.target.value)}>
                        <option value="">To…</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                    </select>
                    <input className="input" type="number" step="0.01" placeholder="Amount" value={amt} onChange={e=>setAmt(e.target.value)} />
                </div>
                <div className="row" style={{marginTop:8}}>
                    <button className="button ghost" disabled={!from || !to || !amt} onClick={()=> onTransfer(from, to, amt)}>Transfer</button>
                </div>
            </>
        );
    }

    function logOut() {
        document.cookie = '';
        navigate('/');
    }

    function handleTransfer() {
        if(!amount || !toId) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ setError('Enter a valid amount'); return; }
        const httpSetting = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: val, toId }),
        };
        setError('');
        apiFetch('/transfer', httpSetting)
            .then(res => res.json())
            .then(apiResult => {
                if(apiResult.status){
                    getTransactions();
                    setAmount('');
                    setToId('');
                } else {
                    setError(apiResult.message || 'Transfer failed');
                }
            })
            .catch(()=> setError('Transfer failed'));
    }

    function formatTimestamp(ts){
        if(!ts) return '';
        try { return new Date(ts).toLocaleString(); } catch { return ''; }
    }

    // Create alias functions to match new JSX naming (deposit/withdraw etc.)
    const deposit = handleDeposit;
    const withdraw = handleWithdraw;
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
        accounts.forEach(a => { m[a.id] = `${a.name} (${a.type})`; });
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
                                                onChange={e=>setSelectedAccount(e.target.value)}
                                            >
                                                {accounts.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name} ({a.type}) — ${Number(a.balance || 0).toFixed(2)}
                                                    </option>
                                                ))}
                                            </select>
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
                                        <TransferWidget accounts={accounts} onTransfer={doTransfer} />
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
                                                            <td>{accountNameById[t.accountId] || '—'}</td>
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
                                    {error && <div className="alert error" style={{marginTop:8}}>{error}</div>}
                                </div>
                            </div>
                        </div>
                    </main>
                </>
            );
};
