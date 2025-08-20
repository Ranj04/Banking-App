import React from 'react';

const fmt = v => (Number(v || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GoalCard({ goal, accountNameFor }) {
  const name = goal.name || goal.goal?.name || '';
  const aid = goal.accountId || goal.account?._id || '';
  const accountName = accountNameFor?.(aid) || goal.accountName || goal.account?.name || 'Savings';
  const allocated = Number(goal.allocatedAmount ?? 0);
  const target = goal.targetAmount != null && goal.targetAmount !== '' ? Number(goal.targetAmount) : null;

  return (
    <div className="card goal-card">
      <div className="card__title">
        <div>{name}</div>
        <span className="pill">in {accountName}</span>
      </div>
      <div className="muted allocated">
        Allocated: ${fmt(allocated)}{target != null && <> / ${fmt(target)}</>}
      </div>
    </div>
  );
}
