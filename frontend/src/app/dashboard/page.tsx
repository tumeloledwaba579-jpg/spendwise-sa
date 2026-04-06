'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAndValidateArray, fetchAndValidate } from '@/lib/api';
import {
  AccountSchema,
  TransactionSchema,
  IncomeStatsSchema,
  IncomeHistorySchema,
  CategorySchema,
  type Account,
  type Transaction,
  type IncomeStats,
  type IncomeHistory,
  type Category,
} from '@/lib/schemas';
import './fintrack.css';

interface UIRecentTransaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  icon: string;
  transaction_date?: string;
}

interface UIBudget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category_id: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [greeting, setGreeting] = useState('Good morning');

  const [totalBalance, setTotalBalance] = useState(0);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [liabilitiesTotal, setLiabilitiesTotal] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<UIRecentTransaction[]>([]);
  const [budgets, setBudgets] = useState<UIBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchDashboardData();
  }, [user, authLoading]);

  // ── Formatters ──────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(amount);

  const formatCompactCurrency = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `R${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1000) return `R${(abs / 1000).toFixed(1)}k`;
    return formatCurrency(amount);
  };

  const formatTimeAgo = (date: Date) => {
    const diffDays = Math.ceil(Math.abs(Date.now() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // ── Data fetch ──────────────────────────────────────────

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionError(false);

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Connection check — only flag as error if fetch itself fails, not just non-200
      // (a 404 on /health is fine; it means the server is up)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { credentials: 'include' });
      } catch {
        setConnectionError(true);
        setIsLoading(false);
        return; // No point fetching data if we can't reach the server
      }

      const [categoriesData, accounts, rawTransactions, stats, incomeHistory] = await Promise.all([
        fetchAndValidateArray<Category>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/categories/`,
          CategorySchema, { credentials: 'include' }
        ),
        fetchAndValidateArray<Account>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`,
          AccountSchema, { credentials: 'include' }
        ),
        fetchAndValidateArray<Transaction>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?limit=100`,
          TransactionSchema, { credentials: 'include' }
        ),
        fetchAndValidate<IncomeStats>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats/?year=${currentYear}`,
          IncomeStatsSchema, { credentials: 'include' }
        ),
        fetchAndValidateArray<IncomeHistory>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/?limit=100`,
          IncomeHistorySchema, { credentials: 'include' }
        ),
      ]);

      const transactions = rawTransactions.map(t => ({
        ...t,
        category: categoriesData.find(c => c.id === t.category_id),
      }));

      setIncomeStats(stats);

      // Budgets — optional endpoint, don't fail the whole page
      let budgetsData: any[] = [];
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/`, { credentials: 'include' });
        if (res.ok) budgetsData = await res.json();
      } catch { /* budgets unavailable — silently skip */ }

      // ── Accounts ──
      let totalAssets = 0;
      let totalLiabilities = 0;
      const liabilityTypes = ['CREDIT_CARD', 'LOAN', 'MORTGAGE', 'OVERDRAFT'];

      for (const acc of accounts) {
        const balance = typeof acc.balance === 'number' ? acc.balance : 0;
        if (liabilityTypes.includes(acc.account_type)) {
          totalLiabilities += Math.abs(balance);
        } else {
          totalAssets += balance;
        }
      }

      setAssetsTotal(totalAssets);
      setLiabilitiesTotal(totalLiabilities);
      setTotalBalance(totalAssets - totalLiabilities);

      // ── Monthly income ──
      const thisMonthIncome = incomeHistory.filter(inc => {
        const [y, m] = inc.received_date.split('-').map(Number);
        return y === currentYear && m === currentMonth;
      });
      const monthlyIncomeTotal = thisMonthIncome.reduce((s, i) => s + i.amount, 0);
      setMonthlyIncome(monthlyIncomeTotal);

      // ── Monthly expenses ──
      const thisMonthExpenses = transactions.filter(t => {
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && t.transaction_type === 'expense';
      });
      const monthlyExpensesTotal = thisMonthExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
      setMonthlyExpenses(monthlyExpensesTotal);
      setSavingsRate(monthlyIncomeTotal > 0 ? ((monthlyIncomeTotal - monthlyExpensesTotal) / monthlyIncomeTotal) * 100 : 0);

      // ── Recent activity ──
      const activity: UIRecentTransaction[] = [
        ...incomeHistory.slice(0, 5).map(inc => ({
          id: `inc-${inc.id}`,
          title: inc.notes || 'Income received',
          category: 'Income',
          date: formatTimeAgo(new Date(inc.received_date)),
          amount: inc.amount,
          type: 'income' as const,
          status: inc.is_manual_entry ? 'Manual' : 'Auto',
          icon: 'account_balance',
          transaction_date: inc.received_date,
        })),
        ...transactions
          .filter(t => t.transaction_type === 'expense')
          .slice(0, 5)
          .map(exp => ({
            id: `exp-${exp.id}`,
            title: exp.description,
            category: exp.category?.name || 'Uncategorized',
            date: formatTimeAgo(new Date(exp.transaction_date)),
            amount: Math.abs(exp.amount),
            type: 'expense' as const,
            status: exp.is_recurring ? 'Recurring' : 'One-time',
            icon: exp.category?.icon || 'shopping_cart',
            transaction_date: exp.transaction_date,
          })),
      ];

      activity.sort((a, b) =>
        new Date(b.transaction_date || '').getTime() - new Date(a.transaction_date || '').getTime()
      );
      setRecentTransactions(activity.slice(0, 5));

      // ── Budgets ──
      if (budgetsData.length > 0) {
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        setBudgets(
          budgetsData.slice(0, 5).map((b: any) => {
            const amount = typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount;
            const spent = transactions
              .filter(t =>
                t.category_id === b.category_id &&
                t.transaction_type === 'expense' &&
                new Date(t.transaction_date) >= startDate &&
                new Date(t.transaction_date) <= endDate
              )
              .reduce((s, t) => s + Math.abs(t.amount), 0);

            return {
              id: b.id,
              name: b.name,
              amount,
              spent,
              remaining: amount - spent,
              percentage: amount > 0 ? (spent / amount) * 100 : 0,
              category_id: b.category_id,
            };
          })
        );
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────

  const userName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const isNetWorthNegative = totalBalance < 0;
  const avgBudgetUsage = budgets.length > 0
    ? Math.round(budgets.reduce((s, b) => s + b.percentage, 0) / budgets.length)
    : 0;

  const budgetBarColor = (pct: number) =>
    pct >= 100 ? '#ef4444' : pct >= 80 ? '#f97316' : '#00C853';

  // ── Loading state ──────────────────────────────────────

  if (authLoading || isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Render ────────────────────────────────────────────

  return (
    <div className="dashboard-container">

      {/* Top NavBar */}
      <header className="top-navbar">
        <div className="top-navbar-left">
          <Link href="/dashboard" className="brand">FinTrackSA</Link>
          <nav className="nav-links">
            <Link href="/dashboard" className="nav-link active">Dashboard</Link>
            <Link href="/dashboard/income" className="nav-link">Income</Link>
            <Link href="/dashboard/expenses" className="nav-link">Expenses</Link>
            <Link href="/dashboard/budgets" className="nav-link">Budgets</Link>
            <Link href="/dashboard/reports" className="nav-link">Reports</Link>
          </nav>
        </div>
        <div className="top-navbar-right">
          <button className="icon-button" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="user-avatar" title={user.full_name || user.email}>
            <div className="avatar-initials">{userName.charAt(0)}</div>
          </div>
        </div>
      </header>

      {/* Side NavBar */}
      <aside className="side-navbar">
        <div className="side-navbar-header">
          <h2>FinTrackSA</h2>
          <p>Private Wealth</p>
        </div>
        <nav className="side-nav-links">
          <Link href="/dashboard" className="side-nav-link active"><span className="material-symbols-outlined">dashboard</span>Overview</Link>
          <Link href="/dashboard/income" className="side-nav-link"><span className="material-symbols-outlined">trending_up</span>Income</Link>
          <Link href="/dashboard/expenses" className="side-nav-link"><span className="material-symbols-outlined">trending_down</span>Expenses</Link>
          <Link href="/dashboard/budgets" className="side-nav-link"><span className="material-symbols-outlined">receipt</span>Budgets</Link>
          <Link href="/dashboard/reports" className="side-nav-link"><span className="material-symbols-outlined">analytics</span>Reports</Link>
        </nav>
        <Link href="/dashboard/expenses" className="new-transaction-btn">
          <span className="material-symbols-outlined">add_circle</span>New Transaction
        </Link>
      </aside>

      {/* Main Content */}
      <main className="main-canvas">
        <div className="canvas-container">

          {/* Hero */}
          <section className="hero-section">
            <h1 className="hero-title">{greeting}, {userName}</h1>
            <p className="hero-subtitle">Here is a summary of your wealth portfolio today.</p>
          </section>

          {/* Connection error */}
          {connectionError && (
            <div className="error-banner connection">
              <p>⚠️ Cannot reach the backend. Check that the server is running.</p>
              <button className="error-banner-retry" onClick={fetchDashboardData}>Retry</button>
            </div>
          )}

          {/* Data error (non-connection) */}
          {error && !connectionError && (
            <div className="error-banner warning">
              <p>{error}</p>
              <button className="error-banner-retry" onClick={fetchDashboardData}>Retry</button>
            </div>
          )}

          {/* Stat Grid */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Assets</span>
                <span className="stat-badge">What you own</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {formatCurrency(assetsTotal)}
              </div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min(100, (assetsTotal / 100_000) * 100)}%` }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Liabilities</span>
                <span className="stat-badge">What you owe</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--error)' }}>
                {formatCurrency(liabilitiesTotal)}
              </div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min(100, (liabilitiesTotal / 100_000) * 100)}%`, backgroundColor: 'var(--error)' }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Net Worth</span>
                <span className="stat-badge">Assets − Liabilities</span>
              </div>
              <div className={`stat-value${isNetWorthNegative ? ' negative' : ''}`}>
                {formatCurrency(totalBalance)}
              </div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min(100, (Math.abs(totalBalance) / 100_000) * 100)}%` }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Monthly Income</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '18px' }}>trending_up</span>
              </div>
              <div className="stat-value">{formatCompactCurrency(monthlyIncome)}</div>
              <p className="stat-subtitle">Deposited this month</p>
            </div>
          </div>

          {/* Bento Layout */}
          <div className="dashboard-bento">

            {/* Left column */}
            <div className="left-column">

              {/* Recent Activity */}
              <div className="activity-section">
                <div className="section-header">
                  <h3 className="section-title">Recent Activity</h3>
                  <Link href="/dashboard/expenses" className="view-link">View all →</Link>
                </div>
                <div className="transaction-list">
                  {recentTransactions.length === 0 ? (
                    <div className="empty-state">
                      <p>No transactions yet.</p>
                      <Link href="/dashboard/expenses" className="view-link">Add your first expense</Link>
                    </div>
                  ) : (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-left">
                          <div className="transaction-icon">
                            <span className="material-symbols-outlined">{tx.icon}</span>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-title">{tx.title}</div>
                            <div className="transaction-meta">{tx.category} · {tx.date}</div>
                          </div>
                        </div>
                        <div className="transaction-right">
                          <div className={`transaction-amount ${tx.type === 'income' ? 'positive' : 'negative'}`}>
                            {tx.type === 'income' ? '+' : '−'}{formatCompactCurrency(tx.amount)}
                          </div>
                          <div className="transaction-status">{tx.status}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="budget-section">
                <div className="budget-header">
                  <h3 className="section-title">Monthly Budget</h3>
                  <span className="budget-warning">
                    {budgets.length > 0 ? `${avgBudgetUsage}% avg used` : 'No budgets set'}
                  </span>
                </div>

                {budgets.length === 0 ? (
                  <div className="empty-state">
                    <p>No budgets created yet.</p>
                    <Link href="/dashboard/budgets" className="view-link">Create a budget</Link>
                  </div>
                ) : (
                  budgets.map(budget => (
                    <div key={budget.id} className="budget-item">
                      <div className="budget-label">
                        <span className="budget-name">{budget.name}</span>
                        <span className="budget-amount">
                          {formatCompactCurrency(budget.spent)} / {formatCompactCurrency(budget.amount)}
                        </span>
                      </div>
                      <div className="budget-bar">
                        <div
                          className="budget-bar-fill"
                          style={{
                            width: `${Math.min(100, budget.percentage)}%`,
                            backgroundColor: budgetBarColor(budget.percentage),
                          }}
                        />
                      </div>
                      <div className="budget-stats">
                        <span className={`budget-percentage ${budget.percentage >= 100 ? 'danger' : budget.percentage >= 80 ? 'warning' : 'success'}`}>
                          {budget.percentage.toFixed(0)}% used
                        </span>
                        {budget.spent > budget.amount && (
                          <span className="budget-over">
                            Over by {formatCompactCurrency(budget.spent - budget.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Right column */}
            <div className="right-column">

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                  <Link href="/dashboard/expenses" className="quick-action-btn primary">
                    <span className="material-symbols-outlined">add</span>
                    <span>Expense</span>
                  </Link>
                  <Link href="/dashboard/income" className="quick-action-btn secondary">
                    <span className="material-symbols-outlined">trending_up</span>
                    <span>Income</span>
                  </Link>
                  <Link href="/dashboard/budgets" className="quick-action-btn tertiary">
                    <span className="material-symbols-outlined">receipt</span>
                    <span>Budget</span>
                  </Link>
                  <button onClick={fetchDashboardData} className="quick-action-btn surface">
                    <span className="material-symbols-outlined">refresh</span>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Annual Overview */}
              {incomeStats && (
                <div className="card-widget">
                  <div className="card-widget-badge">Annual Overview · {new Date().getFullYear()}</div>
                  <div className="card-widget-row">
                    <span>Total Income</span>
                    <span>{formatCompactCurrency(incomeStats.total_annual_income)}</span>
                  </div>
                  <div className="card-widget-row">
                    <span>Net Income</span>
                    <span>{formatCompactCurrency(incomeStats.net_annual_income)}</span>
                  </div>
                  <div className="card-widget-row">
                    <span>Top Source</span>
                    <span>{incomeStats.top_source_name}</span>
                  </div>
                  <div className="card-bg-decoration" />
                </div>
              )}

              {/* Security Banner */}
              <div className="security-banner">
                <div className="security-icon">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <div className="security-title">Security: Strong</div>
                  <div className="security-text">
                    Your account is protected with secure authentication and encrypted storage.
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-copyright">
              FinTrackSA Wealth Management © {new Date().getFullYear()}
            </div>
            <div className="footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/help">Help Centre</Link>
            </div>
          </footer>

        </div>
      </main>

      <button className="fab-mobile" aria-label="New transaction" onClick={() => { }}>
        <span className="material-symbols-outlined">add</span>
      </button>

    </div>
  );
}