import React, { useEffect, useMemo, useState } from "react";

/* inline notice */
function Notice({ kind="ok", text }) {
  if (!text) return null;
  const cls = kind === "error" ? "inline-notice inline-notice--error" : "inline-notice inline-notice--ok";
  return <div className={cls}>{text}</div>;
}

const isHex24 = s => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
const oid = v => {
  if (!v) return null;
  if (typeof v === "string" && isHex24(v)) return v;
  if (typeof v === "object") {
    if (isHex24(v.$oid)) return v.$oid;
    if (isHex24(v._id)) return v._id;
    if (v._id && isHex24(v._id.$oid)) return v._id.$oid;
    if (isHex24(v.id)) return v.id;
  }
  return null;
};
const num = (v, d=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const fmt = v => num(v,0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

// Define first then export to avoid any tooling edge cases where an inline default
// declaration could transiently produce an empty module object during HMR.
function QuickActions({ onAnyChange }) {
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("deposit");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({kind:"ok", text:""});

  const setFlash = (kind, text) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg({kind:"ok", text:""}), 3600);
  };

  useEffect(() => {
    (async () => {
      // 1) accounts
      let acc = [];
      try {
        let r = await fetch("/accounts/listWithAllocations", { credentials: "include" });
        if (!r.ok) throw new Error();
        acc = await r.json();
      } catch {
        const r2 = await fetch("/accounts/list", { credentials: "include" });
        acc = await r2.json();
      }
      acc = Array.isArray(acc.data) ? acc.data : Array.isArray(acc) ? acc : [];
      acc = acc.map(a => ({
        _id: oid(a._id) || oid(a.id),
        name: a.name || "Savings",
        balance: num(a.balance, 0),
        sumAllocated: num(a.sumAllocated, 0),
        unallocated: a.unallocated != null ? num(a.unallocated,0) : Math.max(0, num(a.balance,0) - num(a.sumAllocated,0)),
      })).filter(a => a._id);

      // 2) goals
      let gl = [];
      try {
        const r = await fetch("/goals/list", { credentials: "include" });
        const j = await r.json();
        gl = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
      } catch {}
      gl = gl.map(g => ({
        _id: oid(g._id) || oid(g.id),
        accountId: oid(g.accountId) || oid(g.account?._id),
        name: g.name || "Goal",
        allocatedAmount: num(g.allocatedAmount, 0),
      })).filter(g => g._id && g.accountId);

      // if sumAllocated missing, compute from goals
      if (acc.length && gl.length && acc.some(a => !a.sumAllocated)) {
        const sums = new Map();
        gl.forEach(g => sums.set(g.accountId, (sums.get(g.accountId)||0) + g.allocatedAmount));
        acc = acc.map(a => {
          const s = sums.get(a._id) || 0;
          return { ...a, sumAllocated: s, unallocated: Math.max(0, a.balance - s) };
        });
      }

      setAccounts(acc);
      setGoals(gl);

      // ✅ FIX: pick sensible defaults without using an out-of-scope "prev"
      const firstAccId = acc[0]?._id || "";
      const nextAccountId = accountId || firstAccId;
      setAccountId(nextAccountId);

      const firstGoalForAccount =
        gl.find(g => g.accountId === nextAccountId)?._id || "";
      const nextGoalId = goalId || firstGoalForAccount;
      setGoalId(nextGoalId);
    })();
  }, []);

  const accountGoals = useMemo(() => goals.filter(g => g.accountId === accountId), [goals, accountId]);
  useEffect(() => {
    // when account changes, pick first goal under it
    const first = accountGoals[0]?._id || "";
    setGoalId(first);
  }, [accountId]); // eslint-disable-line

  const account = useMemo(() => accounts.find(a => a._id === accountId), [accounts, accountId]);
  const unallocated = num(account?.unallocated, 0);
  const goalAlloc = num(accountGoals.find(g => g._id === goalId)?.allocatedAmount, 0);

  const amt = num(amount, NaN);
  const amtValid = Number.isFinite(amt) && amt > 0;
  const canDeposit  = mode === "deposit"  && accountId && goalId && amtValid && amt <= unallocated && !loading;
  const canWithdraw = mode === "withdraw" && accountId && goalId && amtValid && amt <= goalAlloc    && !loading;

  async function doAction(endpoint, okMsg) {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, goalId, amount: amt })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || j?.error || "Request failed");
      setAmount("");
      setFlash("ok", okMsg);
      onAnyChange?.();
      // refresh unallocated/allocated quickly
      setTimeout(() => window.location.reload(), 250); // simplest refresh; replace with a local re-fetch if you prefer
    } catch (e) {
      setFlash("error", e.message || String(e));
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>Quick Actions</h3>

      {/* ACCOUNT SELECT */}
      <select
        className="select select--native"
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
        disabled={accounts.length === 0}
        style={{ width: "100%", marginBottom: 10 }}
      >
        {accounts.length === 0
          ? <option value="">No accounts found</option>
          : accounts.map(a => (
              <option key={a._id} value={a._id}>
                {a.name} — ${fmt(a.balance)}
              </option>
            ))
        }
      </select>

      {/* GOAL SELECT */}
      <select
        className="select select--native"
        value={goalId}
        onChange={e => setGoalId(e.target.value)}
        disabled={!accountId || accountGoals.length === 0}
        style={{ width: "100%", marginBottom: 10 }}
      >
        {!accountId
          ? <option value="">Select an account first…</option>
          : accountGoals.length === 0
            ? <option value="">No goals in this account</option>
            : <>
                <option value="">Select goal…</option>
                {accountGoals.map(g => (
                  <option key={g._id} value={g._id}>{g.name} — allocated ${fmt(g.allocatedAmount)}</option>
                ))}
              </>
        }
      </select>

      {/* AMOUNT */}
      <input
        className="input"
        type="number" inputMode="decimal" min="0" step="0.01"
        placeholder={mode === "deposit" ? `Amount (≤ $${fmt(unallocated)})` : `Amount (≤ $${fmt(goalAlloc)})`}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      {/* TOGGLE + ACTIONS */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className={`btn ${mode==='deposit'?'btn--primary':'btn--ghost'}`} onClick={() => setMode("deposit")} disabled={loading}>Deposit</button>
        <button className={`btn ${mode==='withdraw'?'btn--primary':'btn--ghost'}`} onClick={() => setMode("withdraw")} disabled={loading}>Withdraw</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button className="btn btn--primary" onClick={() => doAction("/createDeposit", `Deposited $${fmt(amt)} successfully.`)} disabled={!canDeposit}>
          {loading && mode==='deposit' ? "Depositing…" : "Confirm deposit"}
        </button>
        <button className="btn" onClick={() => doAction("/withdraw", `Withdrew $${fmt(amt)} successfully.`)} disabled={!canWithdraw}>
          {loading && mode==='withdraw' ? "Withdrawing…" : "Confirm withdraw"}
        </button>
      </div>

      <Notice kind={msg.kind === "error" ? "error" : "ok"} text={msg.text} />
    </div>
  );
}

QuickActions.displayName = 'QuickActions';

// Helpful runtime sanity check (will only log once in production build optimally stripped)
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[QuickActions] module loaded: export is function =', typeof QuickActions === 'function');
}

export default QuickActions;
