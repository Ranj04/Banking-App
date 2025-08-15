import React from "react";
import Navbar from "./components/Navbar";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const [amount, setAmount] = React.useState('');
    const [transactions, setTransactions] = React.useState([]);
    const [toId, setToId] = React.useState('');
    const [error, setError] = React.useState('');
    const [toast, setToast] = React.useState(null); // { type, text }
    const toastRef = React.useRef();

    const navigate = useNavigate();

    const goToSavingsGoal = () => {
        navigate("/savings-goal");
    };

    function handleAmountChange(event) {
        let newAmount = event.target.value;

        setAmount(newAmount);
    }

    function getTransactions() {
        const httpSetting = {
            method: 'GET',
            credentials: 'include',
        };

        fetch('/getTransactions', httpSetting) // async
            .then(res => res.json()) // parsed json (from login page)
            .then((apiResult) => {
                console.log(apiResult);
                setTransactions(apiResult.data); // how to display on UI
            })
            .catch((e) => {
                // server fully broken or down
                console.log(e);
            });
    }

       function handleFinancing() {
            console.log(amount);
            const transactionDto = {
                amount: amount,
            };
            console.log(transactionDto);

            const httpSetting = {
                method: 'POST',
                body: JSON.stringify(transactionDto),
                credentials: 'include',
            };

            fetch('/financing', httpSetting) // async
                .then(() => {
                    getTransactions();
                    setAmount('');
                })
                .catch((e) => {
                    // server fully broken or down
                    console.log(e);
                });
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
        const httpSetting = { method: 'POST', body: JSON.stringify({ amount: val }), credentials: 'include' };
        fetch('/createDeposit', httpSetting)
            .then(r => { if(!r.ok) throw new Error(); showToast('success','Deposit successful'); getTransactions(); setAmount(''); })
            .catch(()=> showToast('error','Deposit failed'));
    }

    function handleRepay() {
            console.log(amount);
            const transactionDto = {
                amount: amount,
            };
            console.log(transactionDto);

            const httpSetting = {
                method: 'POST',
                body: JSON.stringify(transactionDto),
                credentials: 'include',
            };

            fetch('/repay', httpSetting) // async
                .then(() => {
                    getTransactions();
                    setAmount('');
                })
                .catch((e) => {
                    // server fully broken or down
                    console.log(e);
                });
        }

    function handleWithdraw() {
        if(!amount) return;
        const val = Number(amount);
        if(isNaN(val) || val <= 0){ showToast('error','Enter a valid amount'); return; }
        const httpSetting = { method: 'POST', body: JSON.stringify({ amount: val }), credentials: 'include' };
        fetch('/withdraw', httpSetting)
            .then(r => { if(!r.ok) throw new Error(); showToast('success','Withdrawal successful'); getTransactions(); setAmount(''); })
            .catch(()=> showToast('error','Withdrawal failed'));
    }

    React.useEffect(() => {
        // This runs 1 time after the first render
        getTransactions();
    }, []);

    function logOut() {
        document.cookie = '';
        navigate('/');
    }

    function handleTransfer() {
        console.log('transfering');
        console.log(amount);
        const transactionDto = {
            amount: amount,
            toId: toId,
        };
        console.log(transactionDto);

        const httpSetting = {
            method: 'POST',
            body: JSON.stringify(transactionDto),
            credentials: 'include',
        };

        setError('');
        fetch('/transfer', httpSetting) // async
            .then(res => res.json()) // extracts json result
            .then((apiResult) => {
                console.log(apiResult)
                if (apiResult.status) {
                    getTransactions();
                    setAmount('');
                    setError('');
                }else{
                    setError(apiResult.message); 
                }
            })
            .catch((e) => {
                // server fully broken or down
                console.log(e);
                setError('Failed to make transfer');
            });
    }

    function formatTimestamp(ts){
        if(!ts) return '';
        try { return new Date(ts).toLocaleString(); } catch { return ''; }
    }

    // Create alias functions to match new JSX naming (deposit/withdraw etc.)
    const deposit = handleDeposit;
    const withdraw = handleWithdraw;
    // financing & repay intentionally disabled in new UI but keep references
    const balance = React.useMemo(()=>{
        if(!Array.isArray(transactions)) return 0;
        return transactions.reduce((sum,t)=>{
            const amt = Number(t.amount)||0;
            const type = (t.transactionType||'').toLowerCase();
            if(['deposit','financing','credit'].includes(type)) return sum + amt;
            if(['withdraw','repay','debit'].includes(type)) return sum - amt;
            return sum;
        },0);
    },[transactions]);
    const balanceDisplay = `$${balance.toFixed(2)}`;
    const balanceFormatted = balanceDisplay; // alias for new JSX snippet naming

            return (
                <>
                    <Navbar />
                    <main className="page">
                        <section className="grid-3">
                            {/* Card A — Quick actions */}
                            <div className="card">
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
                            <div className="card">
                                <h2 className="section-title">Transfer</h2>
                                <div className="stack" style={{gap:10}}>
                                    <input className="input" placeholder="From account" disabled />
                                    <input className="input" placeholder="To account" disabled />
                                    <button className="button ghost" disabled>Transfer</button>
                                    <p className="helper">Transfer is coming soon.</p>
                                </div>
                            </div>

                            {/* Card C — Recent activity */}
                            <div className="card">
                                <h2 className="section-title">Recent activity</h2>
                                <div className="table-container" style={{marginTop:8}}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Amount</th><th>Type</th><th>Time</th><th>From</th><th>To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(transactions) && transactions.length > 0 ? (
                                                transactions.map((t,i)=>(
                                                    <tr key={i}>
                                                        <td>${Number(t.amount).toFixed(2)}</td>
                                                        <td><span className="tag">{t.transactionType}</span></td>
                                                        <td>{formatTimestamp(t.timestamp)}</td>
                                                        <td>{t.fromId}</td>
                                                        <td>{t.toId}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign:'center', color:'var(--muted)' }}>
                                                        No transactions yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {error && <div className="alert error" style={{marginTop:8}}>{error}</div>}
                            </div>
                        </section>
                    </main>
                </>
            );
};
