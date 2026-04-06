'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAndValidateArray, postAndValidate, putAndValidate, deleteRequest } from '@/lib/api';
import {
  CategorySchema,
  AccountSchema,
  TransactionSchema,
  type Category,
  type Account,
  type Transaction,
} from '@/lib/schemas';
import './expenses.css';

export default function ExpensesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Data states
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false,
  });

  // Summary stats
  const [totalSpent, setTotalSpent] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  const initialLoadDone = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    new Date(dateString).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      account_id: accounts.length > 0 ? accounts[0].id : '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
      is_recurring: false,
    });
  };

  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return '#999';
    return categories.find(c => c.id === categoryId)?.color || '#667eea';
  };

  // ── Core fetch ────────────────────────────────────────────
  //
  // Accepts all filter values as explicit arguments instead of reading from
  // closure. This is the key fix: React setState is async, so any function
  // that reads filter state from its closure may see stale values immediately
  // after a setState call. By passing values explicitly, every caller controls
  // exactly which values are used — including handleResetFilters (which passes
  // the cleared values directly) and the initial load (which passes defaults).

  const runFetch = useCallback(async (filters: {
    dateRange: 'thisMonth' | 'lastMonth' | 'custom';
    customStartDate: string;
    customEndDate: string;
    selectedCategory: string;
    selectedAccount: string;
    searchTerm: string;
    cats: Category[];
    accs: Account[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (filters.dateRange === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = now.toISOString();
      } else if (filters.dateRange === 'lastMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        // Last moment of the last day of last month
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      } else if (
        filters.dateRange === 'custom' &&
        filters.customStartDate &&
        filters.customEndDate
      ) {
        startDate = new Date(filters.customStartDate).toISOString();
        // Include the full end day
        const end = new Date(filters.customEndDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }

      const params = new URLSearchParams({ transaction_type: 'expense' });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (filters.selectedCategory) params.append('category_id', filters.selectedCategory);
      if (filters.selectedAccount) params.append('account_id', filters.selectedAccount);
      if (filters.searchTerm.trim()) params.append('search', filters.searchTerm.trim());

      const raw = await fetchAndValidateArray<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?${params.toString()}`,
        TransactionSchema,
        { credentials: 'include' }
      );

      // Enrich with joined objects (client-side lookup using the passed-in arrays)
      const enriched = raw.map(t => ({
        ...t,
        category: filters.cats.find(c => c.id === t.category_id),
        account: filters.accs.find(a => a.id === t.account_id),
      }));

      setExpenses(enriched);

      const total = enriched.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setTotalSpent(total);
      setExpenseCount(enriched.length);

      const breakdown: Record<string, number> = {};
      enriched.forEach(t => {
        const name = t.category?.name || 'Uncategorized';
        breakdown[name] = (breakdown[name] || 0) + Math.abs(t.amount);
      });
      setCategoryBreakdown(breakdown);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convenience wrapper — reads current state. Safe to call when all relevant
  // state is already settled (Refresh button, post-CRUD refetch).
  const fetchExpenses = useCallback(() => {
    runFetch({
      dateRange,
      customStartDate,
      customEndDate,
      selectedCategory,
      selectedAccount,
      searchTerm,
      cats: categories,
      accs: accounts,
    });
  }, [runFetch, dateRange, customStartDate, customEndDate, selectedCategory, selectedAccount, searchTerm, categories, accounts]);

  // ── Effects ──────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Initial load: fetch reference data then immediately fetch expenses using
  // the loaded arrays directly — no second render cycle needed.
  useEffect(() => {
    if (!user || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      setIsInitializing(true);
      setError(null);
      try {
        const [cats, accs] = await Promise.all([
          fetchAndValidateArray<Category>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/categories/`,
            CategorySchema,
            { credentials: 'include' }
          ),
          fetchAndValidateArray<Account>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`,
            AccountSchema,
            { credentials: 'include' }
          ),
        ]);
        setCategories(cats);
        setAccounts(accs);
        // Pass the freshly loaded arrays directly — not from state
        await runFetch({
          dateRange: 'thisMonth',
          customStartDate: '',
          customEndDate: '',
          selectedCategory: '',
          selectedAccount: '',
          searchTerm: '',
          cats,
          accs,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [user]);

  // Re-fetch when any non-search filter changes.
  // `isInitializing` guard prevents double-fetching on mount since the initial
  // load above already calls runFetch directly.
  useEffect(() => {
    if (isInitializing || categories.length === 0) return;
    runFetch({
      dateRange,
      customStartDate,
      customEndDate,
      selectedCategory,
      selectedAccount,
      searchTerm,
      cats: categories,
      accs: accounts,
    });
    // searchTerm is intentionally excluded — handled by the debounced effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, customStartDate, customEndDate, selectedCategory, selectedAccount]);

  // Debounced search — waits 400 ms after the user stops typing before fetching
  useEffect(() => {
    if (isInitializing || categories.length === 0) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      runFetch({
        dateRange,
        customStartDate,
        customEndDate,
        selectedCategory,
        selectedAccount,
        searchTerm,
        cats: categories,
        accs: accounts,
      });
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ── CRUD handlers ──────────────────────────────────────────

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await postAndValidate<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/`,
        TransactionSchema,
        {
          amount: -Math.abs(parseFloat(formData.amount)),
          description: formData.description,
          category_id: formData.category_id || null,
          account_id: formData.account_id,
          transaction_date: new Date(formData.transaction_date).toISOString(),
          notes: formData.notes || null,
          is_recurring: formData.is_recurring,
          currency: 'ZAR',
          transaction_type: 'expense',
        },
        { credentials: 'include' }
      );
      setShowAddModal(false);
      resetForm();
      fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await putAndValidate<Transaction>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedExpense.id}/`,
        TransactionSchema,
        {
          amount: -Math.abs(parseFloat(formData.amount)),
          description: formData.description,
          category_id: formData.category_id || null,
          account_id: formData.account_id,
          transaction_date: new Date(formData.transaction_date).toISOString(),
          notes: formData.notes || null,
          is_recurring: formData.is_recurring,
          transaction_type: 'expense',
        },
        { credentials: 'include' }
      );
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    setIsSubmitting(true);
    try {
      await deleteRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedExpense.id}/`,
        { credentials: 'include' }
      );
      setShowDeleteModal(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (expense: Transaction) => {
    setSelectedExpense(expense);
    setFormData({
      amount: Math.abs(expense.amount).toString(),
      description: expense.description,
      category_id: expense.category_id || '',
      account_id: expense.account_id,
      transaction_date: expense.transaction_date.split('T')[0],
      notes: expense.notes || '',
      is_recurring: expense.is_recurring,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (expense: Transaction) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  // Passes the cleared values directly to runFetch — no stale closure risk.
  const handleResetFilters = () => {
    setDateRange('thisMonth');
    setSelectedCategory('');
    setSelectedAccount('');
    setSearchTerm('');
    setCustomStartDate('');
    setCustomEndDate('');
    runFetch({
      dateRange: 'thisMonth',
      customStartDate: '',
      customEndDate: '',
      selectedCategory: '',
      selectedAccount: '',
      searchTerm: '',
      cats: categories,
      accs: accounts,
    });
  };

  // ── Shared form fields ──────────────────────────────────────

  const renderFormFields = () => (
    <>
      <div className="form-group">
        <label>Amount (ZAR) *</label>
        <input
          type="number" step="0.01" min="0.01"
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
          placeholder="250.00"
          required
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Grocery shopping, electricity bill, etc."
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.category_id}
            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
          >
            <option value="">Uncategorized</option>
            {categories.filter(c => c.category_type === 'EXPENSE').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Account *</label>
        <select
          value={formData.account_id}
          onChange={e => setFormData({ ...formData, account_id: e.target.value })}
          required
        >
          <option value="">Select an account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details..."
          rows={3}
        />
      </div>

      <div className="checkbox-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
          />
          This is a recurring expense
        </label>
      </div>
    </>
  );

  // ── Loading states ──────────────────────────────────────────

  if (authLoading || isInitializing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">
          {authLoading ? 'Authenticating…' : 'Loading categories and accounts…'}
        </p>
      </div>
    );
  }

  if (!user) return null;

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="expenses-page">

      {/* Top NavBar */}
      <header className="top-navbar">
        <nav className="top-navbar-container">
          <div className="top-navbar-left">
            <Link href="/dashboard" className="brand">FinTrackSA</Link>
            <div className="nav-links">
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/dashboard/income" className="nav-link">Income</Link>
              <Link href="/dashboard/expenses" className="nav-link active">Expenses</Link>
              <Link href="/dashboard/budgets" className="nav-link">Budgets</Link>
              <Link href="/dashboard/reports" className="nav-link">Reports</Link>
            </div>
          </div>
          <div className="top-navbar-right">
            <button className="icon-button"><span className="material-symbols-outlined">notifications</span></button>
            <button className="icon-button"><span className="material-symbols-outlined">settings</span></button>
            <div className="user-avatar">
              <div className="avatar-initials">{getInitials(user.full_name || user.email)}</div>
            </div>
          </div>
        </nav>
      </header>

      {/* Side NavBar */}
      <aside className="side-navbar">
        <div className="side-navbar-header">
          <h2>Expense Tracker</h2>
          <p>Monitor Your Spending</p>
        </div>
        <nav className="side-nav-links">
          <Link href="/dashboard" className="side-nav-link"><span className="material-symbols-outlined">dashboard</span>Overview</Link>
          <Link href="/dashboard/income" className="side-nav-link"><span className="material-symbols-outlined">trending_up</span>Income</Link>
          <Link href="/dashboard/expenses" className="side-nav-link active"><span className="material-symbols-outlined">trending_down</span>Expenses</Link>
          <Link href="/dashboard/budgets" className="side-nav-link"><span className="material-symbols-outlined">receipt</span>Budgets</Link>
          <Link href="/dashboard/reports" className="side-nav-link"><span className="material-symbols-outlined">analytics</span>Reports</Link>
        </nav>
        <button className="new-transaction-btn" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <span className="material-symbols-outlined">add_circle</span>Add Expense
        </button>
      </aside>

      {/* Main Content */}
      <main className="expenses-main">
        <div className="expenses-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Expense Tracker</h1>
              <p className="page-description">Track and analyze your spending habits.</p>
            </div>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                <span className="material-symbols-outlined">add</span>Add Expense
              </button>
              <button className="btn-secondary" onClick={fetchExpenses} disabled={isLoading}>
                <span className="material-symbols-outlined">refresh</span>Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchExpenses}>Retry</button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="summary-cards-grid">
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon expense-icon"><span className="material-symbols-outlined">receipt</span></span>
                <span className="summary-card-label">Total Spent</span>
              </div>
              <div className="summary-card-value">{formatCurrency(totalSpent)}</div>
              <div className="summary-card-footer">
                {dateRange === 'thisMonth' ? 'This month' : dateRange === 'lastMonth' ? 'Last month' : 'Selected period'}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon comparison-icon"><span className="material-symbols-outlined">compare_arrows</span></span>
                <span className="summary-card-label">Transactions</span>
              </div>
              <div className="summary-card-value">{expenseCount}</div>
              <div className="summary-card-footer">Total expenses</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon average-icon"><span className="material-symbols-outlined">calculate</span></span>
                <span className="summary-card-label">Average</span>
              </div>
              <div className="summary-card-value">
                {expenseCount > 0 ? formatCurrency(totalSpent / expenseCount) : 'R0.00'}
              </div>
              <div className="summary-card-footer">Per transaction</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-icon category-icon"><span className="material-symbols-outlined">category</span></span>
                <span className="summary-card-label">Top Category</span>
              </div>
              <div className="summary-card-value">
                {Object.keys(categoryBreakdown).length > 0
                  ? Object.keys(categoryBreakdown).reduce((a, b) =>
                    categoryBreakdown[a] > categoryBreakdown[b] ? a : b
                  )
                  : 'None'}
              </div>
              <div className="summary-card-footer">Most spent</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-grid">
              <div className="filter-group">
                <label>Date Range</label>
                <select
                  className="filter-select"
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value as typeof dateRange)}
                >
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="filter-group">
                    <label>From</label>
                    <input
                      type="date"
                      className="filter-input"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>To</label>
                    <input
                      type="date"
                      className="filter-input"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="filter-group">
                <label>Category</label>
                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.filter(c => c.category_type === 'EXPENSE').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Account</label>
                <select
                  className="filter-select"
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                >
                  <option value="">All Accounts</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group search-group">
                <label>Search</label>
                <div className="search-input-wrapper">
                  <span className="search-icon material-symbols-outlined">search</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by description or notes…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-footer">
              <button className="reset-filters-btn" onClick={handleResetFilters}>
                Reset Filters
              </button>
              <span className="filter-count">
                {isLoading ? 'Loading…' : `Showing ${expenseCount} expenses`}
              </span>
            </div>
          </div>

          {/* Category Breakdown — hidden when a single category is selected because
              percentages are always 100% in that case and add no useful information */}
          {Object.keys(categoryBreakdown).length > 0 && !selectedCategory && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Spending by Category</h2>
              </div>
              <div className="category-breakdown-grid">
                {Object.entries(categoryBreakdown).map(([catName, amount]) => {
                  const percentage = (amount / totalSpent) * 100;
                  const categoryColor = categories.find(c => c.name === catName)?.color || '#667eea';
                  return (
                    <div key={catName} className="category-stat">
                      <div className="category-stat-header">
                        <span className="category-name">{catName}</span>
                        <span className="category-amount">{formatCompactCurrency(amount)}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${percentage}%`, backgroundColor: categoryColor }}
                        />
                      </div>
                      <span className="category-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Expense List</h2>
              <span className="section-count">{expenseCount} expenses</span>
            </div>

            {isLoading ? (
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Loading expenses…</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💸</div>
                <h3>No expenses found</h3>
                <p>
                  {selectedCategory || selectedAccount || searchTerm
                    ? 'Try adjusting your filters to see more results.'
                    : 'Add your first expense to start tracking your spending.'}
                </p>
                {!selectedCategory && !selectedAccount && !searchTerm && (
                  <button className="btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    + Add Expense
                  </button>
                )}
              </div>
            ) : (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Account</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id}>
                        <td className="date-cell">{formatDate(expense.transaction_date)}</td>
                        <td className="description-cell">
                          <div className="expense-description">
                            {expense.description}
                            {expense.notes && (
                              <span className="expense-notes" title={expense.notes}>📝</span>
                            )}
                            {expense.is_recurring && (
                              <span className="recurring-badge" title="Recurring">🔄</span>
                            )}
                          </div>
                        </td>
                        <td className="category-cell">
                          {expense.category ? (
                            <span
                              className="category-badge"
                              style={{
                                backgroundColor: getCategoryColor(expense.category_id) + '20',
                                color: getCategoryColor(expense.category_id),
                              }}
                            >
                              {expense.category.name}
                            </span>
                          ) : (
                            <span className="category-badge uncategorized">Uncategorized</span>
                          )}
                        </td>
                        <td className="account-cell">{expense.account?.name || '—'}</td>
                        <td className="text-right expense-amount">
                          {formatCurrency(Math.abs(expense.amount))}
                        </td>
                        <td className="text-center">
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => handleEditClick(expense)} title="Edit">
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(expense)} title="Delete">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Expense</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddExpense}>
              {renderFormFields()}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Expense</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateExpense}>
              {renderFormFields()}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating…' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Expense</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this expense?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="delete-preview">
                <p><strong>{selectedExpense.description}</strong></p>
                <p>{formatCurrency(Math.abs(selectedExpense.amount))}</p>
                <p>{formatDate(selectedExpense.transaction_date)}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteExpense} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting…' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}