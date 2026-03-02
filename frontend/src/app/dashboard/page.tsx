'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import './dashboard.css';
import IncomeExpensePieChart from './components/IncomeExpensePieChart';

// Real data types based on backend API
interface FinancialStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  totalAssets?: number;
  totalLiabilities?: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  time: string;
  date: string;
}

interface IncomeStats {
  total_annual_income: number;
  average_monthly_income: number;
  predicted_next_month: number;
  total_tax_paid: number;
  net_annual_income: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_expenses?: number;
  total_tax: number;
  net_income: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      console.log('?? Fetching dashboard data...');

      // Fetch all data in parallel
      const [incomeStatsRes, transactionsRes, accountsRes, monthlySummaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats?year=${currentYear}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions?limit=10`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/summary/${currentYear}/${currentMonth}`, { headers })
      ]);

      // Parse responses
      let incomeData: IncomeStats | null = null;
      if (incomeStatsRes.ok) {
        incomeData = await incomeStatsRes.json();
        setIncomeStats(incomeData);
        console.log('? Income stats loaded:', incomeData);
      } else {
        console.warn('?? Income stats not available');
      }

      let monthlyData: MonthlySummary | null = null;
      if (monthlySummaryRes.ok) {
        monthlyData = await monthlySummaryRes.json();
        setMonthlySummary(monthlyData);
        console.log('? Monthly summary loaded:', monthlyData);
      } else {
        console.warn('?? Monthly summary not available');
      }

      let transactions: any[] = [];
      if (transactionsRes.ok) {
        transactions = await transactionsRes.json();
        console.log('? Transactions loaded:', transactions.length);
      } else {
        console.warn('?? Transactions not available');
      }

      let accounts: any[] = [];
      if (accountsRes.ok) {
        accounts = await accountsRes.json();
        console.log('? Accounts loaded:', accounts.length);
      } else {
        console.warn('?? Accounts not available');
      }

      // Calculate total balance from accounts
      const totalBalance = accounts.reduce((sum: number, acc: any) => 
        sum + parseFloat(acc.balance || 0), 0);

      // Get monthly income and expenses
      // Priority: 1. Monthly summary (most accurate), 2. Calculated from transactions, 3. Average from annual stats
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      if (monthlyData) {
        // Use monthly summary if available
        monthlyIncome = monthlyData.total_income || 0;
        monthlyExpenses = monthlyData.total_expenses || 0;
        console.log('?? Using monthly summary data:', { monthlyIncome, monthlyExpenses });
      } else {
        // Calculate from transactions
        const monthlyTransactions = transactions.filter((t: any) => {
          const txDate = new Date(t.transaction_date || t.date);
          return txDate.getMonth() + 1 === currentMonth && 
                 txDate.getFullYear() === currentYear;
        });

        monthlyIncome = monthlyTransactions
          .filter((t: any) => t.type === 'income' || parseFloat(t.amount) > 0)
          .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

        monthlyExpenses = monthlyTransactions
          .filter((t: any) => t.type === 'expense' || parseFloat(t.amount) < 0)
          .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

        console.log('?? Calculated from transactions:', { monthlyIncome, monthlyExpenses });

        // If still zero but we have annual data, show average as hint
        if (monthlyIncome === 0 && incomeData?.average_monthly_income) {
          console.log('?? Using average from annual stats as reference');
        }
      }

      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
        : 0;

      // Set financial stats
      const newStats: FinancialStats = {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate: Math.max(0, Math.min(100, savingsRate)), // Clamp between 0-100
        totalAssets: totalBalance,
        totalLiabilities: 0
      };
      
      setStats(newStats);
      console.log('? Stats calculated:', newStats);

      // Transform transactions to recent activity format
      if (transactions.length > 0) {
        const activity: RecentActivity[] = transactions.slice(0, 5).map((t: any) => {
          const amount = parseFloat(t.amount);
          const isIncome = amount > 0 || t.type === 'income';
          const txDate = new Date(t.transaction_date || t.date);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - txDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let timeString = '';
          if (diffDays === 0) timeString = 'Today';
          else if (diffDays === 1) timeString = 'Yesterday';
          else if (diffDays < 7) timeString = `${diffDays} days ago`;
          else if (diffDays < 30) timeString = `${Math.floor(diffDays / 7)} weeks ago`;
          else timeString = `${Math.floor(diffDays / 30)} months ago`;

          return {
            id: t.id,
            title: t.description || t.category || (isIncome ? 'Income' : 'Expense'),
            description: t.notes || t.category || '',
            amount: Math.abs(amount),
            type: isIncome ? 'income' : 'expense',
            time: timeString,
            date: t.transaction_date || t.date
          };
        });

        setRecentActivity(activity);
      }

    } catch (err) {
      console.error('?? Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      
      // Fallback to mock data if API fails completely
      console.log('?? Using fallback mock data');
      setStats({
        totalBalance: 15420.75,
        monthlyIncome: 32500.00,
        monthlyExpenses: 18750.25,
        savingsRate: 42.3,
      });
      
      setRecentActivity([
        {
          id: '1',
          title: 'Salary Deposit',
          description: 'Monthly salary',
          amount: 32500.00,
          type: 'income',
          time: '2 days ago',
          date: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Grocery Shopping',
          description: 'Checkers',
          amount: 1250.75,
          type: 'expense',
          time: '3 days ago',
          date: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
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

  if (authLoading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !stats) {
    return (
      <div className="dashboard-container">
        <nav className="dashboard-navbar">
          <Link href="/dashboard" className="navbar-brand">
            <span className="brand-logo">?? SpendWise SA</span>
          </Link>
          <div className="navbar-links">
            <Link href="/dashboard" className="nav-link active">?? Dashboard</Link>
            <Link href="/dashboard/income" className="nav-link">?? Income</Link>
            <Link href="/dashboard/expenses" className="nav-link">?? Expenses</Link>
            <Link href="/dashboard/budgets" className="nav-link">?? Budgets</Link>
            <Link href="/dashboard/reports" className="nav-link">?? Reports</Link>
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
          <button onClick={fetchDashboardData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  // Determine if we should show average hint
  const showAverageHint = stats?.monthlyIncome === 0 && incomeStats?.average_monthly_income && incomeStats.average_monthly_income > 0;

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-logo">?? SpendWise SA</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="navbar-links">
          <Link href="/dashboard" className="nav-link active">
            ?? Dashboard
          </Link>
          <Link href="/dashboard/income" className="nav-link">
            ?? Income
          </Link>
          <Link href="/dashboard/expenses" className="nav-link">
            ?? Expenses
          </Link>
          <Link href="/dashboard/budgets" className="nav-link">
            ?? Budgets
          </Link>
          <Link href="/dashboard/reports" className="nav-link">
            ?? Reports
          </Link>
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
        {/* Welcome Section */}
        <section className="welcome-section fade-in">
          <h1 className="welcome-title">
            Welcome back, {user.full_name?.split(' ')[0] || 'User'}! ??
          </h1>
          <p className="welcome-subtitle">
            Here's an overview of your finances. Track, manage, and optimize your spending with our smart tools.
          </p>
        </section>

        {/* Stats Grid */}
        {stats && (
          <div className="stats-grid fade-in">
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Total Balance</h3>
                <div className="stat-icon">??</div>
              </div>
              <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
              <div className="stat-trend">
                <span>Across {stats.totalBalance === 0 ? 'no' : 'all'} accounts</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Monthly Income</h3>
                <div className="stat-icon">??</div>
              </div>
              <div className="stat-value">
                {formatCurrency(stats.monthlyIncome)}
                {showAverageHint && (
                  <span className="stat-hint">
                    (Avg: {formatCurrency(incomeStats?.average_monthly_income || 0)})
                  </span>
                )}
              </div>
              <div className="stat-trend">
                <span>
                  {stats.monthlyIncome > 0 ? 'This month' : 'No income this month'}
                </span>
              </div>
            </div>
             
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Monthly Expenses</h3>
                <div className="stat-icon">??</div>
              </div>
              <div className="stat-value">{formatCurrency(stats.monthlyExpenses)}</div>
              <div className="stat-trend">
                <span>
                  {stats.monthlyExpenses > 0 ? 'This month' : 'No expenses this month'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Savings Rate</h3>
                <div className="stat-icon">??</div>
              </div>
              <div className="stat-value">{stats.savingsRate.toFixed(1)}%</div>
              <div className="stat-trend">
                <span>
                  {stats.monthlyIncome === 0 
                    ? 'No income to calculate' 
                    : 'Of monthly income'}
                </span>
              </div>
            </div>
            
            {/* Income Stats Summary */}
            {incomeStats && (
              <div className="stat-card highlight-card">
                <div className="stat-header">
                  <h3 className="stat-title">Annual Income Overview</h3>
                  <div className="stat-icon">??</div>
                </div>
                <div className="stats-row">
                  <div className="stats-col">
                    <span className="stats-label">Total (YTD)</span>
                    <span className="stats-value highlight">
                      {formatCurrency(incomeStats.total_annual_income)}
                    </span>
                  </div>
                  <div className="stats-col">
                    <span className="stats-label">Monthly Avg</span>
                    <span className="stats-value">
                      {formatCurrency(incomeStats.average_monthly_income)}
                    </span>
                  </div>
                  <div className="stats-col">
                    <span className="stats-label">Next Month</span>
                    <span className="stats-value predicted">
                      {formatCurrency(incomeStats.predicted_next_month)}
                    </span>
                  </div>
                </div>
                {incomeStats.total_tax_paid > 0 && (
                  <div className="stats-footer">
                    <span className="stats-label">Tax Paid YTD:</span>
                    <span className="stats-value">{formatCurrency(incomeStats.total_tax_paid)}</span>
                    <span className="stats-label ml-2">Net:</span>
                    <span className="stats-value">{formatCurrency(incomeStats.net_annual_income)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Pie Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Income vs Expenses</h3>
              <IncomeExpensePieChart 
                income={stats.monthlyIncome}
                expenses={stats.monthlyExpenses}
              />
              {stats.monthlyIncome === 0 && stats.monthlyExpenses === 0 && (
                <p className="chart-empty-message">
                  Add transactions to see your income/expense breakdown
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <section className="quick-actions fade-in">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link href="/dashboard/income" className="action-button highlight">
              <div className="action-icon">??</div>
              <span className="action-label">Track Income</span>
            </Link>
            
            <Link href="/dashboard/transactions/add" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">Add Transaction</span>
            </Link>
            
            <Link href="/dashboard/budgets" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">Set Budget</span>
            </Link>
            
            <Link href="/dashboard/goals" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">Set Goals</span>
            </Link>
            
            <Link href="/dashboard/reports" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">View Reports</span>
            </Link>
            
            <Link href="/dashboard/profile" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">My Profile</span>
            </Link>
            
            <Link href="/dashboard/settings" className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">Settings</span>
            </Link>
            
            <button onClick={fetchDashboardData} className="action-button">
              <div className="action-icon">??</div>
              <span className="action-label">Refresh</span>
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity fade-in">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            {recentActivity.length > 0 && (
              <Link href="/dashboard/transactions" className="view-all-link">
                View All ?
              </Link>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state-small">
              <p>No recent activity. Add your first transaction to get started!</p>
              <Link href="/dashboard/transactions/add" className="btn-primary">
                Add Transaction
              </Link>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'income' ? '??' : '??'}
                  </div>
                  <div className="activity-content">
                    <h4 className="activity-title">{activity.title}</h4>
                    <p className="activity-description">{activity.description}</p>
                  </div>
                  <div className="activity-time">
                    <div className={`activity-amount ${activity.type}`}>
                      {activity.type === 'income' ? '+' : '-'}
                      {formatCurrency(activity.amount)}
                    </div>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} SpendWise SA. All rights reserved.</p>
        <p>Making financial management simple and effective for South Africans.</p>
      </footer>
    </div>
  );
}
