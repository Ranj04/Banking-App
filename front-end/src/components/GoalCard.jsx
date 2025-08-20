import React from 'react';

const fmt = v => (Number(v || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GoalCard({ goal, accountNameFor }) {
  return (
    <div className="card goal-card">
      <div className="card__title">
        <div>{goal.goal?.name || goal.name}</div>
        <span className="pill">in {accountNameFor(goal.accountId) || goal.accountName || goal.account?.name || 'Savings'}</span>
      </div>
      <div className="muted allocated">
        Allocated: ${fmt(goal.allocatedAmount)}
        {goal.targetAmount != null && goal.targetAmount !== '' && (
          <> / ${fmt(goal.targetAmount)}</>
        )}
      </div>
    </div>
  );
}
