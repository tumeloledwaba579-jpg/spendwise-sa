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
  tax_rate?: number | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showRecordIncomeModal, setShowRecordIncomeModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  // Form states
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'SALARY',
    frequency: 'MONTHLY',
    amount: '',
    is_recurring: true,
    is_taxable: true,
    auto_tax_calculation: false,
    tax_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newIncome, setNewIncome] = useState({
    income_source_id: '',
    amount: '',
    received_date: new Date().toISOString().split('T')[0],
    tax_amount: '',
    notes: ''
  });

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get frequency label
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

  // Helper function to reset source form
  const resetSourceForm = () => {
    setNewSource({
      name: '',
      type: 'SALARY',
      frequency: 'MONTHLY',
      amount: '',
      is_recurring: true,
      is_taxable: true,
      auto_tax_calculation: false,
      tax_rate: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

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
  console.log('API URL from env:', process.env.NEXT_PUBLIC_API_URL);
  console.log('Full URL being called:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources?active_only=true`);
  setIsLoading(true);
  setError(null);

  try {
    // ✅ FIXED: Properly typed fetch options with trailing slashes
    const fetchOptions = {
      credentials: 'include' as RequestCredentials,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`📅 Fetching data for: ${currentYear}-${currentMonth}`);

    // Fetch all data in parallel with cookies - USING TRAILING SLASHES
    const [sourcesRes, historyRes, summaryRes, statsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/?active_only=true`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/?limit=50`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/summary/${currentYear}/${currentMonth}/`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats/?year=${currentYear}`, fetchOptions)
    ]);

    // Log response statuses for debugging
    console.log('📊 Response statuses:', {
      sources: sourcesRes.status,
      history: historyRes.status,
      summary: summaryRes.status,
      stats: statsRes.status
    });

    // Check sources response (required)
    if (!sourcesRes.ok) {
      if (sourcesRes.status === 401) {
        console.log('🔒 Session expired, redirecting to login');
        router.push('/login');
        return;
      }
      throw new Error(`Failed to fetch sources: ${sourcesRes.status} ${sourcesRes.statusText}`);
    }

    // Parse sources JSON
    const sources = await sourcesRes.json();
    console.log('✅ Sources loaded:', sources.length);
    setIncomeSources(sources);

    // Handle history (optional)
    if (historyRes.ok) {
      const history = await historyRes.json();
      console.log('✅ History loaded:', history.length);
      setIncomeHistory(history);
    } else {
      console.log('ℹ️ No history data available');
      setIncomeHistory([]);
    }

    // Handle summary (optional)
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      console.log('✅ Summary loaded:', summary);
      setMonthlySummary(summary);
    } else {
      console.log('ℹ️ No summary data available for this month');
      setMonthlySummary({
        year: currentYear,
        month: currentMonth,
        total_income: 0,
        total_tax: 0,
        net_income: 0,
        recurring_income: 0,
        one_time_income: 0
      });
    }

    // Handle stats (optional)
    if (statsRes.ok) {
      const stats = await statsRes.json();
      console.log('✅ Stats loaded:', stats);
      setIncomeStats(stats);
    } else {
      console.log('ℹ️ No stats data available');
    }

  } catch (err) {
    console.error('🔴 Error fetching data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load data');
    
    // Set empty defaults on error
    setIncomeSources([]);
    setIncomeHistory([]);
    setMonthlySummary({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      total_income: 0,
      total_tax: 0,
      net_income: 0,
      recurring_income: 0,
      one_time_income: 0
    });
    
  } finally {
    setIsLoading(false);
  }
};

const handleAddIncomeSource = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newSource.name,
        type: newSource.type,
        frequency: newSource.frequency,
        amount: parseFloat(newSource.amount),
        is_recurring: newSource.is_recurring,
        is_taxable: newSource.is_taxable,
        tax_rate: newSource.tax_rate ? parseFloat(newSource.tax_rate) : null,
        start_date: newSource.start_date,
        notes: newSource.notes || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add income source');
    }

    const addedSource = await response.json();
    setIncomeSources([...incomeSources, addedSource]);
    setShowAddSourceModal(false);
    setEditingSource(null);
    resetSourceForm();

    // Refresh data to get updated summary
    await fetchAllIncomeData();

  } catch (err) {
    console.error('Error adding source:', err);
    setError(err instanceof Error ? err.message : 'Failed to add source');
  } finally {
    setIsSubmitting(false);
  }
};

const handleRecordIncome = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        income_source_id: newIncome.income_source_id,
        amount: parseFloat(newIncome.amount),
        received_date: newIncome.received_date,
        tax_amount: newIncome.tax_amount ? parseFloat(newIncome.tax_amount) : null,
        notes: newIncome.notes || null,
        is_manual_entry: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to record income');
    }

    const recordedIncome = await response.json();
    setIncomeHistory([recordedIncome, ...incomeHistory]);
    setShowRecordIncomeModal(false);
    
    // Refresh all data to update summary and stats
    await fetchAllIncomeData();
    
    setNewIncome({
      income_source_id: '',
      amount: '',
      received_date: new Date().toISOString().split('T')[0],
      tax_amount: '',
      notes: ''
    });

  } catch (err) {
    console.error('Error recording income:', err);
    setError(err instanceof Error ? err.message : 'Failed to record income');
  } finally {
    setIsSubmitting(false);
  }
};


const handleUpdateIncomeSource = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingSource) return;
  
  setIsSubmitting(true);
  setError(null);

  try {
    const updateData: any = {
      name: newSource.name,
      type: newSource.type,
      frequency: newSource.frequency,
      amount: parseFloat(newSource.amount),
      is_recurring: newSource.is_recurring,
      is_taxable: newSource.is_taxable,
    };

    if (newSource.auto_tax_calculation && newSource.tax_rate) {
      updateData.tax_rate = parseFloat(newSource.tax_rate);
      updateData.auto_tax_calculation = true;
    } else {
      updateData.tax_rate = null;
      updateData.auto_tax_calculation = false;
    }

    if (newSource.notes) {
      updateData.notes = newSource.notes;
    }

    console.log('🔵 Sending update data:', updateData);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/${editingSource.id}/`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔴 Update error response:', errorData);
      throw new Error(errorData.detail || 'Failed to update income source');
    }

    const updatedSource = await response.json();
    console.log('🟢 Update successful:', updatedSource);
    
    setIncomeSources(incomeSources.map(s => 
      s.id === updatedSource.id ? updatedSource : s
    ));
    
    setShowAddSourceModal(false);
    setEditingSource(null);
    resetSourceForm();

    // Refresh data to get updated summary
    await fetchAllIncomeData();

  } catch (err) {
    console.error('🔴 Error updating source:', err);
    setError(err instanceof Error ? err.message : 'Failed to update source');
  } finally {
    setIsSubmitting(false);
  }
};

const handleDeleteSource = async () => {
  if (!sourceToDelete) return;
  
  setIsSubmitting(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/${sourceToDelete}/`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete source');
    }

    setIncomeSources(incomeSources.filter(s => s.id !== sourceToDelete));
    setShowDeleteConfirmModal(false);
    setSourceToDelete(null);

    // Refresh data to get updated summary
    await fetchAllIncomeData();

  } catch (err) {
    console.error('Error deleting source:', err);
    setError(err instanceof Error ? err.message : 'Failed to delete source');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleLogout = () => {
    logout();
    router.push('/login');
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
                onClick={() => {
                  setEditingSource(null);
                  resetSourceForm();
                  setShowAddSourceModal(true);
                }}
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
                <span>{new Date(monthlySummary.year, monthlySummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
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
                onClick={() => {
                  setEditingSource(null);
                  resetSourceForm();
                  setShowAddSourceModal(true);
                }}
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
                    {source.tax_rate && source.tax_rate > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Tax Rate:</span>
                        <span className="detail-value">{source.tax_rate}%</span>
                      </div>
                    )}
                  </div>

                  <div className="source-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        console.log('📝 Editing source:', source);
                        
                        setEditingSource(source);
                        
                        // Check if tax_rate exists to determine auto_tax_calculation
                        const hasTaxRate = source.tax_rate !== null && 
                                         source.tax_rate !== undefined && 
                                         source.tax_rate > 0;
                        
                        const newSourceData = {
                          name: source.name,
                          type: source.type,
                          frequency: source.frequency,
                          amount: source.amount.toString(),
                          is_recurring: source.is_recurring,
                          is_taxable: source.is_taxable,
                          auto_tax_calculation: hasTaxRate,
                          tax_rate: source.tax_rate ? source.tax_rate.toString() : '',
                          start_date: new Date().toISOString().split('T')[0],
                          notes: ''
                        };
                        
                        console.log('📝 Setting form data:', newSourceData);
                        setNewSource(newSourceData);
                        setShowAddSourceModal(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button 
                      className="btn-delete"
                      onClick={() => {
                        setSourceToDelete(source.id);
                        setShowDeleteConfirmModal(true);
                      }}
                    >
                      🗑️ Delete
                    </button>
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
            <h2 className="section-title">Annual Statistics ({new Date().getFullYear()})</h2>
            
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
              onClick={() => {
                setEditingSource(null);
                resetSourceForm();
                setShowAddSourceModal(true);
              }} 
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

      {/* Add Income Source Modal */}
      {showAddSourceModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddSourceModal(false);
          setEditingSource(null);
          resetSourceForm();
        }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSource ? 'Edit Income Source' : 'Add New Income Source'}</h2>
              <button className="modal-close" onClick={() => {
                setShowAddSourceModal(false);
                setEditingSource(null);
                resetSourceForm();
              }}>×</button>
            </div>
            
            <form onSubmit={editingSource ? handleUpdateIncomeSource : handleAddIncomeSource}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="sourceName">Source Name *</label>
                  <input
                    id="sourceName"
                    type="text"
                    value={newSource.name}
                    onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                    placeholder="e.g., Primary Salary, Freelance Work"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sourceType">Income Type *</label>
                  <select
                    id="sourceType"
                    value={newSource.type}
                    onChange={(e) => setNewSource({...newSource, type: e.target.value})}
                    required
                  >
                    <option value="SALARY">Salary</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="PASSIVE">Passive Income</option>
                    <option value="CUSTOM">Custom</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="frequency">Frequency *</label>
                  <select
                    id="frequency"
                    value={newSource.frequency}
                    onChange={(e) => setNewSource({...newSource, frequency: e.target.value})}
                    required
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount (ZAR) *</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newSource.amount}
                    onChange={(e) => setNewSource({...newSource, amount: e.target.value})}
                    placeholder="25000.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    id="startDate"
                    type="date"
                    value={newSource.start_date}
                    onChange={(e) => setNewSource({...newSource, start_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newSource.is_recurring}
                      onChange={(e) => setNewSource({...newSource, is_recurring: e.target.checked})}
                    />
                    Recurring Income
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newSource.is_taxable}
                      onChange={(e) => setNewSource({...newSource, is_taxable: e.target.checked})}
                    />
                    Taxable
                  </label>
                </div>

                {newSource.is_taxable && (
                  <>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newSource.auto_tax_calculation}
                          onChange={(e) => setNewSource({...newSource, auto_tax_calculation: e.target.checked})}
                        />
                        Auto-calculate Tax
                      </label>
                    </div>

                    {newSource.auto_tax_calculation && (
                      <div className="form-group">
                        <label htmlFor="taxRate">Tax Rate (%)</label>
                        <input
                          id="taxRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={newSource.tax_rate}
                          onChange={(e) => setNewSource({...newSource, tax_rate: e.target.value})}
                          placeholder="25.00"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="form-group full-width">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={newSource.notes}
                    onChange={(e) => setNewSource({...newSource, notes: e.target.value})}
                    placeholder="Any additional details about this income source"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddSourceModal(false);
                    setEditingSource(null);
                    resetSourceForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingSource ? 'Update Source' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Income Modal */}
      {showRecordIncomeModal && (
        <div className="modal-overlay" onClick={() => {
          setShowRecordIncomeModal(false);
          setNewIncome({
            income_source_id: '',
            amount: '',
            received_date: new Date().toISOString().split('T')[0],
            tax_amount: '',
            notes: ''
          });
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Income Received</h2>
              <button className="modal-close" onClick={() => {
                setShowRecordIncomeModal(false);
                setNewIncome({
                  income_source_id: '',
                  amount: '',
                  received_date: new Date().toISOString().split('T')[0],
                  tax_amount: '',
                  notes: ''
                });
              }}>×</button>
            </div>
            
            <form onSubmit={handleRecordIncome}>
              <div className="form-group">
                <label htmlFor="incomeSource">Income Source *</label>
                <select
                  id="incomeSource"
                  value={newIncome.income_source_id}
                  onChange={(e) => setNewIncome({...newIncome, income_source_id: e.target.value})}
                  required
                >
                  <option value="">Select a source</option>
                  {incomeSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({formatCurrency(source.amount)}/{getFrequencyLabel(source.frequency).toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="receivedDate">Received Date *</label>
                <input
                  id="receivedDate"
                  type="date"
                  value={newIncome.received_date}
                  onChange={(e) => setNewIncome({...newIncome, received_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="incomeAmount">Amount Received (ZAR) *</label>
                <input
                  id="incomeAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                  placeholder="25000.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxAmount">Tax Amount (ZAR) (Optional)</label>
                <input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newIncome.tax_amount}
                  onChange={(e) => setNewIncome({...newIncome, tax_amount: e.target.value})}
                  placeholder="5000.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="incomeNotes">Notes (Optional)</label>
                <textarea
                  id="incomeNotes"
                  value={newIncome.notes}
                  onChange={(e) => setNewIncome({...newIncome, notes: e.target.value})}
                  placeholder="Any additional details about this income"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowRecordIncomeModal(false);
                    setNewIncome({
                      income_source_id: '',
                      amount: '',
                      received_date: new Date().toISOString().split('T')[0],
                      tax_amount: '',
                      notes: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Record Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirmModal(false)}>×</button>
            </div>
            
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this income source?</p>
              <p className="warning-text">This action cannot be undone and will affect historical data.</p>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleDeleteSource}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}