'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import './dashboard.css';
import IncomeExpensePieChart from './components/IncomeExpensePieChart';

// Mock data types
interface FinancialStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

interface RecentActivity {
  id: number;
  title: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Fetch dashboard data
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: FinancialStats = {
        totalBalance: 15420.75,
        monthlyIncome: 32500.00,
        monthlyExpenses: 18750.25,
        savingsRate: 42.3,
      };

      const mockActivity: RecentActivity[] = [
        {
          id: 1,
          title: 'Salary Deposit',
          description: 'Monthly salary from Company XYZ',
          amount: 32500.00,
          type: 'income',
          time: '2 hours ago',
        },
        {
          id: 2,
          title: 'Grocery Shopping',
          description: 'Checkers Hyper',
          amount: 1250.75,
          type: 'expense',
          time: 'Yesterday',
        },
        {
          id: 3,
          title: 'Electricity Bill',
          description: 'Eskom prepaid',
          amount: 850.50,
          type: 'expense',
          time: '2 days ago',
        },
        {
          id: 4,
          title: 'Freelance Payment',
          description: 'Web design project',
          amount: 5500.00,
          type: 'income',
          time: '3 days ago',
        },
        {
          id: 5,
          title: 'Savings Transfer',
          description: 'Monthly savings to investment',
          amount: 5000.00,
          type: 'transfer',
          time: '1 week ago',
        },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    return null; // Will redirect in useEffect
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-logo">💰 SpendWise SA</span>
        </Link>
        
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
            Welcome back, {user.full_name?.split(' ')[0] || 'User'}! 👋
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
                <div className="stat-icon">💰</div>
              </div>
              <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
              <div className="stat-trend trend-positive">
                <span>↑ 5.2% from last month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Monthly Income</h3>
                <div className="stat-icon">📈</div>
              </div>
              <div className="stat-value">{formatCurrency(stats.monthlyIncome)}</div>
              <div className="stat-trend trend-positive">
                <span>↑ 3.1% from last month</span>
              </div>
            </div>
             
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Monthly Expenses</h3>
                <div className="stat-icon">📉</div>
              </div>
              <div className="stat-value">{formatCurrency(stats.monthlyExpenses)}</div>
              <div className="stat-trend trend-negative">
                <span>↓ 2.4% from last month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Savings Rate</h3>
                <div className="stat-icon">🎯</div>
              </div>
              <div className="stat-value">{stats.savingsRate}%</div>
              <div className="stat-trend trend-positive">
                <span>↑ 1.8% from last month</span>
              </div>
            </div>
            
            {/* ✅ ADD THE PIE CHART HERE - Full width below the 4 cards */}
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <IncomeExpensePieChart />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <section className="quick-actions fade-in">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link href="/transactions" className="action-button">
              <div className="action-icon">💳</div>
              <span className="action-label">Add Transaction</span>
            </Link>
            
            <Link href="/budget" className="action-button">
              <div className="action-icon">📊</div>
              <span className="action-label">Set Budget</span>
            </Link>
            
            <Link href="/goals" className="action-button">
              <div className="action-icon">🏆</div>
              <span className="action-label">Set Goals</span>
            </Link>
            
            <Link href="/reports" className="action-button">
              <div className="action-icon">📈</div>
              <span className="action-label">View Reports</span>
            </Link>
            
            <Link href="/profile" className="action-button">
              <div className="action-icon">👤</div>
              <span className="action-label">My Profile</span>
            </Link>
            
            <Link href="/settings" className="action-button">
              <div className="action-icon">⚙️</div>
              <span className="action-label">Settings</span>
            </Link>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity fade-in">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'income' ? '💰' : 
                   activity.type === 'expense' ? '💸' : '🔄'}
                </div>
                <div className="activity-content">
                  <h4 className="activity-title">{activity.title}</h4>
                  <p className="activity-description">{activity.description}</p>
                </div>
                <div className="activity-time">
                  <div style={{ 
                    color: activity.type === 'income' ? '#00C853' : 
                           activity.type === 'expense' ? '#FF3D00' : '#667eea',
                    fontWeight: 600 
                  }}>
                    {activity.type === 'income' ? '+' : activity.type === 'expense' ? '-' : ''}
                    {formatCurrency(activity.amount)}
                  </div>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
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