import React from "react";
import Header from "../components/Header";
import useFlashMessage from "../hooks/useFlashMessage";
import InlineNotice from "../components/InlineNotice";
import { oid, num } from "../utils/oid";

const fmt = v => num(v,0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

export default function GoalsPage() {
  const [accounts, setAccounts] = React.useState([]);
  const [goals, setGoals] = React.useState([]);
  const [accId, setAccId] = React.useState("");
  const [name, setName] = React.useState("");
  const [target, setTarget] = React.useState("");

  const flash = useFlashMessage(3600);

  React.useEffect(() => { reload(); }, []);

  // --- reload(): normalize account ids robustly ---
  async function reload() {
    try {
      const a = await fetch("/accounts/list", { credentials: "include" }).then(r => r.json());
      const accountsRaw = Array.isArray(a.data) ? a.data : a.data?.data || a || [];
      const accountsNorm = accountsRaw
        .map(x => ({ _id: oid(x._id) || oid(x.id), name: x.name, balance: num(x.balance,0) }))
        .filter(x => !!x._id);
      setAccounts(accountsNorm);
      setAccId(prev => prev || accountsNorm[0]?._id || "");
    } catch {}

    try {
      const g = await fetch("/goals/list", { credentials: "include" }).then(r => r.json());
      const goalsRaw = Array.isArray(g.data) ? g.data : g.data?.data || [];
      const goalsNorm = goalsRaw.map(x => ({
        _id: oid(x._id) || oid(x.id),
        accountId: oid(x.accountId) || oid(x.account?._id),
        name: x.name || "",
        allocatedAmount: num(x.allocatedAmount,0),
        targetAmount: x.targetAmount != null ? num(x.targetAmount) : null,
      }));
      setGoals(goalsNorm);
    } catch {}
  }

  // --- createGoal(): no more "pick a valid account"; auto-resolve id ---
  async function createGoal(e) {
    e.preventDefault();

    // Resolve the id from state or the accounts list
    const selected = accounts.find(a => a._id === accId) || accounts[0];
    const accountHex = oid(accId) || oid(selected?._id);

    if (!accountHex) {
      flash.flash("error", "Could not resolve an account id. Try refreshing Accounts, then come back.");
      return;
    }

    try {
      const res = await fetch("/goals/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountHex,              // plain 24-char string
          name: name.trim(),
          targetAmount: target ? Number(target) : null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || j?.error || "Failed to create goal");

      flash.flash("success", "Goal created successfully.");
      setName(""); setTarget("");
      await reload();
    } catch (e) {
      flash.flash("error", e.message || String(e));
    }
  }

  const accountNameFor = id => accounts.find(a => a._id === id)?.name || "Savings";

  return (
    <>
      <Header />
      <div className="page">
        <div className="page__inner">
          {/* Create form */}
          <div className="card card--padded hero">
            <h2 className="card__title">Create a goal</h2>
            <form onSubmit={createGoal} className="row" style={{ gap:12, flexWrap:"wrap" }}>
              <select className="select" value={accId} onChange={e=>setAccId(e.target.value)} required style={{ minWidth:240 }}>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.name} — ${fmt(a.balance)}</option>)}
              </select>
              <input className="input" placeholder="Goal name" value={name} onChange={e=>setName(e.target.value)} required style={{ minWidth:220 }}/>
              <input className="input" placeholder="Target (optional)" type="number" min="0" step="0.01" value={target} onChange={e=>setTarget(e.target.value)} style={{ minWidth:200 }}/>
              <button type="submit" className="btn btn--primary">Create</button>
            </form>
            {flash.text && <InlineNotice kind={flash.kind === "error" ? "error" : flash.kind}>{flash.text}</InlineNotice>}
          </div>

          {/* List */}
          <div className="card card--padded">
            <h2 className="card__title">Your goals</h2>
            {goals.length === 0 ? (
              <div className="muted">No goals yet. Create your first goal above.</div>
            ) : (
              <table className="table">
                <thead><tr><th>Goal</th><th>Account</th><th>Allocated</th><th>Target</th></tr></thead>
                <tbody>
                  {goals.map(g => (
                    <tr key={g._id}>
                      <td>{g.name}</td>
                      <td><span className="pill">in {accountNameFor(g.accountId)}</span></td>
                      <td>${fmt(g.allocatedAmount)}</td>
                      <td>{g.targetAmount != null ? `$${fmt(g.targetAmount)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// This gives you a nice “hero” create card, proper spacing, and a clean table.
