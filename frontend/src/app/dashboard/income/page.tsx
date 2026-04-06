'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAndValidateArray, fetchAndValidate, postAndValidate, putAndValidate, deleteRequest } from '@/lib/api';
import {
  IncomeSourceSchema,
  IncomeHistorySchema,
  IncomeStatsSchema,
  MonthlySummarySchema,
  type IncomeSource,
  type IncomeHistory,
  type IncomeStats,
  type MonthlySummary
} from '@/lib/schemas';
import './income.css';

export default function IncomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Data states
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [previewData, setPreviewData] = useState<{
    source: string;
    frequency: string;
    upcoming_entries: Array<{ date: string; amount: number; tax: number | null; net: number }>;
    total_upcoming: number;
    estimated_total: number;
  } | null>(null);

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
    notes: '',
    auto_generate_entries: true,
    generate_if_manual_exists: false,
    generate_on_weekends: true
  });

  const [newIncome, setNewIncome] = useState({
    income_source_id: '',
    amount: '',
    received_date: new Date().toISOString().split('T')[0],
    tax_amount: '',
    notes: '',
    skip_auto_generation: false
  });

  // ── Helpers ──────────────────────────────────────────────

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(amount);

  const formatCompactCurrency = (amount: number): string => {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `R${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1000) return `R${(abs / 1000).toFixed(1)}k`;
    return formatCurrency(amount);
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });

  const getFrequencyLabel = (frequency: string): string =>
    ({ DAILY: 'Daily', WEEKLY: 'Weekly', BIWEEKLY: 'Bi-weekly', MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' }[frequency] || frequency);

  const getIncomeTypeLabel = (type: string): string =>
    ({ SALARY: 'Salary', FREELANCE: 'Freelance', INVESTMENT: 'Investment', PASSIVE: 'Passive Income', CUSTOM: 'Custom', OTHER: 'Other' }[type] || type);

  const resetSourceForm = () => setNewSource({
    name: '', type: 'SALARY', frequency: 'MONTHLY', amount: '',
    is_recurring: true, is_taxable: true, auto_tax_calculation: false,
    tax_rate: '', start_date: new Date().toISOString().split('T')[0],
    notes: '', auto_generate_entries: true, generate_if_manual_exists: false, generate_on_weekends: true
  });

  const resetIncomeForm = () => setNewIncome({
    income_source_id: '', amount: '', received_date: new Date().toISOString().split('T')[0],
    tax_amount: '', notes: '', skip_auto_generation: false
  });

  // ── Data fetching ──────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchAllIncomeData();
  }, [user, authLoading, router]);

  const fetchAllIncomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const sources = await fetchAndValidateArray<IncomeSource>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/?active_only=true`,
        IncomeSourceSchema, { credentials: 'include' }
      );
      setIncomeSources(sources);

      const history = await fetchAndValidateArray<IncomeHistory>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/?limit=50`,
        IncomeHistorySchema, { credentials: 'include' }
      );
      setIncomeHistory(history);

      try {
        const summary = await fetchAndValidate<MonthlySummary>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/summary/${currentYear}/${currentMonth}/`,
          MonthlySummarySchema, { credentials: 'include' }
        );
        setMonthlySummary(summary);
      } catch {
        setMonthlySummary({ year: currentYear, month: currentMonth, total_income: 0, total_tax: 0, net_income: 0, recurring_income: 0, one_time_income: 0 });
      }

      try {
        const stats = await fetchAndValidate<IncomeStats>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats/?year=${currentYear}`,
          IncomeStatsSchema, { credentials: 'include' }
        );
        setIncomeStats(stats);
      } catch { /* no stats */ }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income data');
    } finally {
      setIsLoading(false);
    }
  };

  const previewUpcoming = async (sourceId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/${sourceId}/preview?months=6`,
        { credentials: 'include' }
      );
      if (response.ok) {
        setPreviewData(await response.json());
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
    }
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleAddIncomeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const sourceData = {
        name: newSource.name, type: newSource.type, frequency: newSource.frequency,
        amount: parseFloat(newSource.amount), is_recurring: newSource.is_recurring,
        is_taxable: newSource.is_taxable,
        tax_rate: newSource.tax_rate ? parseFloat(newSource.tax_rate) : null,
        start_date: newSource.start_date, notes: newSource.notes || null,
        auto_generate_entries: newSource.auto_generate_entries,
        generate_if_manual_exists: newSource.generate_if_manual_exists,
        generate_on_weekends: newSource.generate_on_weekends
      };
      const created = await postAndValidate<IncomeSource>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/`, IncomeSourceSchema, sourceData, { credentials: 'include' }
      );
      setIncomeSources([...incomeSources, created]);
      setShowAddSourceModal(false);
      resetSourceForm();
    } catch (err) {
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
      const incomeData = {
        income_source_id: newIncome.income_source_id,
        amount: parseFloat(newIncome.amount),
        received_date: newIncome.received_date,
        tax_amount: newIncome.tax_amount ? parseFloat(newIncome.tax_amount) : null,
        notes: newIncome.notes || null,
        is_manual_entry: true,
        skip_auto_generation: newIncome.skip_auto_generation
      };
      const recorded = await postAndValidate<IncomeHistory>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/`, IncomeHistorySchema, incomeData, { credentials: 'include' }
      );
      setIncomeHistory([recorded, ...incomeHistory]);
      setShowRecordIncomeModal(false);
      resetIncomeForm();
    } catch (err) {
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
        name: newSource.name, type: newSource.type, frequency: newSource.frequency,
        amount: parseFloat(newSource.amount), is_recurring: newSource.is_recurring,
        is_taxable: newSource.is_taxable, start_date: newSource.start_date,
        auto_generate_entries: newSource.auto_generate_entries,
        generate_if_manual_exists: newSource.generate_if_manual_exists,
        generate_on_weekends: newSource.generate_on_weekends
      };
      if (newSource.auto_tax_calculation && newSource.tax_rate) {
        updateData.tax_rate = parseFloat(newSource.tax_rate);
        updateData.auto_tax_calculation = true;
      } else {
        updateData.tax_rate = null;
        updateData.auto_tax_calculation = false;
      }
      if (newSource.notes) updateData.notes = newSource.notes;

      const updated = await putAndValidate<IncomeSource>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/${editingSource.id}/`,
        IncomeSourceSchema, updateData, { credentials: 'include' }
      );
      setIncomeSources(incomeSources.map(s => s.id === updated.id ? updated : s));
      setShowAddSourceModal(false);
      setEditingSource(null);
      resetSourceForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/sources/${sourceToDelete}/`, { credentials: 'include' });
      setIncomeSources(incomeSources.filter(s => s.id !== sourceToDelete));
      setShowDeleteConfirmModal(false);
      setSourceToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (source: IncomeSource) => {
    setEditingSource(source);
    const hasTax = source.tax_rate != null && source.tax_rate > 0;
    setNewSource({
      name: source.name, type: source.type, frequency: source.frequency,
      amount: source.amount.toString(), is_recurring: source.is_recurring,
      is_taxable: source.is_taxable, auto_tax_calculation: hasTax,
      tax_rate: source.tax_rate != null ? source.tax_rate.toString() : '',
      start_date: source.start_date, notes: source.notes || '',
      auto_generate_entries: (source as any).auto_generate_entries !== false,
      generate_if_manual_exists: (source as any).generate_if_manual_exists || false,
      generate_on_weekends: (source as any).generate_on_weekends !== false
    });
    setShowAddSourceModal(true);
  };

  const openAddModal = () => { setEditingSource(null); resetSourceForm(); setShowAddSourceModal(true); };

  // ── Render ──────────────────────────────────────────────

  if (authLoading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading income data…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="income-page">

      {/* ── Top NavBar ── */}
      <header className="top-navbar">
        <nav className="top-navbar-container">
          <div className="top-navbar-left">
            <Link href="/dashboard" className="brand">FinTrackSA</Link>
            <div className="nav-links">
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/dashboard/income" className="nav-link active">Income</Link>
              <Link href="/dashboard/expenses" className="nav-link">Expenses</Link>
              <Link href="/dashboard/budgets" className="nav-link">Budgets</Link>
              <Link href="/dashboard/reports" className="nav-link">Reports</Link>
            </div>
          </div>
          <div className="top-navbar-right">
            <button className="icon-button"><span className="material-symbols-outlined">notifications</span></button>
            <div className="user-avatar">
              <div className="avatar-initials">{getInitials(user.full_name || user.email)}</div>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Side NavBar ── */}
      <aside className="side-navbar">
        <div className="side-navbar-header">
          <h2>Income</h2>
          <p>Track Your Earnings</p>
        </div>
        <nav className="side-nav-links">
          <Link href="/dashboard" className="side-nav-link"><span className="material-symbols-outlined">dashboard</span>Overview</Link>
          <Link href="/dashboard/income" className="side-nav-link active"><span className="material-symbols-outlined">trending_up</span>Income</Link>
          <Link href="/dashboard/expenses" className="side-nav-link"><span className="material-symbols-outlined">trending_down</span>Expenses</Link>
          <Link href="/dashboard/budgets" className="side-nav-link"><span className="material-symbols-outlined">receipt</span>Budgets</Link>
          <Link href="/dashboard/reports" className="side-nav-link"><span className="material-symbols-outlined">analytics</span>Reports</Link>
        </nav>
        <button className="new-transaction-btn" onClick={openAddModal}>
          <span className="material-symbols-outlined">add_circle</span>Add Income Source
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="income-main">
        <div className="income-content">

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Income Management</h1>
              <p className="page-description">Track income sources, view predictions, and monitor earning patterns.</p>
            </div>
            <div className="header-actions">
              <button className="btn-primary" onClick={openAddModal}>
                <span className="material-symbols-outlined">add</span>Add Source
              </button>
              <button className="btn-secondary" onClick={() => setShowRecordIncomeModal(true)}>
                <span className="material-symbols-outlined">edit_calendar</span>Record Income
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchAllIncomeData}>Retry</button>
            </div>
          )}

          {/* Summary Cards */}
          {monthlySummary && (
            <div className="summary-cards-grid">
              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-card-icon income-icon"><span className="material-symbols-outlined">account_balance_wallet</span></span>
                  <span className="summary-card-label">Total Income</span>
                </div>
                <div className="summary-card-value">{formatCompactCurrency(monthlySummary.total_income)}</div>
                <div className="summary-card-footer">
                  {new Date(monthlySummary.year, monthlySummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-card-icon net-icon"><span className="material-symbols-outlined">payments</span></span>
                  <span className="summary-card-label">Net Income</span>
                </div>
                <div className="summary-card-value">{formatCompactCurrency(monthlySummary.net_income)}</div>
                <div className="summary-card-footer">After tax deductions</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-card-icon expense-icon"><span className="material-symbols-outlined">receipt</span></span>
                  <span className="summary-card-label">Tax Paid</span>
                </div>
                <div className="summary-card-value">{formatCompactCurrency(monthlySummary.total_tax)}</div>
                <div className="summary-card-footer">Total deductions</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-card-icon prediction-icon"><span className="material-symbols-outlined">trending_up</span></span>
                  <span className="summary-card-label">Next Month</span>
                </div>
                <div className="summary-card-value">
                  {incomeStats ? formatCompactCurrency(incomeStats.predicted_next_month) : 'R0.00'}
                </div>
                <div className="summary-card-footer">Predicted income</div>
              </div>
            </div>
          )}

          {/* Income Sources */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Income Sources</h2>
              <span className="section-count">{incomeSources.length} sources</span>
            </div>

            {incomeSources.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>No Income Sources Yet</h3>
                <p>Add your first income source to start tracking your earnings.</p>
                <button className="btn-primary" onClick={openAddModal}>+ Add Income Source</button>
              </div>
            ) : (
              <div className="income-sources-grid">
                {incomeSources.map((source) => {
                  const isAutoGenEnabled = (source as any).auto_generate_entries !== false;
                  return (
                    <div key={source.id} className="source-card" data-type={source.type}>
                      <div className="source-card-header">
                        <div>
                          <h3 className="source-name">{source.name}</h3>
                          <span className="source-type">{getIncomeTypeLabel(source.type)}</span>
                        </div>
                        <div className="source-amount">{formatCompactCurrency(source.amount)}</div>
                      </div>

                      <div className="source-details">
                        <div className="detail-item">
                          <span className="detail-label">Frequency</span>
                          <span className="detail-value">{getFrequencyLabel(source.frequency)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{source.is_recurring ? 'Recurring' : 'One-time'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Taxable</span>
                          <span className="detail-value">{source.is_taxable ? 'Yes' : 'No'}</span>
                        </div>
                        {source.tax_rate != null && source.tax_rate > 0 && (
                          <div className="detail-item">
                            <span className="detail-label">Tax Rate</span>
                            <span className="detail-value">{source.tax_rate}%</span>
                          </div>
                        )}
                        <div className="detail-item">
                          <span className="detail-label">Start Date</span>
                          <span className="detail-value">{formatDate(source.start_date)}</span>
                        </div>
                        {source.is_recurring && (
                          <div className="detail-item auto-gen-status">
                            <span className="detail-label">Auto-Gen</span>
                            <span className={`detail-value ${isAutoGenEnabled ? 'enabled' : 'disabled'}`}>
                              {isAutoGenEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="source-actions">
                        <button className="btn-edit" onClick={() => openEditModal(source)}>
                          <span className="material-symbols-outlined">edit</span>Edit
                        </button>
                        {source.is_recurring && (
                          <button
                            className="btn-preview"
                            onClick={() => previewUpcoming(source.id)}
                            title="Preview upcoming auto-generated entries"
                          >
                            <span className="material-symbols-outlined">calendar_view_month</span>
                            Preview schedule
                          </button>
                        )}
                        <button
                          className="btn-delete"
                          onClick={() => { setSourceToDelete(source.id); setShowDeleteConfirmModal(true); }}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income History */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Recent Income History</h2>
              <span className="section-count">{incomeHistory.length} records</span>
            </div>
            {incomeHistory.length === 0 ? (
              <div className="empty-state small">
                <p>No income records yet. Record your first income entry above.</p>
              </div>
            ) : (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Amount</th>
                      <th>Tax</th>
                      <th>Net</th>
                      <th>Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeHistory.map((entry) => {
                      const source = incomeSources.find(s => s.id === entry.income_source_id);
                      const net = entry.amount - (entry.tax_amount || 0);
                      return (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.received_date)}</td>
                          <td>{source?.name || 'Unknown Source'}</td>
                          <td className="amount-positive">{formatCurrency(entry.amount)}</td>
                          <td className="amount-negative">{entry.tax_amount ? formatCurrency(entry.tax_amount) : '—'}</td>
                          <td className="amount-positive">{formatCurrency(net)}</td>
                          <td>
                            <span className="badge">{entry.is_manual_entry ? 'Manual' : 'Auto'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Annual Statistics */}
          {incomeStats && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Annual Statistics</h2>
                <span className="section-count">{new Date().getFullYear()}</span>
              </div>
              <div className="stats-grid-small">
                <div className="stat-item">
                  <span className="stat-label">Total Annual Income</span>
                  <span className="stat-value positive">{formatCompactCurrency(incomeStats.total_annual_income)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Monthly</span>
                  <span className="stat-value">{formatCompactCurrency(incomeStats.average_monthly_income)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Tax Paid</span>
                  <span className="stat-value negative">{formatCompactCurrency(incomeStats.total_tax_paid)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Net Annual</span>
                  <span className="stat-value positive">{formatCompactCurrency(incomeStats.net_annual_income)}</span>
                </div>
              </div>
              <div className="stats-summary">
                <div className="summary-row">
                  <span>Recurring Sources</span>
                  <span className="summary-value">{incomeStats.recurring_income_count}</span>
                </div>
                <div className="summary-row">
                  <span>One-time Sources</span>
                  <span className="summary-value">{incomeStats.one_time_income_count}</span>
                </div>
                <div className="summary-row">
                  <span>Top Source</span>
                  <span className="summary-value highlight">{incomeStats.top_source_name}</span>
                </div>
                <div className="summary-row">
                  <span>Top Amount</span>
                  <span className="summary-value positive">{formatCompactCurrency(incomeStats.top_source_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link href="/dashboard" className="quick-action-card"><div className="quick-action-icon">🏠</div><span>Dashboard</span></Link>
              <button onClick={openAddModal} className="quick-action-card"><div className="quick-action-icon">➕</div><span>Add Source</span></button>
              <button onClick={() => setShowRecordIncomeModal(true)} className="quick-action-card"><div className="quick-action-icon">📝</div><span>Record Income</span></button>
              <button onClick={fetchAllIncomeData} className="quick-action-card"><div className="quick-action-icon">🔄</div><span>Refresh</span></button>
            </div>
          </div>

        </div>
      </main>

      {/* ── Add / Edit Income Source Modal ── */}
      {showAddSourceModal && (
        <div className="modal-overlay" onClick={() => { setShowAddSourceModal(false); setEditingSource(null); resetSourceForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSource ? 'Edit Income Source' : 'Add New Income Source'}</h2>
              <button className="modal-close" onClick={() => { setShowAddSourceModal(false); setEditingSource(null); resetSourceForm(); }}>×</button>
            </div>

            <form onSubmit={editingSource ? handleUpdateIncomeSource : handleAddIncomeSource}>
              <div className="form-group">
                <label>Source Name *</label>
                <input type="text" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} placeholder="e.g., Primary Salary, Freelance Work" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Income Type *</label>
                  <select value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })} required>
                    <option value="SALARY">Salary</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="PASSIVE">Passive Income</option>
                    <option value="CUSTOM">Custom</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frequency *</label>
                  <select value={newSource.frequency} onChange={e => setNewSource({ ...newSource, frequency: e.target.value })} required>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (ZAR) *</label>
                  <input type="number" step="0.01" min="0" value={newSource.amount} onChange={e => setNewSource({ ...newSource, amount: e.target.value })} placeholder="25000.00" required />
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" value={newSource.start_date} onChange={e => setNewSource({ ...newSource, start_date: e.target.value })} required />
                </div>
              </div>

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={newSource.is_recurring} onChange={e => setNewSource({ ...newSource, is_recurring: e.target.checked })} />
                  Recurring Income
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={newSource.is_taxable} onChange={e => setNewSource({ ...newSource, is_taxable: e.target.checked })} />
                  Taxable
                </label>
              </div>

              {newSource.is_taxable && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={newSource.auto_tax_calculation} onChange={e => setNewSource({ ...newSource, auto_tax_calculation: e.target.checked })} />
                    Auto-calculate Tax
                  </label>
                  {newSource.auto_tax_calculation && (
                    <div style={{ marginTop: '0.625rem' }}>
                      <label>Tax Rate (%)</label>
                      <input type="number" step="0.01" min="0" max="100" value={newSource.tax_rate} onChange={e => setNewSource({ ...newSource, tax_rate: e.target.value })} placeholder="25.00" />
                    </div>
                  )}
                </div>
              )}

              {newSource.is_recurring && (
                <div className="auto-generation-section">
                  <h3>Auto-Generation Settings</h3>
                  <div className="checkbox-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={newSource.auto_generate_entries} onChange={e => setNewSource({ ...newSource, auto_generate_entries: e.target.checked })} />
                      Automatically generate income entries
                    </label>
                  </div>
                  {newSource.auto_generate_entries && (
                    <>
                      <div className="checkbox-row" style={{ marginTop: '0.5rem' }}>
                        <label className="checkbox-label">
                          <input type="checkbox" checked={newSource.generate_if_manual_exists} onChange={e => setNewSource({ ...newSource, generate_if_manual_exists: e.target.checked })} />
                          Generate even if manual entry exists
                        </label>
                        <p className="field-hint">If unchecked, auto-generation skips periods where you've already recorded income manually.</p>
                      </div>
                      <div className="checkbox-row" style={{ marginTop: '0.5rem' }}>
                        <label className="checkbox-label">
                          <input type="checkbox" checked={newSource.generate_on_weekends} onChange={e => setNewSource({ ...newSource, generate_on_weekends: e.target.checked })} />
                          Generate on weekends
                        </label>
                        <p className="field-hint">If unchecked, weekend payments shift to the following Monday.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea value={newSource.notes} onChange={e => setNewSource({ ...newSource, notes: e.target.value })} placeholder="Any additional details about this income source" rows={3} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowAddSourceModal(false); setEditingSource(null); resetSourceForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : editingSource ? 'Update Source' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Income Modal ── */}
      {showRecordIncomeModal && (
        <div className="modal-overlay" onClick={() => { setShowRecordIncomeModal(false); resetIncomeForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Income Received</h2>
              <button className="modal-close" onClick={() => { setShowRecordIncomeModal(false); resetIncomeForm(); }}>×</button>
            </div>

            <form onSubmit={handleRecordIncome}>
              <div className="form-group">
                <label>Income Source *</label>
                <select value={newIncome.income_source_id} onChange={e => setNewIncome({ ...newIncome, income_source_id: e.target.value })} required>
                  <option value="">Select a source</option>
                  {incomeSources.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.amount)}/{getFrequencyLabel(s.frequency).toLowerCase()})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Received Date *</label>
                  <input type="date" value={newIncome.received_date} onChange={e => setNewIncome({ ...newIncome, received_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Amount Received (ZAR) *</label>
                  <input type="number" step="0.01" min="0" value={newIncome.amount} onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })} placeholder="25000.00" required />
                </div>
              </div>

              <div className="form-group">
                <label>Tax Amount (ZAR) — Optional</label>
                <input type="number" step="0.01" min="0" value={newIncome.tax_amount} onChange={e => setNewIncome({ ...newIncome, tax_amount: e.target.value })} placeholder="5000.00" />
              </div>

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={newIncome.skip_auto_generation} onChange={e => setNewIncome({ ...newIncome, skip_auto_generation: e.target.checked })} />
                  Skip auto-generation for this period
                </label>
                <p className="field-hint">If checked, the recurring job won't generate an entry for this date.</p>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea value={newIncome.notes} onChange={e => setNewIncome({ ...newIncome, notes: e.target.value })} placeholder="Any additional details about this income" rows={3} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowRecordIncomeModal(false); resetIncomeForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording…' : 'Record Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Income Source</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirmModal(false)}>×</button>
            </div>
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this income source?</p>
              <p className="warning-text">This action cannot be undone and will affect historical data.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirmModal(false)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteSource} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting…' : 'Delete Source'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Upcoming Modal ── */}
      {showPreviewModal && previewData && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>Upcoming Schedule</h2>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>×</button>
            </div>

            {/* Preview summary */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Source', value: previewData.source },
                  { label: 'Frequency', value: getFrequencyLabel(previewData.frequency) },
                  { label: 'Upcoming entries', value: `${previewData.total_upcoming} payments` },
                  { label: 'Estimated total', value: formatCurrency(previewData.estimated_total) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface-container-low)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', border: '1px solid var(--outline-variant)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--on-surface-variant)', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0 1.5rem 0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
                    {['Date', 'Amount', 'Tax', 'Net'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Date' ? 'left' : 'right', padding: '0.5rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--on-surface-variant)', borderBottom: '1px solid var(--outline-variant)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.upcoming_entries.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface-container-low)' }}>
                      <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.8125rem', color: 'var(--on-surface)' }}>{formatDate(entry.date)}</td>
                      <td style={{ textAlign: 'right', padding: '0.625rem 0.5rem', fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'Manrope, sans-serif' }}>{formatCurrency(entry.amount)}</td>
                      <td style={{ textAlign: 'right', padding: '0.625rem 0.5rem', fontSize: '0.8125rem', color: 'var(--error)', fontVariantNumeric: 'tabular-nums' }}>{entry.tax ? formatCurrency(entry.tax) : '—'}</td>
                      <td style={{ textAlign: 'right', padding: '0.625rem 0.5rem', fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{formatCurrency(entry.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPreviewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}