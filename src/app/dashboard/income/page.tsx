'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ============================================
// TYPES & INTERFACES
// ============================================
interface IncomeFormData {
  title: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  frequency: string;
  paymentDate: string;
  notes: string;
  isRecurring: boolean;
}

interface FormErrors {
  title?: string;
  amount?: string;
  category?: string;
  paymentDate?: string;
  general?: string;
}

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental',
  'Government Grant',
  'Bonus',
  'Commission',
  'Pension',
  'Other'
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'once', label: 'One-time' }
];

// ============================================
// MAIN INCOME PAGE COMPONENT
// ============================================
const IncomePage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<IncomeFormData>({
    title: '',
    amount: 0,
    currency: 'ZAR',
    category: '',
    source: '',
    frequency: 'monthly',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    isRecurring: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Income title is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/v1/income/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.title,
          type: formData.category.toUpperCase().replace(' ', '_'),
          frequency: formData.frequency.toUpperCase(),
          amount: formData.amount.toString(),
          is_recurring: formData.isRecurring,
          is_taxable: true,
          auto_tax_calculation: true,
          tax_rate: 0.15
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Also record in income history
        const historyResponse = await fetch('http://localhost:8000/api/v1/income/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            income_source_id: data.id,
            amount: formData.amount.toString(),
            received_date: formData.paymentDate,
            tax_amount: (formData.amount * 0.15).toString(),
            notes: formData.notes
          }),
        });

        if (historyResponse.ok) {
          setIsSubmitted(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          throw new Error('Failed to record income history');
        }
      } else {
        let errorMessage = 'Failed to add income. Please try again.';
        if (data.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : 'Submission failed';
        }
        setErrors({ general: errorMessage });
      }
    } catch (error: any) {
      console.error('Income submission error:', error);
      setErrors({ 
        general: error.message || 'Network error. Please check if the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // INPUT HANDLERS
  // ============================================
  const handleInputChange = (field: keyof IncomeFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ============================================
  // FORMAT CURRENCY
  // ============================================
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="financial-page">
      {/* Left Panel - Branding & Stats */}
      <div className="financial-left">
        <div className="financial-left-content">
          <Link href="/dashboard" className="logo">
            SpendWise SA
          </Link>
          
          <div className="marketing-content">
            <h1 className="marketing-title">
              Track your
              <span className="marketing-title-gradient"> income streams</span>
            </h1>
            
            <p className="marketing-description">
              Record all your income sources to get a complete picture of your financial health and plan for the future.
            </p>
            
            <div className="stats-preview">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">+32%</div>
                  <div className="stat-label">Avg. income growth</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">2.4</div>
                  <div className="stat-label">Avg. income sources</div>
                </div>
              </div>
            </div>

            <div className="benefits-list">
              <h3 className="benefits-title">Why track income?</h3>
              <ul className="benefits-items">
                <li className="benefit-item">Identify your highest earning streams</li>
                <li className="benefit-item">Plan for tax season accurately</li>
                <li className="benefit-item">Set realistic savings goals</li>
                <li className="benefit-item">Detect payment inconsistencies</li>
              </ul>
            </div>

            <div className="quick-tip">
              <div className="tip-icon">💡</div>
              <div className="tip-content">
                <strong>Pro Tip:</strong> Track all income sources, no matter how small. 
                Side hustles can add up to significant amounts over time!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Income Form */}
      <div className="financial-right">
        <div className="financial-form-container">
          {/* Back Navigation */}
          <div className="back-navigation">
            <Link href="/dashboard" className="back-link">
              <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="form-header">
            <h2 className="form-title">Add Income</h2>
            <p className="form-subtitle">
              Record a new income source or payment
            </p>
          </div>

          {/* Success Message */}
          {isSubmitted && (
            <div className="alert alert-success">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Income added successfully! Redirecting to dashboard...</span>
            </div>
          )}

          {/* Error Alert */}
          {errors.general && (
            <div className="alert alert-error">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Income Form */}
          <form onSubmit={handleSubmit} className="financial-form" noValidate>
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Income Title *
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <input
                  id="title"
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g., Monthly Salary, Freelance Project"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.title && (
                <p className="error-message">{errors.title}</p>
              )}
            </div>

            {/* Amount & Currency */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Amount *
                </label>
                <div className="input-wrapper with-currency">
                  <div className="currency-symbol">R</div>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-input ${errors.amount ? 'error' : ''}`}
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </div>
                {errors.amount && (
                  <p className="error-message">{errors.amount}</p>
                )}
                <p className="helper-text">Amount: {formatCurrency(formData.amount)}</p>
              </div>

              <div className="form-group">
                <label htmlFor="currency" className="form-label">
                  Currency
                </label>
                <div className="select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="6" x2="12" y2="18"></line>
                    <line x1="6" y1="12" x2="18" y2="12"></line>
                  </svg>
                  <select
                    id="currency"
                    className="form-select"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="ZAR">South African Rand (ZAR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category & Source */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <div className="select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  <select
                    id="category"
                    className={`form-select ${errors.category ? 'error' : ''}`}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select a category</option>
                    {INCOME_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className="error-message">{errors.category}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="source" className="form-label">
                  Income Source
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <input
                    id="source"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Company Name, Client Name"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Frequency & Date */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="frequency" className="form-label">
                  Frequency *
                </label>
                <div className="select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <select
                    id="frequency"
                    className="form-select"
                    value={formData.frequency}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    disabled={isLoading}
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paymentDate" className="form-label">
                  Payment Date *
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <input
                    id="paymentDate"
                    type="date"
                    className={`form-input ${errors.paymentDate ? 'error' : ''}`}
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.paymentDate && (
                  <p className="error-message">{errors.paymentDate}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <textarea
                  id="notes"
                  className="form-input"
                  placeholder="Add any additional information..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">
                  This is a recurring income
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3"></circle>
                  </svg>
                  Adding Income...
                </>
              ) : (
                <>
                  Add Income
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </>
              )}
            </button>

            {/* Quick Actions */}
            <div className="quick-actions">
              <p className="quick-actions-title">Quick Actions:</p>
              <div className="quick-buttons">
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => {
                    handleInputChange('category', 'Salary');
                    handleInputChange('frequency', 'monthly');
                  }}
                >
                  Salary Template
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => {
                    handleInputChange('category', 'Freelance');
                    handleInputChange('frequency', 'once');
                  }}
                >
                  Freelance Template
                </button>
              </div>
            </div>
          </form>

          {/* Recent Income Preview */}
          <div className="recent-preview">
            <h3 className="preview-title">Recent Income</h3>
            <div className="preview-placeholder">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
              </div>
              <p className="placeholder-text">
                Your recent income entries will appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ============================================
           GLOBAL STYLES (Matching your auth pages)
           ============================================ */
        .financial-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ============================================
           LEFT PANEL (Matches your gradient design)
           ============================================ */
        .financial-left {
          background: linear-gradient(135deg, #002855 0%, #0052CC 50%, #00875A 100%);
          position: relative;
          overflow: hidden;
          padding: 48px;
          display: flex;
          align-items: center;
        }

        .financial-left::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -25%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 200, 83, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 20s ease-in-out infinite;
        }

        .financial-left::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 102, 204, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 25s ease-in-out infinite reverse;
        }

        .financial-left-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .logo {
          display: inline-block;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #00E676 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 48px;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .marketing-content {
          color: white;
        }

        .marketing-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .marketing-title-gradient {
          background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .marketing-description {
          font-size: 16px;
          line-height: 1.7;
          opacity: 0.9;
          margin-bottom: 32px;
        }

        .stats-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon svg {
          width: 20px;
          height: 20px;
          color: #00E676;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .benefits-list {
          margin-bottom: 32px;
        }

        .benefits-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .benefits-items {
          list-style: none;
          padding-left: 0;
        }

        .benefit-item {
          padding: 8px 0;
          font-size: 14px;
          opacity: 0.9;
          position: relative;
          padding-left: 24px;
        }

        .benefit-item:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #00E676;
          font-weight: bold;
        }

        .quick-tip {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          gap: 12px;
        }

        .tip-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .tip-content {
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.9;
        }

        /* ============================================
           RIGHT PANEL
           ============================================ */
        .financial-right {
          background: #FAFBFC;
          padding: 48px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
        }

        .financial-form-container {
          width: 100%;
          max-width: 520px;
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .back-navigation {
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6B778C;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #0066CC;
        }

        .back-icon {
          width: 16px;
          height: 16px;
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          color: #091E42;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6B778C;
          line-height: 1.5;
        }

        /* ============================================
           ALERTS
           ============================================ */
        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: #FFEBE6;
          color: #DE350B;
          border: 1px solid #FFBDAD;
        }

        .alert-success {
          background: #E3FCEF;
          color: #006644;
          border: 1px solid #ABF5D1;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        /* ============================================
           FORM STYLES
           ============================================ */
        .financial-form {
          margin-bottom: 32px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 8px;
        }

        .form-label span {
          color: #DE350B;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper.with-currency {
          display: flex;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 16px;
          color: #6B778C;
          font-weight: 600;
          z-index: 1;
        }

        .input-wrapper.with-currency .form-input {
          padding-left: 32px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #6B778C;
          pointer-events: none;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: inherit;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          background: white;
          color: #091E42;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input[type="date"] {
          padding-right: 16px;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
        }

        .form-input::placeholder {
          color: #97A0AF;
        }

        .form-input:focus {
          outline: none;
          border-color: #0052CC;
          box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.1);
        }

        .form-input.error {
          border-color: #DE350B;
          background: #FFF4F3;
        }

        .form-input.error:focus {
          border-color: #DE350B;
          box-shadow: 0 0 0 4px rgba(222, 53, 11, 0.1);
        }

        .error-message {
          margin-top: 8px;
          font-size: 13px;
          color: #DE350B;
          font-weight: 500;
        }

        .helper-text {
          margin-top: 6px;
          font-size: 13px;
          color: #6B778C;
          font-weight: 500;
        }

        /* ============================================
           SELECT STYLES
           ============================================ */
        .select-wrapper {
          position: relative;
        }

        .form-select {
          width: 100%;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: inherit;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          background: white;
          color: #091E42;
          appearance: none;
          cursor: pointer;
          transition: all 0.25s;
        }

        .form-select:focus {
          outline: none;
          border-color: #0052CC;
          box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.1);
        }

        .form-select.error {
          border-color: #DE350B;
          background: #FFF4F3;
        }

        /* ============================================
           CHECKBOX STYLES (from your auth pages)
           ============================================ */
        .form-options {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #DFE1E6;
          border-radius: 4px;
          margin-right: 12px;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
          background: #0052CC;
          border-color: #0052CC;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 5px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-text {
          font-size: 14px;
          color: #505F79;
          line-height: 1.5;
        }

        /* ============================================
           BUTTON STYLES
           ============================================ */
        .btn-submit {
          width: 100%;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          color: white;
          background: linear-gradient(135deg, #0066CC 0%, #00C853 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
          margin-top: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        .spinner-circle {
          stroke: currentColor;
          stroke-dasharray: 50;
          stroke-dashoffset: 0;
          animation: spinnerDash 1.5s ease-in-out infinite;
        }

        /* ============================================
           QUICK ACTIONS
           ============================================ */
        .quick-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #DFE1E6;
        }

        .quick-actions-title {
          font-size: 14px;
          font-weight: 600;
          color: #6B778C;
          margin-bottom: 12px;
        }

        .quick-buttons {
          display: flex;
          gap: 12px;
        }

        .quick-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #0066CC;
          background: #E6F2FF;
          border: 2px solid #B3D9FF;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-btn:hover {
          background: #D1E7FF;
          border-color: #0066CC;
        }

        /* ============================================
           RECENT PREVIEW
           ============================================ */
        .recent-preview {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #DFE1E6;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 700;
          color: #091E42;
          margin-bottom: 16px;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: #F4F5F7;
          border-radius: 8px;
          text-align: center;
        }

        .placeholder-icon {
          width: 48px;
          height: 48px;
          background: #E6F2FF;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .placeholder-icon svg {
          width: 24px;
          height: 24px;
          color: #0066CC;
        }

        .placeholder-text {
          font-size: 14px;
          color: #6B778C;
          max-width: 300px;
          line-height: 1.5;
        }

        /* ============================================
           ANIMATIONS
           ============================================ */
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinnerDash {
          0% {
            stroke-dashoffset: 50;
          }
          50% {
            stroke-dashoffset: 12.5;
            transform: rotate(135deg);
          }
          100% {
            stroke-dashoffset: 50;
            transform: rotate(450deg);
          }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .financial-page {
            grid-template-columns: 1fr;
          }

          .financial-left {
            display: none;
          }

          .financial-right {
            padding: 32px 24px;
          }
        }

        @media (max-width: 480px) {
          .financial-right {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 28px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .quick-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default IncomePage;