'use client';

import { useState, useEffect } from 'react';
import './AddIncomeSourceModal.css';

interface EditIncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLocalUpdate?: (updatedSource: IncomeSource) => void;
  source: IncomeSource | null;
}

interface IncomeSource {
  id: string;
  name: string;
  type: string;
  frequency: string;
  amount: number;
  is_recurring: boolean;
  is_taxable: boolean;
  tax_rate?: number;
  description?: string;
}

const INCOME_TYPES = [
  { value: 'SALARY', label: 'Salary', icon: 'Ã°Å¸â€™Â¼' },
  { value: 'FREELANCE', label: 'Freelance', icon: 'Ã°Å¸â€™Â»' },
  { value: 'INVESTMENT', label: 'Investment', icon: 'Ã°Å¸â€œË†' },
  { value: 'PASSIVE', label: 'Passive Income', icon: 'Ã°Å¸ÂÂ ' },
  { value: 'BUSINESS', label: 'Business', icon: 'Ã°Å¸ÂÂ¢' },
  { value: 'RENTAL', label: 'Rental', icon: 'Ã°Å¸ÂËœÃ¯Â¸Â' },
  { value: 'DIVIDENDS', label: 'Dividends', icon: 'Ã°Å¸â€™Âµ' },
  { value: 'INTEREST', label: 'Interest', icon: 'Ã°Å¸â€™Â°' },
  { value: 'PENSION', label: 'Pension', icon: 'Ã°Å¸â€˜Â´' },
  { value: 'GOVERNMENT', label: 'Government Grant', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â' },
  { value: 'OTHER', label: 'Other', icon: 'Ã°Å¸â€œÂ¦' },
];

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily', icon: 'Ã°Å¸â€œâ€¦' },
  { value: 'WEEKLY', label: 'Weekly', icon: 'Ã°Å¸â€œâ€ ' },
  { value: 'BIWEEKLY', label: 'Bi-weekly', icon: 'Ã°Å¸â€œâ€¦Ã°Å¸â€œâ€¦' },
  { value: 'MONTHLY', label: 'Monthly', icon: 'Ã°Å¸â€œâ€ ' },
  { value: 'QUARTERLY', label: 'Quarterly', icon: 'Ã°Å¸â€œÅ ' },
  { value: 'YEARLY', label: 'Yearly', icon: 'Ã°Å¸â€œË†' },
  { value: 'ONE_TIME', label: 'One-time', icon: 'Ã¢ÂÂ±Ã¯Â¸Â' },
];

export default function EditIncomeSourceModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onLocalUpdate,
  source 
}: EditIncomeSourceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'SALARY',
    frequency: 'MONTHLY',
    amount: '',
    is_recurring: true,
    is_taxable: true,
    tax_rate: '25',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load source data when modal opens
  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        frequency: source.frequency,
        amount: source.amount.toString(),
        is_recurring: source.is_recurring,
        is_taxable: source.is_taxable,
        tax_rate: source.tax_rate?.toString() || '25',
        description: source.description || '',
      });
    }
  }, [source]);

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
    if (!source) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/v1/income/sources/${source.id}`, {
        method: 'PUT',
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update income source');
      }

      // Show success message
      setSuccess('Ã¢Å“â€¦ Income source updated successfully!');
      
      // Update local state immediately for instant UI feedback
      if (onLocalUpdate && source) {
        const updatedSource = {
          ...source,
          name: formData.name,
          type: formData.type,
          frequency: formData.frequency,
          amount: parseFloat(formData.amount),
          is_recurring: formData.is_recurring,
          is_taxable: formData.is_taxable,
          tax_rate: formData.is_taxable ? parseFloat(formData.tax_rate) : 0,
          description: formData.description,
        };
        onLocalUpdate(updatedSource);
        console.log('Updating local state with:', updatedSource); // Add this debug line
  onLocalUpdate(updatedSource);
      }
      
      // Wait a moment so user sees success message, then close and refresh
      setTimeout(() => {
        onSuccess(); // This will trigger fetchAllIncomeData in parent
        onClose();
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !source) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ã¢Å“ÂÃ¯Â¸Â Edit Income Source</h2>
          <button className="modal-close" onClick={onClose}>Ãƒâ€”</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-step">
            {/* Success Message */}
            {success && (
              <div className="success-message" style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Ã¢Å“â€¦</span>
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Ã¢Å¡Â Ã¯Â¸Â</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Source Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Income Type *</label>
              <div className="income-type-grid">
                {INCOME_TYPES.map(type => (
                  <label key={type.value} className={`type-option ${formData.type === type.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleChange}
                      className="type-radio"
                      required
                    />
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="amount" className="form-label">Amount (ZAR) *</label>
                <div className="amount-input">
                  <span className="currency-symbol">R</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    className="form-input amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group half">
                <label htmlFor="frequency" className="form-label">Frequency *</label>
                <select
                  id="frequency"
                  name="frequency"
                  className="form-select"
                  value={formData.frequency}
                  onChange={handleChange}
                  required
                >
                  {FREQUENCIES.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.icon} {freq.label}</option>
                  ))}
                </select>
              </div>
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
                <label htmlFor="tax_rate" className="form-label">Tax Rate (%)</label>
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

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Ã°Å¸â€™Â¾ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}