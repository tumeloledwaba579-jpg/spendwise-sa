'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './budgets.css';

// Types
interface Category {
  id: string;
  name: string;
  category_type: string;
  color?: string;
  icon?: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  category?: Category;
  spent: number;
  remaining: number;
  percentage: number;
  period: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

interface BudgetFormData {
  name: string;
  amount: string;
  category_id: string;
  period: string;
  start_date: string;
  end_date: string;
  notifications_enabled: boolean;
  notification_threshold: string;
}

export default function BudgetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Data states
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    amount: '',
    category_id: '',
    period: 'MONTHLY',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    notifications_enabled: true,
    notification_threshold: '80'
  });

  // Summary stats
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [budgetsOnTrack, setBudgetsOnTrack] = useState(0);
  const [budgetsOver, setBudgetsOver] = useState(0);

  // Refs
  const initialLoadDone = useRef(false);
  const dataLoadedRef = useRef(false);

  // Helper functions
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1_000_000) return `R${(absAmount / 1_000_000).toFixed(1)}M`;
    if (absAmount >= 1000) return `R${(absAmount / 1000).toFixed(1)}k`;
    return formatCurrency(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPeriodLabel = (period: string): string => {
    const labels: Record<string, string> = {
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'YEARLY': 'Yearly',
      'WEEKLY': 'Weekly'
    };
    return labels[period] || period;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return '#FF3D00';
    if (percentage >= 80) return '#FFA000';
    return '#00C853';
  };

  const getPercentageClass = (percentage: number): string => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const getStatusText = (percentage: number): string => {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category_id: '',
      period: 'MONTHLY',
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      notifications_enabled: true,
      notification_threshold: '80'
    });
  };

  // ============================================================
  // AUTHENTICATION
  // ============================================================
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // ============================================================
  // INITIAL DATA LOAD (Categories only)
  // ============================================================
  useEffect(() => {
    if (user && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadCategories();
    }
  }, [user]);

  // ============================================================
  // LOAD BUDGETS AND EXPENSES AFTER CATEGORIES ARE READY
  // ============================================================
  useEffect(() => {
    if (user && categories.length > 0 && !isInitializing) {
      console.log('📊 Categories loaded, fetching budgets and expenses...');
      loadBudgetsAndExpenses();
    }
  }, [user, categories, isInitializing]);

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================
  const loadCategories = async () => {
    console.log('🔄 Loading categories...');
    setIsInitializing(true);
    setError(null);

    try {
      const fetchOptions = {
        credentials: 'include' as RequestCredentials,
        headers: { 'Content-Type': 'application/json' }
      };

      const categoriesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/categories/`,
        fetchOptions
      );

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
        console.log('✅ Categories loaded:', data.length);
      } else {
        console.warn('⚠️ Failed to load categories:', categoriesRes.status);
      }

    } catch (err) {
      console.error('❌ Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      console.log('🏁 Setting isInitializing to false');
      setIsInitializing(false);
    }
  };

  // ============================================================
  // LOAD BUDGETS AND EXPENSES TOGETHER
  // ============================================================
  const loadBudgetsAndExpenses = async () => {
    console.log('🔄 Loading budgets and expenses...');
    setIsLoading(true);
    setError(null);
    dataLoadedRef.current = true;

    try {
      const fetchOptions = {
        credentials: 'include' as RequestCredentials,
        headers: { 'Content-Type': 'application/json' }
      };

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startDate = new Date(currentYear, currentMonth, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString();

      // Fetch budgets and expenses in parallel
      const [budgetsRes, expensesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/`, fetchOptions),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?start_date=${startDate}&end_date=${endDate}&transaction_type=expense&limit=500`,
          fetchOptions
        )
      ]);

      // Process budgets
      if (!budgetsRes.ok) {
        throw new Error(`Failed to fetch budgets: ${budgetsRes.status}`);
      }
      const budgetsData = await budgetsRes.json();
      console.log('✅ Budgets loaded:', budgetsData.length);

      // Process expenses
      let expensesData: any[] = [];
      if (expensesRes.ok) {
        expensesData = await expensesRes.json();
        console.log('✅ Expenses loaded for budget calculation:', expensesData.length);
        setExpenses(expensesData);
      }

      // Calculate spent amounts per category from expenses
      const categorySpent: Record<string, number> = {};
      expensesData.forEach((expense: any) => {
        if (expense.category_id) {
          const amount = Math.abs(expense.amount);
          categorySpent[expense.category_id] = (categorySpent[expense.category_id] || 0) + amount;
        }
      });

      console.log('💰 Spending by category:', categorySpent);

      // Enrich budgets with spent amounts and percentages
      const enrichedBudgets: Budget[] = budgetsData.map((budget: any) => {
        const spent = categorySpent[budget.category_id] || 0;
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          id: budget.id,
          name: budget.name,
          amount: budget.amount,
          category_id: budget.category_id,
          category: categories.find(c => c.id === budget.category_id),
          spent: spent,
          remaining: remaining,
          percentage: Number(percentage.toFixed(1)),
          period: budget.period,
          start_date: budget.start_date,
          end_date: budget.end_date,
          is_active: budget.is_active
        };
      });

      setBudgets(enrichedBudgets);

      // Calculate summary stats
      const totalBudgetAmount = enrichedBudgets.reduce((sum: number, b: Budget) => sum + b.amount, 0);
      const totalSpentAmount = enrichedBudgets.reduce((sum: number, b: Budget) => sum + b.spent, 0);
      const totalRemainingAmount = enrichedBudgets.reduce((sum: number, b: Budget) => sum + b.remaining, 0);
      const onTrack = enrichedBudgets.filter((b: Budget) => b.percentage <= 90).length;
      const over = enrichedBudgets.filter((b: Budget) => b.percentage > 100).length;

      setTotalBudget(totalBudgetAmount);
      setTotalSpent(totalSpentAmount);
      setTotalRemaining(totalRemainingAmount);
      setBudgetsOnTrack(onTrack);
      setBudgetsOver(over);

      console.log('📊 Budget stats:', {
        totalBudgetAmount,
        totalSpentAmount,
        totalRemainingAmount,
        onTrack,
        over
      });

    } catch (err) {
      console.error('🔴 Error loading budgets/expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // REFRESH DATA
  // ============================================================
  const refreshData = () => {
    console.log('🔄 Refreshing data...');
    loadBudgetsAndExpenses();
  };

  // ============================================================
  // BUDGET CRUD OPERATIONS
  // ============================================================
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const budgetData = {
        category_id: formData.category_id,
        name: formData.name,
        amount: parseFloat(formData.amount),
        currency: 'ZAR',
        period: formData.period,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        notifications_enabled: formData.notifications_enabled,
        notification_threshold: parseFloat(formData.notification_threshold)
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budgetData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add budget');
      }

      await loadBudgetsAndExpenses();
      setShowAddModal(false);
      resetForm();

    } catch (err) {
      console.error('❌ Error adding budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to add budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        notifications_enabled: formData.notifications_enabled,
        notification_threshold: parseFloat(formData.notification_threshold)
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/${selectedBudget.id}/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update budget');
      }

      await loadBudgetsAndExpenses();
      setShowEditModal(false);
      setSelectedBudget(null);
      resetForm();

    } catch (err) {
      console.error('❌ Error updating budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/${selectedBudget.id}/`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete budget');
      }

      await loadBudgetsAndExpenses();
      setShowDeleteModal(false);
      setSelectedBudget(null);

    } catch (err) {
      console.error('❌ Error deleting budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      category_id: budget.category_id,
      period: budget.period,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date ? budget.end_date.split('T')[0] : '',
      notifications_enabled: true,
      notification_threshold: '80'
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDeleteModal(true);
  };

  const userName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  // Loading states
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Authenticating...</p>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading budget data...</p>
      </div>
    );
  }

  if (isLoading && budgets.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your budgets...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="budgets-page">
      {/* TopNavBar */}
      <header className="top-navbar">
        <nav className="top-navbar-container">
          <div className="top-navbar-left">
            <Link href="/dashboard" className="brand">
              FinTrackSA
            </Link>
            <div className="nav-links">
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/dashboard/income" className="nav-link">Income</Link>
              <Link href="/dashboard/expenses" className="nav-link">Expenses</Link>
              <Link href="/dashboard/budgets" className="nav-link active">Budgets</Link>
              <Link href="/dashboard/reports" className="nav-link">Reports</Link>
            </div>
          </div>
          <div className="top-navbar-right">
            <button className="icon-button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="icon-button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="user-avatar">
              <div className="avatar-initials">
                {getInitials(user.full_name || user.email)}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* SideNavBar */}
      <aside className="side-navbar">
        <div className="side-navbar-header">
          <h2>Budget Manager</h2>
          <p>Control Your Spending</p>
        </div>
        <nav className="side-nav-links">
          <Link href="/dashboard" className="side-nav-link">
            <span className="material-symbols-outlined">dashboard</span>
            Overview
          </Link>
          <Link href="/dashboard/income" className="side-nav-link">
            <span className="material-symbols-outlined">trending_up</span>
            Income
          </Link>
          <Link href="/dashboard/expenses" className="side-nav-link">
            <span className="material-symbols-outlined">trending_down</span>
            Expenses
          </Link>
          <Link href="/dashboard/budgets" className="side-nav-link active">
            <span className="material-symbols-outlined">receipt</span>
            Budgets
          </Link>
          <Link href="/dashboard/reports" className="side-nav-link">
            <span className="material-symbols-outlined">analytics</span>
            Reports
          </Link>
        </nav>
        <button
          className="new-transaction-btn"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <span className="material-symbols-outlined">add_circle</span>
          Create Budget
        </button>
      </aside>

      {/* Main Content */}
      <main className="budgets-main">
        <div className="budgets-content">
          {/* Header Section */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Budget Manager</h1>
              <p className="page-description">Set spending limits and track your progress.</p>
            </div>
            <div className="header-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <span className="material-symbols-outlined">add</span>
                Create Budget
              </button>
              <button
                onClick={refreshData}
                className="btn-secondary"
                style={{ marginLeft: '0.5rem' }}
              >
                <span className="material-symbols-outlined">refresh</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={refreshData}>Retry</button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="summary-cards-grid">
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon budget-icon">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </span>
                <span className="summary-card-label">Total Budget</span>
              </div>
              <div className="summary-card-value">{formatCurrency(totalBudget)}</div>
              <div className="summary-card-footer">Monthly spending limit</div>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon spent-icon">
                  <span className="material-symbols-outlined">receipt</span>
                </span>
                <span className="summary-card-label">Total Spent</span>
              </div>
              <div className="summary-card-value">{formatCurrency(totalSpent)}</div>
              <div className="summary-card-footer">Against budgets</div>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon remaining-icon">
                  <span className="material-symbols-outlined">savings</span>
                </span>
                <span className="summary-card-label">Remaining</span>
              </div>
              <div className="summary-card-value">{formatCurrency(totalRemaining)}</div>
              <div className="summary-card-footer">Left to spend</div>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon status-icon">
                  <span className="material-symbols-outlined">trending_up</span>
                </span>
                <span className="summary-card-label">Budget Health</span>
              </div>
              <div className="summary-card-value">
                {budgetsOnTrack} on track, {budgetsOver} over
              </div>
              <div className="summary-card-footer">Active budgets</div>
            </div>
          </div>

          {/* Budgets Grid */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Active Budgets</h2>
              <span className="section-count">{budgets.length} budgets</span>
            </div>

            {budgets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Budgets Yet</h3>
                <p>Create your first budget to start tracking your spending limits.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  + Create Budget
                </button>
              </div>
            ) : (
              <div className="budgets-grid">
                {budgets.map((budget) => {
                  const percentage = typeof budget.percentage === 'number' ? budget.percentage : 0;
                  const spent = budget.spent || 0;
                  const amount = budget.amount || 0;

                  return (
                    <div key={budget.id} className="budget-card">
                      <div className="budget-card-header">
                        <div>
                          <h3 className="budget-name">{budget.name}</h3>
                          <span className="budget-category">
                            {budget.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                        <div className="budget-amounts">
                          <span className="budget-spent">{formatCompactCurrency(spent)}</span>
                          <span className="budget-separator">/</span>
                          <span className="budget-limit">{formatCompactCurrency(amount)}</span>
                        </div>
                      </div>

                      <div className="budget-progress">
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: getProgressColor(percentage)
                            }}
                          />
                        </div>
                        <div className="progress-stats">
                          <span className={`progress-percentage ${getPercentageClass(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </span>
                          <span className={`progress-status ${getStatusText(percentage).toLowerCase().replace(' ', '-')}`}>
                            {getStatusText(percentage)}
                          </span>
                        </div>
                      </div>

                      <div className="budget-footer">
                        <div className="budget-period">
                          <span className="material-symbols-outlined">calendar_today</span>
                          <span>{getPeriodLabel(budget.period)}</span>
                        </div>
                        <div className="budget-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditClick(budget)}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(budget)}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Budget</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddBudget}>
              <div className="form-group">
                <label>Budget Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Groceries"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.filter(c => c.category_type === 'EXPENSE').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget Amount (ZAR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="5000.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Period *</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.notifications_enabled}
                    onChange={(e) => setFormData({ ...formData, notifications_enabled: e.target.checked })}
                  />
                  Enable Notifications
                </label>

                {formData.notifications_enabled && (
                  <div className="form-group">
                    <label>Alert Threshold (%)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="100"
                      value={formData.notification_threshold}
                      onChange={(e) => setFormData({ ...formData, notification_threshold: e.target.value })}
                      placeholder="80"
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && selectedBudget && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Budget</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateBudget}>
              <div className="form-group">
                <label>Budget Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Budget Amount (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Period *</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.notifications_enabled}
                    onChange={(e) => setFormData({ ...formData, notifications_enabled: e.target.checked })}
                  />
                  Enable Notifications
                </label>

                {formData.notifications_enabled && (
                  <div className="form-group">
                    <label>Alert Threshold (%)</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="100"
                      value={formData.notification_threshold}
                      onChange={(e) => setFormData({ ...formData, notification_threshold: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBudget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this budget?</p>
              <p className="warning-text">This action cannot be undone.</p>
              {selectedBudget && (
                <div className="delete-preview">
                  <p><strong>{selectedBudget.name}</strong></p>
                  <p>{formatCurrency(selectedBudget.amount)}</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteBudget}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}