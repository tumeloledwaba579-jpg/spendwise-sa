'use client';

import { useState, useEffect } from 'react';
import { Budget } from '../types';

interface BudgetFormProps {
  budget?: Budget | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formatCurrency: (amount: number) => string;
}

export default function BudgetForm({ budget, onClose, onSubmit, formatCurrency }: BudgetFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category_id: budget?.category_id || '',
    amount: budget?.amount.toString() || '',
    period: budget?.period || 'monthly',
    year: budget?.year || new Date().getFullYear(),
    month: budget?.month || new Date().getMonth() + 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories?category_type=expense`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{budget ? 'Edit Budget' : 'Create New Budget'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Budget Amount (ZAR) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="5000"
              required
            />
          </div>

          <div className="form-group">
            <label>Period *</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="monthly"
                  checked={formData.period === 'monthly'}
                  onChange={(e) => setFormData({...formData, period: e.target.value as 'monthly' | 'yearly'})}
                />
                Monthly
              </label>
              <label>
                <input
                  type="radio"
                  value="yearly"
                  checked={formData.period === 'yearly'}
                  onChange={(e) => setFormData({...formData, period: e.target.value as 'monthly' | 'yearly'})}
                />
                Yearly
              </label>
            </div>
          </div>

          {formData.period === 'monthly' && (
            <div className="form-row">
              <div className="form-group">
                <label>Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Month</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}