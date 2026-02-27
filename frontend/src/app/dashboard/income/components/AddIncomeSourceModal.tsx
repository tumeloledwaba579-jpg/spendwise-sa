'use client';

import { useState } from 'react';
import './AddIncomeSourceModal.css';

interface AddIncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  type: string;
  frequency: string;
  amount: string;
  is_recurring: boolean;
  is_taxable: boolean;
  tax_rate: string;
  description: string;
  start_date: string;
}

const INCOME_TYPES = [
  { value: 'SALARY', label: 'Salary', icon: '💼' },
  { value: 'FREELANCE', label: 'Freelance', icon: '💻' },
  { value: 'INVESTMENT', label: 'Investment', icon: '📈' },
  { value: 'PASSIVE', label: 'Passive Income', icon: '🏠' },
  { value: 'BUSINESS', label: 'Business', icon: '🏢' },
  { value: 'RENTAL', label: 'Rental', icon: '🏘️' },
  { value: 'DIVIDENDS', label: 'Dividends', icon: '💵' },
  { value: 'INTEREST', label: 'Interest', icon: '💰' },
  { value: 'PENSION', label: 'Pension', icon: '👴' },
  { value: 'GOVERNMENT', label: 'Government Grant', icon: '🏛️' },
  { value: 'OTHER', label: 'Other', icon: '📦' },
];

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily', icon: '📅' },
  { value: 'WEEKLY', label: 'Weekly', icon: '📆' },
  { value: 'BIWEEKLY', label: 'Bi-weekly', icon: '📅📅' },
  { value: 'MONTHLY', label: 'Monthly', icon: '📆' },
  { value: 'QUARTERLY', label: 'Quarterly', icon: '📊' },
  { value: 'YEARLY', label: 'Yearly', icon: '📈' },
  { value: 'ONE_TIME', label: 'One-time', icon: '⏱️' },
];

export default function AddIncomeSourceModal({ isOpen, onClose, onSuccess }: AddIncomeSourceModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'SALARY',
    frequency: 'MONTHLY',
    amount: '',
    is_recurring: true,
    is_taxable: true,
    tax_rate: '25',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/income/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          frequency: formData.frequency,
          amount: parseFloat(formData.amount),
          is_recurring: formData.is_recurring,
          is_taxable: formData.is_taxable,
          tax_rate: formData.is_taxable ? parseFloat(formData.tax_rate) : 0,
          description: formData.description || undefined,
          start_date: formData.start_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = '';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => 
              `${err.loc.join('.')}: ${err.msg}`
            ).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = 'Failed to create income source';
        }
        throw new Error(errorMessage);
      }

      setFormData({
        name: '',
        type: 'SALARY',
        frequency: 'MONTHLY',
        amount: '',
        is_recurring: true,
        is_taxable: true,
        tax_rate: '25',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
      });
      setStep(1);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💰 Add Income Source</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Basic Info</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Income Details</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="modal-step">
              <h3 className="step-title">Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Source Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Primary Salary, Freelance Work"
                  required
                  autoFocus
                />
                <small className="form-hint">Give this income source a descriptive name</small>
              </div>

              <div className="form-group">
                <label className="form-label">Income Type <span className="required">*</span></label>
                <div className="income-type-grid">
                  {INCOME_TYPES.map(type => (
                    <label
                      key={type.value}
                      className={`type-option ${formData.type === type.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="type-radio"
                      />
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-label">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional notes about this income source"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-step">
              <h3 className="step-title">Income Details</h3>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="amount" className="form-label">
                    Amount (ZAR) <span className="required">*</span>
                  </label>
                  <div className="amount-input">
                    <span className="currency-symbol">R</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className="form-input amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group half">
                  <label htmlFor="frequency" className="form-label">
                    Frequency <span className="required">*</span>
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    className="form-select"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                  >
                    {FREQUENCIES.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.icon} {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="start_date" className="form-label">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label checkbox">
                    <input
                      type="checkbox"
                      name="is_recurring"
                      checked={formData.is_recurring}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="checkbox-label">Recurring Income</span>
                  </label>
                </div>

                <div className="form-group half">
                  <label className="form-label checkbox">
                    <input
                      type="checkbox"
                      name="is_taxable"
                      checked={formData.is_taxable}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="checkbox-label">Taxable Income</span>
                  </label>
                </div>
              </div>

              {formData.is_taxable && (
                <div className="form-group">
                  <label htmlFor="tax_rate" className="form-label">
                    Tax Rate (%)
                  </label>
                  <div className="tax-rate-input">
                    <input
                      type="range"
                      id="tax_rate"
                      name="tax_rate"
                      className="form-range"
                      value={formData.tax_rate}
                      onChange={handleChange}
                      min="0"
                      max="45"
                      step="0.5"
                    />
                    <span className="range-value">{formData.tax_rate}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="modal-step">
              <h3 className="step-title">Review Income Source</h3>
              
              <div className="review-card">
                <div className="review-header">
                  <span className="review-icon">
                    {INCOME_TYPES.find(t => t.value === formData.type)?.icon}
                  </span>
                  <span className="review-name">{formData.name || 'Unnamed Source'}</span>
                </div>
                
                <div className="review-details">
                  <div className="review-row">
                    <span className="review-label">Type:</span>
                    <span className="review-value">
                      {INCOME_TYPES.find(t => t.value === formData.type)?.label}
                    </span>
                  </div>
                  
                  <div className="review-row">
                    <span className="review-label">Amount:</span>
                    <span className="review-value amount">
                      R {parseFloat(formData.amount || '0').toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="review-row">
                    <span className="review-label">Frequency:</span>
                    <span className="review-value">
                      {FREQUENCIES.find(f => f.value === formData.frequency)?.label}
                    </span>
                  </div>

                  <div className="review-row">
                    <span className="review-label">Start Date:</span>
                    <span className="review-value">{formData.start_date}</span>
                  </div>
                  
                  <div className="review-row">
                    <span className="review-label">Recurring:</span>
                    <span className={`review-value ${formData.is_recurring ? 'yes' : 'no'}`}>
                      {formData.is_recurring ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  
                  <div className="review-row">
                    <span className="review-label">Taxable:</span>
                    <span className={`review-value ${formData.is_taxable ? 'yes' : 'no'}`}>
                      {formData.is_taxable ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  
                  {formData.is_taxable && (
                    <div className="review-row">
                      <span className="review-label">Tax Rate:</span>
                      <span className="review-value">{formData.tax_rate}%</span>
                    </div>
                  )}
                  
                  {formData.description && (
                    <div className="review-row description">
                      <span className="review-label">Notes:</span>
                      <span className="review-value">{formData.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={prevStep}>
                ← Back
              </button>
            )}
            
            {step < 3 ? (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Creating...
                  </>
                ) : (
                  '✨ Create Income Source'
                )}
              </button>
            )}
            
            <button type="button" className="btn-text" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}