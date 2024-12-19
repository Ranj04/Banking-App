import React from "react";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const [amount, setAmount] = React.useState('');
    const [transactions, setTransactions] = React.useState([]);
    const [toId, setToId] = React.useState('');
    const [error, setError] = React.useState('');

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

    function handleDeposit() {
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

        fetch('/createDeposit', httpSetting) // async
            .then(() => {
                getTransactions();
                setAmount('');
            })
            .catch((e) => {
                // server fully broken or down
                console.log(e);
            });
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

        fetch('/withdraw', httpSetting) // async
            .then(() => {
                getTransactions();
                setAmount('');
            })
            .catch((e) => {
                // server fully broken or down
                console.log(e);
            });
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

    return (
        <div>
            <h1>Welcome!</h1>
            <button onClick={goToSavingsGoal}>Go to Savings Goal</button>
            <div><button onClick={logOut}>Log Out</button></div>
            <div>
                $<input value={amount} onChange={handleAmountChange} />
                <button disabled={amount === ''} onClick={handleDeposit}>Deposit</button>
                <button disabled={amount === ''} onClick={handleWithdraw}>Withdraw</button>
                <button disabled={amount === ''} onClick={handleFinancing}>Financing</button>
                <button disabled={amount === ''} onClick={handleRepay}>Repay</button>
            </div>
            <div>
                Transfer:
                <input value={toId} onChange={(event) => setToId(event.target.value)} />
                <button disabled={amount === '' || toId === ''} onClick={handleTransfer}>Transfer</button>
            </div>
            <div>{error}</div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Time</th>
                            <th>From</th>
                            <th>To</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(transactionDto => (<tr>
                            <td>{transactionDto.amount}</td>
                            <td>{transactionDto.transactionType}</td>
                            <td>{new Date(transactionDto.timestamp).toLocaleDateString()}</td>
                            <td>{transactionDto.toId}</td>
                            <td>{transactionDto.fromId}</td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
