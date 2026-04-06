'use client';

import { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
}

// Threshold constants
const BUDGET_WARNING_THRESHOLD = 85;
const BUDGET_LIMIT = 100;
const DEFAULT_CATEGORY_COLOR = '#667eea';

interface BudgetStatus {
  statusClass: string;
  progressColor: string;
  percentageClass: string;
}

export default function BudgetCard({ budget, onEdit, onDelete, formatCurrency }: BudgetCardProps) {
  // Consolidated budget status logic
  const getBudgetStatus = (): BudgetStatus => {
    const percentage = budget.percentage ?? 0;

    if (percentage >= BUDGET_LIMIT) {
      return {
        statusClass: 'over-budget',
        progressColor: '#FF3D00',
        percentageClass: 'over'
      };
    }

    if (percentage >= BUDGET_WARNING_THRESHOLD) {
      return {
        statusClass: 'warning',
        progressColor: '#FFA000',
        percentageClass: 'warning'
      };
    }

    return {
      statusClass: 'on-track',
      progressColor: '#00C853',
      percentageClass: 'good'
    };
  };

  const status = getBudgetStatus();
  const categoryColor = budget.category_color ?? DEFAULT_CATEGORY_COLOR;
  const categoryName = budget.category_name ?? 'Uncategorized';
  const spent = budget.spent ?? 0;
  const remaining = budget.remaining ?? 0;
  const percentage = budget.percentage ?? 0;

  return (
    <div className={`budget-card ${status.statusClass}`}>
      <div className="budget-header">
        <div className="budget-category">
          <div
            className="category-color"
            style={{ backgroundColor: categoryColor }}
          />
          <h3>{categoryName}</h3>
        </div>
        <div className="budget-amounts">
          <div className="budget-limit">{formatCurrency(budget.amount)}</div>
          <div className="budget-spent">Spent: {formatCurrency(spent)}</div>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: status.progressColor
            }}
          />
        </div>
        <div className="progress-stats">
          <span className={`progress-percentage ${status.percentageClass}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="progress-remaining">
            {remaining >= 0
              ? `${formatCurrency(remaining)} left`
              : `${formatCurrency(Math.abs(remaining))} over`}
          </span>
        </div>
      </div>

      <div className="budget-actions">
        <button onClick={onEdit} className="btn-edit">Edit</button>
        <button onClick={onDelete} className="btn-delete">Delete</button>
      </div>
    </div>
  );
}