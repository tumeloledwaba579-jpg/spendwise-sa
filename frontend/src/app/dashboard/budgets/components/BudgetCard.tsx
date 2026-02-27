'use client';

import { Budget } from '../types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
}

export default function BudgetCard({ budget, onEdit, onDelete, formatCurrency }: BudgetCardProps) {
  const getStatusClass = () => {
    if (budget.percentage >= 100) return 'over-budget';
    if (budget.percentage >= 85) return 'warning';
    return 'on-track';
  };

  const getProgressColor = () => {
    if (budget.percentage >= 100) return '#FF3D00';
    if (budget.percentage >= 85) return '#FFA000';
    return '#00C853';
  };

  const getPercentageClass = () => {
    if (budget.percentage >= 100) return 'over';
    if (budget.percentage >= 85) return 'warning';
    return 'good';
  };

  return (
    <div className={`budget-card ${getStatusClass()}`}>
      <div className="budget-header">
        <div className="budget-category">
          <div 
            className="category-color" 
            style={{ backgroundColor: budget.category_color || '#667eea' }}
          />
          <h3>{budget.category_name}</h3>
        </div>
        <div className="budget-amounts">
          <div className="budget-limit">{formatCurrency(budget.amount)}</div>
          <div className="budget-spent">Spent: {formatCurrency(budget.spent)}</div>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${Math.min(budget.percentage, 100)}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>
        <div className="progress-stats">
          <span className={`progress-percentage ${getPercentageClass()}`}>
            {budget.percentage.toFixed(1)}%
          </span>
          <span className="progress-remaining">
            {budget.remaining >= 0 
              ? `${formatCurrency(budget.remaining)} left`
              : `${formatCurrency(Math.abs(budget.remaining))} over`}
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