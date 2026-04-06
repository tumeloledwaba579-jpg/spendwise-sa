'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './transactions.css';

// Types
interface Transaction {
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_id: string | null;
    account_id: string;
    notes: string | null;
    is_recurring: boolean;
    transaction_type: string;
    category?: Category;
    account?: Account;
}

interface Category {
    id: string;
    name: string;
    category_type: string;
    color?: string;
    icon?: string;
}

interface Account {
    id: string;
    name: string;
    account_type: string;
    balance: number;
    currency: string;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    // Data states
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true); // ✅ NEW: Track initial load
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [dateRange, setDateRange] = useState('30days');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Edit form state
    const [editForm, setEditForm] = useState({
        amount: '',
        description: '',
        category_id: '',
        account_id: '',
        transaction_date: '',
        notes: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Summary stats
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [netChange, setNetChange] = useState(0);

    // ✅ Ref to track if initial load has been done
    const initialLoadDone = useRef(false);

    // ✅ Effect 1: Authentication and initial data loading
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user && !initialLoadDone.current) {
            initialLoadDone.current = true;
            loadInitialData();
        }
    }, [user, authLoading, router]);

    // ✅ Effect 2: Fetch transactions when filters change OR when initial data is ready
    useEffect(() => {
        if (user && categories.length > 0 && accounts.length > 0 && !isInitializing) {
            console.log('🔄 Fetching transactions with filters:', {
                currentPage,
                dateRange,
                selectedCategory,
                selectedAccount,
                selectedType,
                searchTerm
            });
            fetchTransactions();
        }
    }, [currentPage, dateRange, selectedCategory, selectedAccount, selectedType, searchTerm, categories, accounts, user]);

    // Add this useEffect to reset loading if stuck
    useEffect(() => {
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                console.warn('⚠️ Loading stuck for 10 seconds, resetting...');
                setIsLoading(false);
                setError('Loading took too long. Please try refreshing.');
            }
        }, 10000);

        return () => clearTimeout(safetyTimeout);
    }, [isLoading]);

    const loadInitialData = async () => {
        setIsInitializing(true);
        setError(null);

        try {
            const fetchOptions = {
                credentials: 'include' as RequestCredentials,
                headers: { 'Content-Type': 'application/json' }
            };

            console.log('📡 Loading categories and accounts...');

            const [categoriesRes, accountsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/categories/`, fetchOptions),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`, fetchOptions)
            ]);

            if (categoriesRes.ok) {
                const data = await categoriesRes.json();
                setCategories(data);
                console.log('✅ Categories loaded:', data.length);
            } else {
                console.warn('⚠️ Failed to load categories:', categoriesRes.status);
            }

            if (accountsRes.ok) {
                const data = await accountsRes.json();
                setAccounts(data);
                console.log('✅ Accounts loaded:', data.length);
            } else {
                console.warn('⚠️ Failed to load accounts:', accountsRes.status);
            }

        } catch (err) {
            console.error('❌ Error loading initial data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load initial data');
        } finally {
            setIsInitializing(false);
        }
    };

    // Add a ref to track if we've tried to load
    const fetchAttempted = useRef(false);

    const fetchTransactions = async () => {
        // Allow reset if stuck
        if (isLoading && fetchAttempted.current) {
            console.log('⚠️ Stuck in loading state, resetting...');
            setIsLoading(false);
            fetchAttempted.current = false;
            return;
        }

        if (isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }

        fetchAttempted.current = true;
        console.log('🔄 Starting fetchTransactions...');
        setIsLoading(true);
        setError(null);

        try {
            const fetchOptions = {
                credentials: 'include' as RequestCredentials,
                headers: { 'Content-Type': 'application/json' }
            };

            const params = new URLSearchParams();

            // Date range logic
            let startDate = '';
            let endDate = '';
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();

            switch (dateRange) {
                case '7days':
                    startDate = new Date(today.setDate(today.getDate() - 7)).toISOString();
                    endDate = new Date().toISOString();
                    break;
                case '30days':
                    startDate = new Date(today.setDate(today.getDate() - 30)).toISOString();
                    endDate = new Date().toISOString();
                    break;
                case '90days':
                    startDate = new Date(today.setDate(today.getDate() - 90)).toISOString();
                    endDate = new Date().toISOString();
                    break;
                case 'thisMonth':
                    startDate = new Date(currentYear, currentMonth, 1).toISOString();
                    endDate = new Date().toISOString();
                    break;
                case 'lastMonth':
                    startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
                    endDate = new Date(currentYear, currentMonth, 0).toISOString();
                    break;
                default:
                    break;
            }

            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (selectedAccount) params.append('account_id', selectedAccount);
            if (selectedType) params.append('transaction_type', selectedType);
            if (searchTerm) params.append('search', searchTerm);

            params.append('skip', ((currentPage - 1) * itemsPerPage).toString());
            params.append('limit', itemsPerPage.toString());

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?${params.toString()}`;
            console.log('📡 Fetching URL:', url);

            const response = await fetch(url, fetchOptions);
            console.log('📊 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to fetch transactions: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Received transactions:', data.length);

            // Enrich transactions
            const enrichedTransactions = data.map((t: Transaction) => ({
                ...t,
                category: categories.find(c => c.id === t.category_id),
                account: accounts.find(a => a.id === t.account_id)
            }));

            setTransactions(enrichedTransactions);
            setTotalItems(enrichedTransactions.length);

            // Calculate summary stats
            const income = enrichedTransactions
                .filter((t: Transaction) => t.transaction_type === 'income')
                .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
            const expenses = enrichedTransactions
                .filter((t: Transaction) => t.transaction_type === 'expense')
                .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

            setTotalIncome(income);
            setTotalExpenses(expenses);
            setNetChange(income - expenses);

            console.log('💰 Stats - Income:', income, 'Expenses:', expenses);

        } catch (err) {
            console.error('🔴 Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load transactions');
        } finally {
            console.log('🏁 Setting isLoading to false');
            setIsLoading(false);
            fetchAttempted.current = false;
        }
    };

    const handleEditClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setEditForm({
            amount: Math.abs(transaction.amount).toString(),
            description: transaction.description,
            category_id: transaction.category_id || '',
            account_id: transaction.account_id,
            transaction_date: transaction.transaction_date.split('T')[0],
            notes: transaction.notes || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTransaction) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const fetchOptions = {
                credentials: 'include' as RequestCredentials,
                headers: { 'Content-Type': 'application/json' }
            };

            const updateData = {
                amount: selectedTransaction.transaction_type === 'income'
                    ? Math.abs(parseFloat(editForm.amount))
                    : -Math.abs(parseFloat(editForm.amount)),
                description: editForm.description,
                category_id: editForm.category_id || null,
                account_id: editForm.account_id,
                transaction_date: new Date(editForm.transaction_date).toISOString(),
                notes: editForm.notes || null,
                is_recurring: selectedTransaction.is_recurring
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedTransaction.id}/`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update transaction');
            }

            setShowEditModal(false);
            setSelectedTransaction(null);
            fetchTransactions();

        } catch (err) {
            console.error('Error updating transaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to update transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowDeleteModal(true);
    };

    const handleDeleteTransaction = async () => {
        if (!selectedTransaction) return;

        setIsSubmitting(true);
        try {
            const fetchOptions = {
                credentials: 'include' as RequestCredentials,
                headers: { 'Content-Type': 'application/json' }
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedTransaction.id}/`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete transaction');
            }

            setShowDeleteModal(false);
            setSelectedTransaction(null);
            fetchTransactions();

        } catch (err) {
            console.error('Error deleting transaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetFilters = () => {
        setDateRange('30days');
        setSelectedCategory('');
        setSelectedAccount('');
        setSelectedType('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        alert('Export to CSV coming soon!');
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getCategoryBadgeClass = (categoryName: string): string => {
        if (categoryName === 'Income') return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
        return 'bg-surface-container-high text-on-surface-variant';
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // ✅ Show initial loading state
    if (authLoading || isInitializing) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading your data...</p>
                <p className="loading-subtext">Please wait while we load categories and accounts</p>
            </div>
        );
    }

    // ✅ Show transactions loading state
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="transactions-page">
            {/* TopNavBar */}
            <header className="top-navbar">
                <nav className="top-navbar-container">
                    <div className="top-navbar-left">
                        <Link href="/dashboard" className="brand">
                            FinTrackSA
                        </Link>
                        <div className="nav-links">
                            <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            <Link href="/dashboard/transactions" className="nav-link active">Ledger</Link>
                            <Link href="/dashboard/reports" className="nav-link">Reports</Link>
                            <Link href="/dashboard/assets" className="nav-link">Assets</Link>
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
                                {user ? getInitials(user.full_name || user.email) : 'U'}
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* SideNavBar */}
            <aside className="side-navbar">
                <div className="side-navbar-header">
                    <h2>Institutional Ledger</h2>
                    <p>Managed Assets</p>
                </div>
                <nav className="side-nav-links">
                    <Link href="/dashboard/accounts" className="side-nav-link">
                        <span className="material-symbols-outlined">account_balance</span>
                        <span>Accounts</span>
                    </Link>
                    <Link href="/dashboard/transactions" className="side-nav-link active">
                        <span className="material-symbols-outlined">list_alt</span>
                        <span>Transactions</span>
                    </Link>
                    <Link href="/dashboard/budgets" className="side-nav-link">
                        <span className="material-symbols-outlined">payments</span>
                        <span>Budgets</span>
                    </Link>
                    <Link href="/dashboard/tax" className="side-nav-link">
                        <span className="material-symbols-outlined">receipt_long</span>
                        <span>Tax Center</span>
                    </Link>
                    <Link href="/dashboard/support" className="side-nav-link">
                        <span className="material-symbols-outlined">contact_support</span>
                        <span>Support</span>
                    </Link>
                </nav>
                <button className="export-data-btn" onClick={handleExportCSV}>
                    Export Data
                </button>
                <div className="logout-section">
                    <button className="logout-btn" onClick={() => router.push('/login')}>
                        <span className="material-symbols-outlined">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="transactions-main">
                <div className="transactions-content">
                    {/* Header Section */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">View Ledger</h1>
                            <p className="page-description">Comprehensive historical transaction record for institutional accounts.</p>
                        </div>
                        <button className="export-csv-btn" onClick={handleExportCSV}>
                            <span className="material-symbols-outlined">download</span>
                            Export CSV
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="summary-cards-grid">
                        <div className="summary-card">
                            <div className="summary-card-header">
                                <span className="summary-card-icon income-icon">
                                    <span className="material-symbols-outlined">trending_up</span>
                                </span>
                                <span className="summary-card-label">Total Income</span>
                            </div>
                            <div className="summary-card-value">{formatCurrency(totalIncome)}</div>
                            <div className="summary-card-footer">Updated today</div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-header">
                                <span className="summary-card-icon expense-icon">
                                    <span className="material-symbols-outlined">trending_down</span>
                                </span>
                                <span className="summary-card-label">Total Expense</span>
                            </div>
                            <div className="summary-card-value">{formatCurrency(totalExpenses)}</div>
                            <div className="summary-card-footer">{totalItems} Active entries</div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-header">
                                <span className="summary-card-icon net-icon">
                                    <span className="material-symbols-outlined">balance</span>
                                </span>
                                <span className="summary-card-label">Net Change</span>
                            </div>
                            <div className={`summary-card-value ${netChange >= 0 ? 'positive' : 'negative'}`}>
                                {netChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netChange))}
                            </div>
                            <div className="summary-card-footer">Surplus trend</div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-header">
                                <span className="summary-card-icon transactions-icon">
                                    <span className="material-symbols-outlined">receipt</span>
                                </span>
                                <span className="summary-card-label">Transactions</span>
                            </div>
                            <div className="summary-card-value">{totalItems}</div>
                            <div className="summary-card-footer">Last 30 days</div>
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
                                    onChange={(e) => setDateRange(e.target.value)}
                                >
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="90days">Last 90 days</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="lastMonth">Last Month</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Category</label>
                                <select
                                    className="filter-select"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Account</label>
                                <select
                                    className="filter-select"
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                >
                                    <option value="">All Accounts</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Type</label>
                                <select
                                    className="filter-select"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    <option value="income">Credit</option>
                                    <option value="expense">Debit</option>
                                </select>
                            </div>

                            <div className="filter-group search-group">
                                <label>Search</label>
                                <div className="search-input-wrapper">
                                    <span className="search-icon material-symbols-outlined">search</span>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Description or reference..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="filter-footer">
                            <button className="reset-filters-btn" onClick={handleResetFilters}>
                                Reset Filters
                            </button>
                            <span className="filter-count">Refining {totalItems} entries</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                            <button onClick={fetchTransactions}>Retry</button>
                        </div>
                    )}

                    {/* Transactions Table */}
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
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="empty-state">
                                            <div className="empty-icon">📭</div>
                                            <p>No transactions found</p>
                                            <p className="empty-hint">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="transaction-row">
                                            <td className="date-cell">{formatDate(tx.transaction_date)}</td>
                                            <td className="description-cell">{tx.description}</td>
                                            <td>
                                                <span className={`category-badge ${getCategoryBadgeClass(tx.category?.name || '')}`}>
                                                    {tx.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="account-cell">{tx.account?.name || '—'}</td>
                                            <td className={`amount-cell ${tx.transaction_type === 'income' ? 'income' : 'expense'}`}>
                                                {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                            </td>
                                            <td className="actions-cell">
                                                <div className="action-buttons">
                                                    <button
                                                        className="edit-btn"
                                                        title="Edit"
                                                        onClick={() => handleEditClick(tx)}
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        title="Delete"
                                                        onClick={() => handleDeleteClick(tx)}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <div className="pagination">
                            <div className="pagination-info">
                                Showing <span className="font-bold">{startItem}-{endItem}</span> of <span className="font-bold">{totalItems}</span> transactions
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-prev"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                    Prev
                                </button>
                                <div className="pagination-pages">
                                    <span className="current-page">{currentPage}</span>
                                    <span className="total-pages">of {totalPages}</span>
                                </div>
                                <button
                                    className="pagination-next"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Transaction Modal */}
            {showEditModal && selectedTransaction && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Transaction</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleUpdateTransaction}>
                            <div className="form-group">
                                <label>Amount (ZAR) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={editForm.transaction_date}
                                    onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={editForm.category_id}
                                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                                >
                                    <option value="">Uncategorized</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Account *</label>
                                <select
                                    value={editForm.account_id}
                                    onChange={(e) => setEditForm({ ...editForm, account_id: e.target.value })}
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
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    rows={3}
                                />
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
                                    {isSubmitting ? 'Updating...' : 'Update Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTransaction && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>

                        <div className="delete-confirm-content">
                            <p>Are you sure you want to delete this transaction?</p>
                            <p className="warning-text">This action cannot be undone.</p>
                            {selectedTransaction && (
                                <div className="delete-preview">
                                    <p><strong>{selectedTransaction.description}</strong></p>
                                    <p>{formatCurrency(Math.abs(selectedTransaction.amount))}</p>
                                    <p>{formatDate(selectedTransaction.transaction_date)}</p>
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
                                onClick={handleDeleteTransaction}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}