'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import './income.css';

// Types based on backend API
interface IncomeSource {
  id: string;
  name: string;
  type: string;
  frequency: string;
  amount: number;
  is_recurring: boolean;
  is_taxable: boolean;
  is_active: boolean;
  created_at: string;
}

interface IncomeHistory {
  id: string;
  income_source_id: string;
  amount: number;
  tax_amount: number | null;
  received_date: string;
  is_manual_entry: boolean;
  created_at: string;
}

interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_tax: number;
  net_income: number;
  recurring_income: number;
  one_time_income: number;
}

interface IncomeStats {
  total_annual_income: number;
  average_monthly_income: number;
  predicted_next_month: number;
  total_tax_paid: number;
  net_annual_income: number;
  recurring_income_count: number;
  one_time_income_count: number;
  top_source_name: string;
  top_source_amount: number;
}

export default function IncomePage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  // State management
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [incomeHistory, setIncomeHistory] = useState<IncomeHistory[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showRecordIncomeModal, setShowRecordIncomeModal] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchAllIncomeData();
    }
  }, [user, authLoading, router]);

  const fetchAllIncomeData = async () => {
    setIsLoading(true);
    setError(null);
    
    // Mock data for now - replace with actual API calls
    setTimeout(() => {
      const mockSources: IncomeSource[] = [
        {
          id: '1',
          name: 'Primary Salary',
          type: 'SALARY',
          frequency: 'MONTHLY',
          amount: 25000,
          is_recurring: true,
          is_taxable: true,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Freelance Work',
          type: 'FREELANCE',
          frequency: 'WEEKLY',
          amount: 8000,
          is_recurring: false,
          is_taxable: true,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Investment Dividends',
          type: 'INVESTMENT',
          frequency: 'QUARTERLY',
          amount: 3000,
          is_recurring: true,
          is_taxable: true,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockHistory: IncomeHistory[] = [
        {
          id: '1',
          income_source_id: '1',
          amount: 25000,
          tax_amount: 5000,
          received_date: new Date().toISOString(),
          is_manual_entry: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          income_source_id: '2',
          amount: 8000,
          tax_amount: 1600,
          received_date: new Date(Date.now() - 86400000).toISOString(),
          is_manual_entry: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockSummary: MonthlySummary = {
        year: 2026,
        month: 2,
        total_income: 33000,
        total_tax: 6600,
        net_income: 26400,
        recurring_income: 25000,
        one_time_income: 8000
      };

      const mockStats: IncomeStats = {
        total_annual_income: 396000,
        average_monthly_income: 33000,
        predicted_next_month: 33000,
        total_tax_paid: 79200,
        net_annual_income: 316800,
        recurring_income_count: 2,
        one_time_income_count: 1,
        top_source_name: 'Primary Salary',
        top_source_amount: 25000
      };

      setIncomeSources(mockSources);
      setIncomeHistory(mockHistory);
      setMonthlySummary(mockSummary);
      setIncomeStats(mockStats);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFrequencyLabel = (frequency: string): string => {
    const labels: { [key: string]: string } = {
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'BIWEEKLY': 'Bi-weekly',
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'YEARLY': 'Yearly'
    };
    return labels[frequency] || frequency;
  };

  const getIncomeTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'SALARY': 'Salary',
      'FREELANCE': 'Freelance',
      'INVESTMENT': 'Investment',
      'PASSIVE': 'Passive Income',
      'CUSTOM': 'Custom',
      'OTHER': 'Other'
    };
    return labels[type] || type;
  };

  if (authLoading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading income data...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <nav className="dashboard-navbar">
          <Link href="/dashboard" className="navbar-brand">
            <span className="brand-logo">💰 SpendWise SA</span>
          </Link>
          <div className="navbar-links">
            <Link href="/dashboard" className="nav-link">📊 Dashboard</Link>
            <Link href="/dashboard/income" className="nav-link active">💵 Income</Link>
            <Link href="/dashboard/expenses" className="nav-link">💸 Expenses</Link>
            <Link href="/dashboard/budgets" className="nav-link">📋 Budgets</Link>
            <Link href="/dashboard/reports" className="nav-link">📈 Reports</Link>
          </div>
          <div className="navbar-user">
            <div className="user-avatar">{getInitials(user.full_name || user.email)}</div>
            <span className="user-name">{user.full_name || user.email.split('@')[0]}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </nav>
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchAllIncomeData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-logo">💰 SpendWise SA</span>
        </Link>

        <div className="navbar-links">
          <Link href="/dashboard" className="nav-link">📊 Dashboard</Link>
          <Link href="/dashboard/income" className="nav-link active">💵 Income</Link>
          <Link href="/dashboard/expenses" className="nav-link">💸 Expenses</Link>
          <Link href="/dashboard/budgets" className="nav-link">📋 Budgets</Link>
          <Link href="/dashboard/reports" className="nav-link">📈 Reports</Link>
        </div>

        <div className="navbar-user">
          <div className="user-avatar">
            {getInitials(user.full_name || user.email)}
          </div>
          <span className="user-name">
            {user.full_name || user.email.split('@')[0]}
          </span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Page Header */}
        <section className="welcome-section fade-in">
          <div className="page-header-flex">
            <div>
              <h1 className="welcome-title">Income Management 💵</h1>
              <p className="welcome-subtitle">
                Track your income sources, view predictions, and monitor your earning patterns.
              </p>
            </div>
            <div className="header-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowAddSourceModal(true)}
              >
                + Add Income Source
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowRecordIncomeModal(true)}
              >
                📝 Record Income
              </button>
            </div>
          </div>
        </section>

        {/* Monthly Summary Cards */}
        {monthlySummary && (
          <div className="stats-grid fade-in">
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Total Income</h3>
                <div className="stat-icon">💰</div>
              </div>
              <div className="stat-value" style={{ color: '#00C853' }}>
                {formatCurrency(monthlySummary.total_income)}
              </div>
              <div className="stat-info">
                <span>This month (Feb 2026)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Net Income</h3>
                <div className="stat-icon">💵</div>
              </div>
              <div className="stat-value" style={{ color: '#00C853' }}>
                {formatCurrency(monthlySummary.net_income)}
              </div>
              <div className="stat-info">
                <span>After tax deductions</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Tax Paid</h3>
                <div className="stat-icon">📋</div>
              </div>
              <div className="stat-value" style={{ color: '#FF3D00' }}>
                {formatCurrency(monthlySummary.total_tax)}
              </div>
              <div className="stat-info">
                <span>Total deductions</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Next Month</h3>
                <div className="stat-icon">🔮</div>
              </div>
              <div className="stat-value" style={{ color: '#667eea' }}>
                {incomeStats ? formatCurrency(incomeStats.predicted_next_month) : 'R0.00'}
              </div>
              <div className="stat-info">
                <span>Predicted income</span>
              </div>
            </div>
          </div>
        )}

        {/* Income Sources Section */}
        <section className="income-sources-section fade-in">
          <h2 className="section-title">Income Sources ({incomeSources.length})</h2>
          
          {incomeSources.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Income Sources Yet</h3>
              <p>Add your first income source to start tracking your earnings.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddSourceModal(true)}
              >
                + Add Income Source
              </button>
            </div>
          ) : (
            <div className="income-sources-grid">
              {incomeSources.map((source) => (
                <div key={source.id} className="income-source-card">
                  <div className="source-header">
                    <div>
                      <h3 className="source-name">{source.name}</h3>
                      <span className="source-type">{getIncomeTypeLabel(source.type)}</span>
                    </div>
                    <div className="source-amount" style={{ color: '#00C853' }}>
                      {formatCurrency(source.amount)}
                    </div>
                  </div>
                  
                  <div className="source-details">
                    <div className="detail-item">
                      <span className="detail-label">Frequency:</span>
                      <span className="detail-value">{getFrequencyLabel(source.frequency)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">
                        {source.is_recurring ? '🔄 Recurring' : '📌 One-time'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Taxable:</span>
                      <span className="detail-value">
                        {source.is_taxable ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>

                  <div className="source-actions">
                    <button className="btn-edit">✏️ Edit</button>
                    <button className="btn-delete">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Income History Section */}
        <section className="income-history-section fade-in">
          <h2 className="section-title">Recent Income History ({incomeHistory.length})</h2>
          
          {incomeHistory.length === 0 ? (
            <div className="empty-state-small">
              <p>No income records yet. Record your first income entry above.</p>
            </div>
          ) : (
            <div className="income-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Net</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeHistory.map((entry) => {
                    const source = incomeSources.find(s => s.id === entry.income_source_id);
                    const netAmount = entry.amount - (entry.tax_amount || 0);
                    
                    return (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.received_date)}</td>
                        <td>{source?.name || 'Unknown Source'}</td>
                        <td style={{ color: '#00C853', fontWeight: 600 }}>
                          {formatCurrency(entry.amount)}
                        </td>
                        <td style={{ color: '#FF3D00' }}>
                          {entry.tax_amount ? formatCurrency(entry.tax_amount) : '-'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {formatCurrency(netAmount)}
                        </td>
                        <td>
                          <span className="badge">
                            {entry.is_manual_entry ? '✍️ Manual' : '🤖 Auto'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Annual Statistics Section */}
        {incomeStats && (
          <section className="income-stats-section fade-in">
            <h2 className="section-title">Annual Statistics (2026)</h2>
            
            <div className="stats-overview">
              <div className="stat-box">
                <div className="stat-label">Total Annual Income</div>
                <div className="stat-big-value" style={{ color: '#00C853' }}>
                  {formatCurrency(incomeStats.total_annual_income)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Average Monthly</div>
                <div className="stat-big-value" style={{ color: '#667eea' }}>
                  {formatCurrency(incomeStats.average_monthly_income)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Total Tax Paid</div>
                <div className="stat-big-value" style={{ color: '#FF3D00' }}>
                  {formatCurrency(incomeStats.total_tax_paid)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Net Annual Income</div>
                <div className="stat-big-value" style={{ color: '#00C853' }}>
                  {formatCurrency(incomeStats.net_annual_income)}
                </div>
              </div>
            </div>

            <div className="stats-grid-small">
              <div className="stat-item">
                <span className="stat-item-label">Recurring Sources:</span>
                <span className="stat-item-value">{incomeStats.recurring_income_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item-label">One-time Sources:</span>
                <span className="stat-item-value">{incomeStats.one_time_income_count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item-label">Top Source:</span>
                <span className="stat-item-value">{incomeStats.top_source_name}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item-label">Top Amount:</span>
                <span className="stat-item-value" style={{ color: '#00C853' }}>
                  {formatCurrency(incomeStats.top_source_amount)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="quick-actions fade-in">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link href="/dashboard" className="action-button">
              <div className="action-icon">🏠</div>
              <span className="action-label">Back to Dashboard</span>
            </Link>

            <button 
              onClick={() => setShowAddSourceModal(true)} 
              className="action-button"
            >
              <div className="action-icon">➕</div>
              <span className="action-label">Add Income Source</span>
            </button>

            <button 
              onClick={() => setShowRecordIncomeModal(true)} 
              className="action-button"
            >
              <div className="action-icon">📝</div>
              <span className="action-label">Record Income</span>
            </button>

            <button 
              onClick={fetchAllIncomeData} 
              className="action-button"
            >
              <div className="action-icon">🔄</div>
              <span className="action-label">Refresh Data</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} SpendWise SA. All rights reserved.</p>
        <p>Making financial management simple and effective for South Africans.</p>
      </footer>

      {/* Modals - Placeholders */}
      {showAddSourceModal && (
        <div className="modal-overlay" onClick={() => setShowAddSourceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Income Source</h2>
            <p>Modal component will be built next...</p>
            <button onClick={() => setShowAddSourceModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showRecordIncomeModal && (
        <div className="modal-overlay" onClick={() => setShowRecordIncomeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Record Income</h2>
            <p>Modal component will be built next...</p>
            <button onClick={() => setShowRecordIncomeModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}