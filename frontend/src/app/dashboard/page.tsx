'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import './dashboard.css';

// Icons as components for better performance
const Icons = {
  Dashboard: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2-9 2 9h4l-3 5 2 4-5-2-5 2 2-4-3-5z" /></svg>,
  Income: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5"/></svg>,
  Expenses: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M7 7l5-5 5 5M17 17l-5 5-5-5"/></svg>,
  Budget: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8v8H8z"/></svg>,
  Reports: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/><path d="M15 4h5v5"/><path d="M9 15l3-3 3 3 4-4"/></svg>,
  Bell: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Settings: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  TrendingUp: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8 10 1 17"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8 14 1 7"/><polyline points="17 18 23 18 23 12"/></svg>,
  PiggyBank: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><circle cx="16" cy="9" r="1"/></svg>,
  Flag: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  TrendingUpZA: () => <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5.5-5.5-7 7" stroke="#F44336"/><path d="M17 6l6 6" stroke="#00C853"/><circle cx="21" cy="3" r="2" fill="#FDD835" stroke="none"/></svg>,
};

interface FinancialStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  previousMonthIncome?: number;
  previousMonthExpenses?: number;
  topCategory?: string;
  budgetStatus?: { onTrack: number; overBudget: number };
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  time: string;
  date: string;
  category?: string;
  icon?: string;
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

interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
  spent?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
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
    const fetchOptions = {
      credentials: 'include' as RequestCredentials,
      headers: { 'Content-Type': 'application/json' }
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    console.log('📊 Fetching dashboard data...');
    console.log(`Current period: ${currentYear}-${currentMonth}`);
    console.log(`Last month period: ${lastMonthYear}-${lastMonth}`);

    // Fetch all data in parallel
    const [
      accountsRes,
      transactionsRes,
      incomeStatsRes,
      categoriesRes
    ] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?limit=100`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats/?year=${currentYear}`, fetchOptions),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, fetchOptions)
    ]);

    // Process accounts
    let accounts: any[] = [];
    if (accountsRes.status === 'fulfilled' && accountsRes.value.ok) {
      accounts = await accountsRes.value.json();
      console.log('✅ Accounts loaded:', accounts.length);
    } else {
      console.warn('⚠️ Accounts not available');
    }

    // Process transactions with detailed debugging
    let transactions: any[] = [];
    if (transactionsRes.status === 'fulfilled' && transactionsRes.value.ok) {
      transactions = await transactionsRes.value.json();
      console.log('✅ Transactions loaded:', transactions.length);
      
      // 🔍 DETAILED DEBUGGING - Show all transactions
      console.log('📅 Current date:', now.toISOString());
      console.log('📅 Looking for month:', currentMonth, 'Year:', currentYear);
      
      if (transactions.length > 0) {
        transactions.forEach((t: any, index: number) => {
          const txDate = new Date(t.transaction_date || t.date);
          const txMonth = txDate.getMonth() + 1;
          const txYear = txDate.getFullYear();
          
          console.log(`Transaction ${index + 1}:`, {
            id: t.id,
            description: t.description || 'No description',
            amount: t.amount,
            type: t.type,
            date: t.transaction_date || t.date,
            parsedDate: txDate.toISOString(),
            month: txMonth,
            year: txYear,
            isCurrentMonth: txMonth === currentMonth && txYear === currentYear
          });
        });
      } else {
        console.log('⚠️ No transactions found');
      }
    } else {
      console.warn('⚠️ Transactions not available');
      if (transactionsRes.status === 'rejected') {
        console.error('Transactions fetch rejected:', transactionsRes.reason);
      } else if (transactionsRes.value && !transactionsRes.value.ok) {
        console.error('Transactions fetch failed with status:', transactionsRes.value.status);
      }
    }

    // Process income stats
    let incomeData: IncomeStats | null = null;
    if (incomeStatsRes.status === 'fulfilled' && incomeStatsRes.value.ok) {
      incomeData = await incomeStatsRes.value.json();
      setIncomeStats(incomeData);
      console.log('✅ Income stats loaded:', incomeData);
    } else {
      console.warn('⚠️ Income stats not available');
    }

    // Process categories
    if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
      const data = await categoriesRes.value.json();
      setCategories(data.slice(0, 5));
      console.log('✅ Categories loaded:', data.length);
    } else {
      console.warn('⚠️ Categories not available - 404 is expected if endpoint doesn\'t exist');
    }

    // Calculate total balance from accounts
    const totalBalance = accounts.reduce((sum: number, acc: any) => 
      sum + parseFloat(acc.balance || 0), 0);
    console.log('💰 Total balance:', totalBalance);

    // ============================================================
    // GET CURRENT MONTH TRANSACTIONS
    // ============================================================
    const currentMonthTransactions = transactions.filter((t: any) => {
      const txDate = new Date(t.transaction_date || t.date);
      const txMonth = txDate.getMonth() + 1;
      const txYear = txDate.getFullYear();
      return txMonth === currentMonth && txYear === currentYear;
    });

    console.log(`📊 Found ${currentMonthTransactions.length} transactions for ${currentYear}-${currentMonth}`);

    // ============================================================
    // GET LAST MONTH TRANSACTIONS FOR COMPARISON
    // ============================================================
    const lastMonthTransactions = transactions.filter((t: any) => {
      const txDate = new Date(t.transaction_date || t.date);
      const txMonth = txDate.getMonth() + 1;
      const txYear = txDate.getFullYear();
      return txMonth === lastMonth && txYear === lastMonthYear;
    });

    // ============================================================
    // CALCULATE MONTHLY INCOME AND EXPENSES - USING ONLY REAL DATA
    // ============================================================

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    if (currentMonthTransactions.length > 0) {
      // Use actual transactions if available
      console.log('📊 Using actual transactions for monthly data');
      
      monthlyIncome = currentMonthTransactions
        .filter((t: any) => {
          const amount = parseFloat(t.amount);
          return amount > 0 || t.type === 'income';
        })
        .reduce((sum: number, t: any) => {
          const amount = Math.abs(parseFloat(t.amount));
          console.log(`💰 Income: ${t.description || 'Unknown'} - R${amount}`);
          return sum + amount;
        }, 0);

      monthlyExpenses = currentMonthTransactions
        .filter((t: any) => {
          const amount = parseFloat(t.amount);
          return amount < 0 || t.type === 'expense';
        })
        .reduce((sum: number, t: any) => {
          const amount = Math.abs(parseFloat(t.amount));
          console.log(`💸 Expense: ${t.description || 'Unknown'} - R${amount}`);
          return sum + amount;
        }, 0);
    } else if (incomeData) {
      // Use income stats for income only - NO HARDCODED EXPENSES
      console.log('📊 No current month transactions, using income stats for income only');
      console.log('📊 Expenses set to 0 since no actual expense data exists');
      
      monthlyIncome = parseFloat(incomeData.average_monthly_income.toString()) || 0;
      monthlyExpenses = 0; // No expenses in current month
      
    } else {
      console.log('⚠️ No transaction data and no income stats available');
      monthlyIncome = 0;
      monthlyExpenses = 0;
    }

    console.log('📊 Final monthly values (REAL DATA ONLY):', { 
      monthlyIncome: monthlyIncome.toFixed(2), 
      monthlyExpenses: monthlyExpenses.toFixed(2) 
    });

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
      : 0;

    console.log('📊 Savings rate:', savingsRate.toFixed(1), '%');

    // Calculate last month income and expenses
    const lastMonthIncome = lastMonthTransactions
      .filter((t: any) => parseFloat(t.amount) > 0 || t.type === 'income')
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter((t: any) => parseFloat(t.amount) < 0 || t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

    console.log('📈 Last month income:', lastMonthIncome);
    console.log('📉 Last month expenses:', lastMonthExpenses);

    // Calculate income change percentage
    const incomeChangePercent = lastMonthIncome > 0 
      ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
      : '0';

    const expenseChangePercent = lastMonthExpenses > 0 
      ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
      : lastMonthExpenses === 0 && monthlyExpenses > 0 ? '+100' : '0';

    // ============================================================
    // FIND TOP SPENDING CATEGORY
    // ============================================================

    const categorySpending: Record<string, number> = {};
    transactions
      .filter((t: any) => parseFloat(t.amount) < 0 || t.type === 'expense')
      .forEach((t: any) => {
        const cat = t.category || 'Other';
        categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(parseFloat(t.amount));
      });

    let topCategory = 'None';
    let topAmount = 0;
    Object.entries(categorySpending).forEach(([cat, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = cat;
      }
    });

    console.log('📊 Final stats (REAL DATA ONLY):', {
      totalBalance,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpenses: monthlyExpenses.toFixed(2),
      savingsRate: savingsRate.toFixed(1),
      topCategory,
      incomeChange: incomeChangePercent,
      expenseChange: expenseChangePercent
    });

    setStats({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      previousMonthIncome: lastMonthIncome,
      previousMonthExpenses: lastMonthExpenses,
      topCategory: topCategory !== 'None' ? topCategory : undefined,
      budgetStatus: { onTrack: 3, overBudget: 1 }
    });

    // ============================================================
    // TRANSFORM RECENT ACTIVITY
    // ============================================================

    if (transactions.length > 0) {
      const activity: RecentActivity[] = transactions.slice(0, 8).map((t: any) => {
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

        const activityType: 'income' | 'expense' = isIncome ? 'income' : 'expense';

        return {
          id: t.id,
          title: t.description || t.category || (isIncome ? 'Income' : 'Expense'),
          description: t.notes || '',
          amount: Math.abs(amount),
          type: activityType,
          time: timeString,
          date: t.transaction_date || t.date,
          category: t.category,
          icon: isIncome ? '💰' : '💸'
        };
      });

      setRecentActivity(activity);
    }

  } catch (err) {
    console.error('🔴 Error fetching dashboard data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    
    // Fallback mock data - only used if API completely fails
    setStats({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      savingsRate: 0,
      previousMonthIncome: 0,
      previousMonthExpenses: 0,
      topCategory: undefined,
      budgetStatus: { onTrack: 0, overBudget: 0 }
    });
    
    setRecentActivity([]);
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

  const formatCompactCurrency = (amount: number): string => {
    if (amount >= 1000000) return `R${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R${(amount / 1000).toFixed(1)}k`;
    return formatCurrency(amount);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomGradient = (seed: string) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #00C853 0%, #64DD17 100%)',
      'linear-gradient(135deg, #FF3D00 0%, #FF9100 100%)',
      'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
      'linear-gradient(135deg, #9C27B0 0%, #E1BEE7 100%)',
      'linear-gradient(135deg, #F44336 0%, #FF9800 100%)',
      'linear-gradient(135deg, #3F51B5 0%, #9FA8DA 100%)',
      'linear-gradient(135deg, #009688 0%, #4DB6AC 100%)',
    ];
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (authLoading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your financial dashboard...</p>
        <p className="loading-subtext">Fetching your latest data</p>
      </div>
    );
  }

  if (!user) return null;

  const incomeChangePercent = stats?.previousMonthIncome 
    ? ((stats.monthlyIncome - stats.previousMonthIncome) / stats.previousMonthIncome * 100).toFixed(1)
    : '0';

  const expenseChangePercent = stats?.previousMonthExpenses
    ? ((stats.monthlyExpenses - stats.previousMonthExpenses) / stats.previousMonthExpenses * 100).toFixed(1)
    : '0';

  return (
    <div className="dashboard-container">
      {/* Animated background */}
      <div className="dashboard-bg">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
        <div className="bg-circle circle-4"></div>
        <div className="za-flag-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="dashboard-navbar glass-effect">
        <div className="nav-container">
          <Link href="/dashboard" className="navbar-brand">
            <span className="brand-logo">🇿🇦</span>
            <span className="brand-name">SpendWise<span className="brand-sa">SA</span></span>
          </Link>
          
          <div className="navbar-links">
            <Link href="/dashboard" className="nav-link active">
              <Icons.Dashboard />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/income" className="nav-link">
              <Icons.Income />
              <span>Income</span>
            </Link>
            <Link href="/dashboard/expenses" className="nav-link">
              <Icons.Expenses />
              <span>Expenses</span>
            </Link>
            <Link href="/dashboard/budgets" className="nav-link">
              <Icons.Budget />
              <span>Budgets</span>
            </Link>
            <Link href="/dashboard/reports" className="nav-link">
              <Icons.Reports />
              <span>Reports</span>
            </Link>
          </div>
          
          <div className="navbar-actions">
            <button className="icon-button">
              <Icons.Bell />
              <span className="notification-badge">3</span>
            </button>
            <button className="icon-button">
              <Icons.Settings />
            </button>
            <div className="user-menu">
              <div className="user-avatar" style={{ background: getRandomGradient(user.email) }}>
                {getInitials(user.full_name || user.email)}
              </div>
              <div className="user-dropdown">
                <span className="user-name">{user.full_name || user.email}</span>
                <span className="user-email">{user.email}</span>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item">
                  <Icons.Logout />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        {/* Welcome Header */}
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title">
              {greeting}, {user.full_name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here&apos;s what&apos;s happening with your finances today.
            </p>
          </div>
          <div className="date-badge glass-effect">
            <span className="date-day">{new Date().toLocaleDateString('en-ZA', { day: 'numeric' })}</span>
            <span className="date-month">{new Date().toLocaleDateString('en-ZA', { month: 'short' })}</span>
            <span className="date-year">{new Date().getFullYear()}</span>
          </div>
        </div>

        {error && (
          <div className="error-message glass-effect">
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="retry-button">Retry</button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card glass-effect hover-lift">
                <div className="stat-header">
                  <h3>Total Balance</h3>
                  <Icons.PiggyBank />
                </div>
                <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
                <div className="stat-footer">
                  <span className="stat-label">Across all accounts</span>
                  <span className="stat-trend positive">
                    <Icons.TrendingUpZA /> +2.3%
                  </span>
                </div>
              </div>

              <div className="stat-card glass-effect hover-lift">
                <div className="stat-header">
                  <h3>Monthly Income</h3>
                  <Icons.Income />
                </div>
                <div className="stat-value">{formatCurrency(stats.monthlyIncome)}</div>
                <div className="stat-footer">
                  <span className="stat-label">vs last month</span>
                  <span className={`stat-trend ${parseFloat(incomeChangePercent) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(incomeChangePercent) >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
                    {Math.abs(parseFloat(incomeChangePercent))}%
                  </span>
                </div>
              </div>
               
              <div className="stat-card glass-effect hover-lift">
                <div className="stat-header">
                  <h3>Monthly Expenses</h3>
                  <Icons.Expenses />
                </div>
                <div className="stat-value">{formatCurrency(stats.monthlyExpenses)}</div>
                <div className="stat-footer">
                  <span className="stat-label">vs last month</span>
                  <span className={`stat-trend ${parseFloat(expenseChangePercent) <= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(expenseChangePercent) <= 0 ? <Icons.TrendingDown /> : <Icons.TrendingUp />}
                    {Math.abs(parseFloat(expenseChangePercent))}%
                  </span>
                </div>
              </div>

              <div className="stat-card glass-effect hover-lift">
                <div className="stat-header">
                  <h3>Savings Rate</h3>
                  <Icons.Flag />
                </div>
                <div className="stat-value">{stats.savingsRate.toFixed(1)}%</div>
                <div className="stat-footer">
                  <span className="stat-label">of monthly income</span>
                  <span className="stat-trend">
                    <span className="savings-bar">
                      <span className="savings-fill" style={{ width: `${stats.savingsRate}%` }}></span>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Income Overview Card */}
            {incomeStats && (
              <div className="income-overview-card glass-effect">
                <div className="card-header">
                  <h2>Annual Overview</h2>
                  <span className="badge">YTD</span>
                </div>
                <div className="income-stats-grid">
                  <div className="income-stat-item">
                    <span className="stat-label">Total Income</span>
                    <span className="stat-value">{formatCompactCurrency(incomeStats.total_annual_income)}</span>
                  </div>
                  <div className="income-stat-item">
                    <span className="stat-label">Monthly Avg</span>
                    <span className="stat-value">{formatCompactCurrency(incomeStats.average_monthly_income)}</span>
                  </div>
                  <div className="income-stat-item">
                    <span className="stat-label">Next Month</span>
                    <span className="stat-value predicted">{formatCompactCurrency(incomeStats.predicted_next_month)}</span>
                  </div>
                  <div className="income-stat-item">
                    <span className="stat-label">Tax Paid</span>
                    <span className="stat-value">{formatCompactCurrency(incomeStats.total_tax_paid)}</span>
                  </div>
                  <div className="income-stat-item highlight">
                    <span className="stat-label">Net Income</span>
                    <span className="stat-value">{formatCompactCurrency(incomeStats.net_annual_income)}</span>
                  </div>
                </div>
                <div className="income-sources">
                  <div className="source-tag">
                    <span>Top source: {incomeStats.top_source_name}</span>
                    <span>{formatCompactCurrency(incomeStats.top_source_amount)}</span>
                  </div>
                  <div className="source-tag">
                    <span>Recurring: {incomeStats.recurring_income_count} sources</span>
                    <span>One-time: {incomeStats.one_time_income_count}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Categories & Recent Activity */}
            <div className="dashboard-grid">
              <div className="categories-section glass-effect">
                <div className="section-header">
                  <h2>Budget Overview</h2>
                  <Link href="/dashboard/budgets" className="view-all">View all →</Link>
                </div>
                <div className="categories-list">
                  {categories.map((category) => (
                    <div key={category.id} className="category-item">
                      <div className="category-info">
                        <span className="category-dot" style={{ backgroundColor: category.color }}></span>
                        <span className="category-name">{category.name}</span>
                      </div>
                      <div className="category-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${category.budget && category.spent ? (category.spent / category.budget * 100) : 0}%`,
                              backgroundColor: category.color 
                            }}
                          ></div>
                        </div>
                        <div className="category-amounts">
                          <span>{formatCompactCurrency(category.spent || 0)}</span>
                          <span className="category-limit">/ {formatCompactCurrency(category.budget || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {stats.budgetStatus && (
                  <div className="budget-summary">
                    <div className="budget-stat">
                      <span className="stat-value">{stats.budgetStatus.onTrack}</span>
                      <span className="stat-label">On track</span>
                    </div>
                    <div className="budget-stat">
                      <span className="stat-value">{stats.budgetStatus.overBudget}</span>
                      <span className="stat-label">Over budget</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="recent-activity-section glass-effect">
                <div className="section-header">
                  <h2>Recent Activity</h2>
                  {recentActivity.length > 0 && (
                    <Link href="/dashboard/transactions" className="view-all">View all →</Link>
                  )}
                </div>
                {recentActivity.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No transactions yet</h3>
                    <p>Add your first transaction to get started</p>
                    <Link href="/dashboard/transactions/add" className="btn-primary">
                      Add Transaction
                    </Link>
                  </div>
                ) : (
                  <div className="activity-timeline">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id} className="timeline-item">
                        <div className={`timeline-icon ${activity.type}`}>
                          {activity.type === 'income' ? '💰' : '💸'}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <h4>{activity.title}</h4>
                            <span className={`timeline-amount ${activity.type}`}>
                              {activity.type === 'income' ? '+' : '-'}
                              {formatCompactCurrency(activity.amount)}
                            </span>
                          </div>
                          <p className="timeline-description">{activity.description}</p>
                          <div className="timeline-footer">
                            <span className="timeline-category">{activity.category}</span>
                            <span className="timeline-time">{activity.time}</span>
                          </div>
                        </div>
                        {index < recentActivity.length - 1 && <div className="timeline-connector"></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <Link href="/dashboard/income/add" className="quick-action-card glass-effect hover-lift">
                  <div className="quick-action-icon income-gradient">
                    <Icons.Income />
                  </div>
                  <span>Add Income</span>
                </Link>
                <Link href="/dashboard/expenses/add" className="quick-action-card glass-effect hover-lift">
                  <div className="quick-action-icon expense-gradient">
                    <Icons.Expenses />
                  </div>
                  <span>Add Expense</span>
                </Link>
                <Link href="/dashboard/budgets/create" className="quick-action-card glass-effect hover-lift">
                  <div className="quick-action-icon budget-gradient">
                    <Icons.Budget />
                  </div>
                  <span>Create Budget</span>
                </Link>
                <button onClick={fetchDashboardData} className="quick-action-card glass-effect hover-lift">
                  <div className="quick-action-icon refresh-gradient">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                  </div>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}