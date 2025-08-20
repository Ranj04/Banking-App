import React, { useEffect, useMemo, useState } from "react";

// tiny toast system (no deps)
function Toast({ kind = "success", text, onClose }) {
  useEffect(() => { const id = setTimeout(onClose, 2600); return () => clearTimeout(id); }, [onClose]);
  return <div className={`toast ${kind}`}>{text}</div>;
}

// normalize Mongo IDs & numbers
const idOf = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v.$oid) return v.$oid;
  return String(v);
};
const num = (v, d = 0) => (v == null || Number.isNaN(Number(v)) ? d : Number(v));

export default function QuickActions({ onAnyChange }) {
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("deposit"); // 'deposit' | 'withdraw'
  const [toast, setToast] = useState(null);  // {kind,text}

  // fetch data on mount
  useEffect(() => {
    (async () => {
      const [aRes, gRes] = await Promise.all([
        fetch("/accounts/listWithAllocations", { credentials: "include" }).catch(() => null),
        fetch("/goals/list", { credentials: "include" }).catch(() => null),
      ]);

      // fallback if /accounts/listWithAllocations not present
      let accountsData = [];
      if (aRes && aRes.ok) {
        const j = await aRes.json();
        accountsData = Array.isArray(j.data) ? j.data : j.data?.data || [];
        // normalize a bit
        accountsData = accountsData.map((a) => ({
          ...a,
          _id: idOf(a._id),
          balance: num(a.balance, 0),
          sumAllocated: num(a.sumAllocated, 0),
          unallocated:
            a.unallocated != null
              ? num(a.unallocated, 0)
              : Math.max(0, num(a.balance, 0) - num(a.sumAllocated, 0)),
        }));
      } else {
        const res = await fetch("/accounts/list", { credentials: "include" });
        const j = await res.json();
        accountsData = (j.data || j)?.map?.((a) => ({
          ...a,
          _id: idOf(a._id),
          balance: num(a.balance, 0),
        })) || [];
      }

      let goalsData = [];
      if (gRes && gRes.ok) {
        const j = await gRes.json();
        const raw = Array.isArray(j.data) ? j.data : j.data?.data || [];
        goalsData = raw.map((g) => ({
          ...g,
            _id: idOf(g._id),
            accountId: idOf(g.accountId),
            allocatedAmount: num(g.allocatedAmount, 0),
            targetAmount: g.targetAmount != null ? num(g.targetAmount) : null,
        }));
      }

      setAccounts(accountsData);
      setGoals(goalsData);

      // sensible defaults
      if (accountsData.length && !selectedAccountId) {
        setSelectedAccountId(accountsData[0]._id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // goals filtered to account
  const accountGoals = useMemo(
    () => goals.filter((g) => idOf(g.accountId) === idOf(selectedAccountId)),
    [goals, selectedAccountId]
  );

  // derived amounts: unallocated for account, allocated for selected goal
  const account = useMemo(
    () => accounts.find((a) => idOf(a._id) === idOf(selectedAccountId)),
    [accounts, selectedAccountId]
  );

  const sumAllocated = useMemo(() => {
    if (!selectedAccountId) return 0;
    return accountGoals.reduce((s, g) => s + num(g.allocatedAmount, 0), 0);
  }, [accountGoals, selectedAccountId]);

  const unallocated = useMemo(() => {
    const bal = num(account?.balance, 0);
    // prefer server-provided unallocated if present
    const srv = account?.unallocated;
    return srv != null ? num(srv, 0) : Math.max(0, bal - sumAllocated);
  }, [account, sumAllocated]);

  const selectedGoal = useMemo(
    () => accountGoals.find((g) => idOf(g._id) === idOf(selectedGoalId)),
    [accountGoals, selectedGoalId]
  );
  const goalAllocated = num(selectedGoal?.allocatedAmount, 0);

  // ui guards
  const amt = num(amount, NaN);
  const amtValid = Number.isFinite(amt) && amt > 0;
  const canDeposit =
    tab === "deposit" && selectedAccountId && selectedGoalId && amtValid && amt <= unallocated && !loading;
  const canWithdraw =
    tab === "withdraw" && selectedAccountId && selectedGoalId && amtValid && amt <= goalAllocated && !loading;

  // helpers
  const fmt = (v) =>
    num(v, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function doDeposit() {
    if (!canDeposit) return;
    setLoading(true);
    try {
      const res = await fetch("/createDeposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          goalId: selectedGoalId,
          amount: amt,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) {
        throw new Error(j?.message || j?.error || "Deposit failed");
      }
      setToast({ kind: "success", text: `Deposited $${fmt(amt)} to “${selectedGoal?.name || "Goal"}”.` });
      setAmount("");
      // refresh lists
      await refreshData();
      onAnyChange?.();
    } catch (e) {
      setToast({ kind: "error", text: String(e.message || e) });
    } finally {
      setLoading(false);
    }
  }

  async function doWithdraw() {
    if (!canWithdraw) return;
    setLoading(true);
    try {
      const res = await fetch("/withdraw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          goalId: selectedGoalId,
          amount: amt,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) {
        throw new Error(j?.message || j?.error || "Withdraw failed");
      }
      setToast({ kind: "success", text: `Withdrew $${fmt(amt)} from “${selectedGoal?.name || "Goal"}”.` });
      setAmount("");
      await refreshData();
      onAnyChange?.();
    } catch (e) {
      setToast({ kind: "error", text: String(e.message || e) });
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    const [accRes, goalsRes] = await Promise.all([
      fetch("/accounts/listWithAllocations", { credentials: "include" }).catch(() => null),
      fetch("/goals/list", { credentials: "include" }).catch(() => null),
    ]);
    if (accRes && accRes.ok) {
      const j = await accRes.json();
      let arr = Array.isArray(j.data) ? j.data : j.data?.data || [];
      arr = arr.map((a) => ({
        ...a,
        _id: idOf(a._id),
        balance: num(a.balance, 0),
        sumAllocated: num(a.sumAllocated, 0),
        unallocated:
          a.unallocated != null
            ? num(a.unallocated, 0)
            : Math.max(0, num(a.balance, 0) - num(a.sumAllocated, 0)),
      }));
      setAccounts(arr);
    }
    if (goalsRes && goalsRes.ok) {
      const j = await goalsRes.json();
      const raw = Array.isArray(j.data) ? j.data : j.data?.data || [];
      setGoals(
        raw.map((g) => ({
          ...g,
          _id: idOf(g._id),
          accountId: idOf(g.accountId),
          allocatedAmount: num(g.allocatedAmount, 0),
          targetAmount: g.targetAmount != null ? num(g.targetAmount) : null,
        }))
      );
    }
  }

  // UI
  return (
    <div className="card qa-card" style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>

      {/* Account select */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <select
          value={selectedAccountId || ""}
          onChange={(e) => {
            const next = e.target.value || null;
            setSelectedAccountId(next);
            // auto-pick first goal in that account
            const first = goals.find((g) => idOf(g.accountId) === idOf(next));
            setSelectedGoalId(first?._id || null);
          }}
          style={{ flex: "1 1 40%", padding: 10, borderRadius: 10, background: "#0f1b27", color: "#cfe6ff" }}
        >
          {accounts.length === 0 ? (
            <option value="">No accounts</option>
          ) : (
            accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — ${fmt(a.balance)}
              </option>
            ))
          )}
        </select>

        {/* Goal select (dependent) */}
        <select
          value={selectedGoalId || ""}
          onChange={(e) => setSelectedGoalId(e.target.value || null)}
          disabled={!selectedAccountId || accountGoals.length === 0}
          style={{ flex: "1 1 40%", padding: 10, borderRadius: 10, background: "#0f1b27", color: "#cfe6ff" }}
        >
          {!selectedAccountId ? (
            <option value="">Select an account first…</option>
          ) : accountGoals.length === 0 ? (
            <option value="">No goals in this account</option>
          ) : (
            <>
              <option value="">Select goal…</option>
              {accountGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} — allocated ${fmt(g.allocatedAmount)}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Amount + tabs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="number"
          inputMode="decimal"
          placeholder={tab === "deposit" ? `Amount (≤ $${fmt(unallocated)})` : `Amount (≤ $${fmt(goalAllocated)})`}
          value={amount}
          min="0"
          step="0.01"
          max={tab === "deposit" ? unallocated : goalAllocated}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            flex: "1 1 auto",
            padding: 10,
            borderRadius: 10,
            background: "#0f1b27",
            color: "#cfe6ff",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setTab("deposit")}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: tab === "deposit" ? "#2b63ff" : "#122237",
              color: "#fff",
              border: "none",
            }}
          >
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: tab === "withdraw" ? "#2b63ff" : "#122237",
              color: "#fff",
              border: "none",
            }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* contextual helper text */}
      <div style={{ marginTop: 6, fontSize: 12, color: "#87a1b5" }}>
        {tab === "deposit" && selectedAccountId && (
          <>Unallocated in this account: <b>${fmt(unallocated)}</b></>
        )}
        {tab === "withdraw" && selectedGoal && (
          <>Allocated in “{selectedGoal.name}”: <b>${fmt(goalAllocated)}</b></>
        )}
      </div>

      {/* action row */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={doDeposit}
          disabled={!canDeposit}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: canDeposit ? "#2b63ff" : "#193357",
            color: "#fff",
            border: "none",
            minWidth: 110,
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading && tab === "deposit" ? "Depositing…" : "Confirm deposit"}
        </button>
        <button
          onClick={doWithdraw}
          disabled={!canWithdraw}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: canWithdraw ? "#2b63ff" : "#193357",
            color: "#fff",
            border: "none",
            minWidth: 120,
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading && tab === "withdraw" ? "Withdrawing…" : "Confirm withdraw"}
        </button>
      </div>

      {toast && <Toast kind={toast.kind} text={toast.text} onClose={() => setToast(null)} />}
    </div>
  );
}
