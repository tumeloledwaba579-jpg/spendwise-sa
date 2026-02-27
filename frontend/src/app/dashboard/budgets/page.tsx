'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Budget, BudgetSummary } from './types';
import BudgetCard from './components/BudgetCard';
import BudgetForm from './components/BudgetForm';
import './budgets.css';

export default function BudgetsPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchBudgets();
    }
  }, [user, authLoading, router]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets?period=monthly`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch budgets');
      
      const data = await response.json();
      setBudgets(data.budgets || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBudget = async (budgetData: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(budgetData)
        }
      );

      if (!response.ok) throw new Error('Failed to create budget');
      
      const newBudget = await response.json();
      setBudgets([...budgets, newBudget]);
      setShowAddModal(false);
      fetchBudgets(); // Refresh summary
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    }
  };

  const handleUpdateBudget = async (id: string, budgetData: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(budgetData)
        }
      );

      if (!response.ok) throw new Error('Failed to update budget');
      
      const updatedBudget = await response.json();
      setBudgets(budgets.map(b => b.id === id ? updatedBudget : b));
      setEditingBudget(null);
      fetchBudgets(); // Refresh summary
    } catch (err) {
      console.error('Error updating budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/budgets/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to delete budget');
      
      setBudgets(budgets.filter(b => b.id !== id));
      fetchBudgets(); // Refresh summary
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
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
        <p>Loading budgets...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-logo">💰 SpendWise SA</span>
        </Link>
        
        <div className="navbar-links">
          <Link href="/dashboard" className="nav-link">📊 Dashboard</Link>
          <Link href="/dashboard/income" className="nav-link">💵 Income</Link>
          <Link href="/dashboard/expenses" className="nav-link">💸 Expenses</Link>
          <Link href="/dashboard/budgets" className="nav-link active">📋 Budgets</Link>
          <Link href="/dashboard/reports" className="nav-link">📈 Reports</Link>
        </div>
        
        <div className="navbar-user">
          <div className="user-avatar">{getInitials(user.full_name || user.email)}</div>
          <span className="user-name">{user.full_name || user.email.split('@')[0]}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="page-header">
          <h1>Budget Planning 📋</h1>
          <p>Set and track monthly budgets for your spending categories.</p>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Create Budget
          </button>
        </div>

        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Budget</h3>
              <p className="summary-value">{formatCurrency(summary.total_budget)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Spent</h3>
              <p className="summary-value">{formatCurrency(summary.total_spent)}</p>
            </div>
            <div className="summary-card">
              <h3>Remaining</h3>
              <p className="summary-value">{formatCurrency(summary.total_remaining)}</p>
            </div>
            <div className="summary-card">
              <h3>Categories</h3>
              <p className="summary-value">{summary.categories_count}</p>
              <p className="summary-sub">
                {summary.on_track_count} on track, {summary.over_budget_count} over
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchBudgets}>Retry</button>
          </div>
        )}

        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Budgets Yet</h3>
            <p>Create your first budget to start tracking your spending.</p>
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={() => setEditingBudget(budget)}
                onDelete={() => handleDeleteBudget(budget.id)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} SpendWise SA</p>
      </footer>

      {showAddModal && (
        <BudgetForm
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBudget}
          formatCurrency={formatCurrency}
        />
      )}

      {editingBudget && (
        <BudgetForm
          budget={editingBudget}
          onClose={() => setEditingBudget(null)}
          onSubmit={(data) => handleUpdateBudget(editingBudget.id, data)}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}