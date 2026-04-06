'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAndValidateArray, fetchAndValidate } from '@/lib/api';
import {
    TransactionSchema,
    CategorySchema,
    AccountSchema,
    IncomeStatsSchema,
    IncomeHistorySchema,
    type Transaction,
    type Category,
    type Account,
    type IncomeStats,
    type IncomeHistory
} from '@/lib/schemas';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line
} from 'recharts';
import './reports.css';

// Types
interface MonthlyData {
    month: string;
    monthNum: number;
    year: number;
    income: number;
    expenses: number;
    savings: number;
}

interface CategorySpending {
    name: string;
    amount: number;
    percentage: number;
    color: string;
}

// Chart colors
const CHART_INCOME = '#1D9E75';
const CHART_EXPENSE = '#D85A30';
const CHART_SAVINGS = '#378ADD';
const CHART_GRID = 'rgba(0,0,0,0.06)';
const CHART_AXIS = '#9a9a94';

const CATEGORY_COLORS = [
    '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
    '#BA7517', '#D4537E', '#0F6E56', '#534AB7'
];

// Tooltip styles
const tooltipStyle = {
    contentStyle: {
        backgroundColor: '#ffffff',
        border: '0.5px solid rgba(0,0,0,0.12)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        fontSize: '13px',
        padding: '10px 14px',
    },
    labelStyle: { fontWeight: 600, color: '#191c1e', marginBottom: 4 },
    cursor: { fill: 'rgba(0,0,0,0.04)' },
};

const axisProps = {
    stroke: 'none',
    tick: { fill: CHART_AXIS, fontSize: 12 },
    tickLine: false,
    axisLine: false,
};

const gridProps = {
    strokeDasharray: '3 3',
    stroke: CHART_GRID,
    vertical: false,
};

const formatTooltipValue = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return 'R0.00';
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
    }).format(value);
};

const formatTooltip = (value: number | undefined): [string, string] => {
    return [formatTooltipValue(value), ''];
};

export default function ReportsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    // Data states
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [incomeHistory, setIncomeHistory] = useState<IncomeHistory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<'overview' | 'categories' | 'trends' | 'insights'>('overview');

    // Chart data states
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
    const [yearlyComparison, setYearlyComparison] = useState<any[]>([]);
    const [topExpenses, setTopExpenses] = useState<Transaction[]>([]);
    const [quarterlyData, setQuarterlyData] = useState<any[]>([]);

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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadReportsData();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && transactions.length > 0 && categories.length > 0 && incomeHistory.length > 0) {
            processChartData();
        }
    }, [selectedYear, transactions, categories, incomeHistory]);

    const loadReportsData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const fetchOptions = {
                credentials: 'include' as RequestCredentials,
                headers: { 'Content-Type': 'application/json' }
            };

            console.log('📊 Fetching reports data...');

            // Fetch categories
            const categoriesData = await fetchAndValidateArray<Category>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/categories/`,
                CategorySchema,
                fetchOptions
            );
            setCategories(categoriesData);
            console.log('✅ Categories loaded:', categoriesData.length);

            // Fetch accounts
            const accountsData = await fetchAndValidateArray<Account>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`,
                AccountSchema,
                fetchOptions
            );
            setAccounts(accountsData);
            console.log('✅ Accounts loaded:', accountsData.length);

            // Fetch transactions (for expenses)
            const transactionsData = await fetchAndValidateArray<Transaction>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?limit=500`,
                TransactionSchema,
                fetchOptions
            );

            // Fetch income history (THIS IS KEY FOR INCOME DATA)
            const incomeHistoryData = await fetchAndValidateArray<IncomeHistory>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/history/?limit=500`,
                IncomeHistorySchema,
                fetchOptions
            );
            setIncomeHistory(incomeHistoryData);
            console.log('✅ Income history loaded:', incomeHistoryData.length);
            console.log('📝 Sample income:', incomeHistoryData[0]);

            // Enrich transactions with category names
            const enrichedTransactions = transactionsData.map(t => ({
                ...t,
                category: categoriesData.find(c => c.id === t.category_id),
                account: accountsData.find(a => a.id === t.account_id)
            }));
            setTransactions(enrichedTransactions);
            console.log('✅ Transactions loaded:', enrichedTransactions.length);

            // Fetch income stats
            const stats = await fetchAndValidate<IncomeStats>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/income/stats/?year=${selectedYear}`,
                IncomeStatsSchema,
                fetchOptions
            );
            setIncomeStats(stats);
            console.log('✅ Income stats loaded');

        } catch (err) {
            console.error('❌ Error loading reports data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const processChartData = () => {
        console.log('📊 Processing chart data for year:', selectedYear);

        // ============================================================
        // Filter expenses from transactions
        // ============================================================
        const yearExpenses = transactions.filter(t => {
            const date = new Date(t.transaction_date);
            return date.getFullYear() === selectedYear && t.transaction_type === 'expense';
        });

        console.log(`📊 Found ${yearExpenses.length} expense transactions for ${selectedYear}`);

        // ============================================================
        // Filter income from incomeHistory
        // ============================================================
        const yearIncome = incomeHistory.filter(inc => {
            const [year] = inc.received_date.split('-').map(Number);
            return year === selectedYear;
        });

        console.log(`💰 Found ${yearIncome.length} income records for ${selectedYear}`);

        // ============================================================
        // Create monthly maps
        // ============================================================
        const monthlyMap = new Map<number, { income: number; expenses: number }>();
        for (let i = 1; i <= 12; i++) {
            monthlyMap.set(i, { income: 0, expenses: 0 });
        }

        // Add income from incomeHistory
        yearIncome.forEach(inc => {
            const [year, month] = inc.received_date.split('-').map(Number);
            const amount = inc.amount;
            const current = monthlyMap.get(month)!;
            monthlyMap.set(month, { ...current, income: current.income + amount });
            console.log(`📈 Added income for month ${month}: R${amount}`);
        });

        // Add expenses from transactions
        yearExpenses.forEach(t => {
            const month = new Date(t.transaction_date).getMonth() + 1;
            const amount = Math.abs(t.amount);
            const current = monthlyMap.get(month)!;
            monthlyMap.set(month, { ...current, expenses: current.expenses + amount });
            console.log(`📉 Added expenses for month ${month}: R${amount}`);
        });

        // ============================================================
        // Build monthly data array
        // ============================================================
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyDataArray: MonthlyData[] = [];
        for (let i = 1; i <= 12; i++) {
            const data = monthlyMap.get(i)!;
            monthlyDataArray.push({
                month: monthNames[i - 1],
                monthNum: i,
                year: selectedYear,
                income: data.income,
                expenses: data.expenses,
                savings: data.income - data.expenses
            });
        }
        setMonthlyData(monthlyDataArray);
        console.log('📊 Monthly data:', monthlyDataArray);

        // ============================================================
        // Category spending (from expenses only)
        // ============================================================
        const categoryMap = new Map<string, number>();
        yearExpenses.forEach(t => {
            const catName = t.category?.name || 'Uncategorized';
            const amount = Math.abs(t.amount);
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + amount);
        });

        const totalSpent = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
        const categoryArray: CategorySpending[] = Array.from(categoryMap.entries())
            .map(([name, amount], index) => ({
                name,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8);

        setCategorySpending(categoryArray);
        console.log('📊 Category spending:', categoryArray);

        // ============================================================
        // Top expenses
        // ============================================================
        const topExpensesArray = yearExpenses
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, 10);
        setTopExpenses(topExpensesArray);

        // ============================================================
        // Yearly comparison (using incomeHistory for income)
        // ============================================================
        const years = [selectedYear - 2, selectedYear - 1, selectedYear];
        const yearlyData = [];
        for (const year of years) {
            // Get income from incomeHistory
            const incomeFromHistory = incomeHistory
                .filter(inc => {
                    const [incYear] = inc.received_date.split('-').map(Number);
                    return incYear === year;
                })
                .reduce((sum, inc) => sum + inc.amount, 0);

            // Get expenses from transactions
            const expensesFromTx = transactions
                .filter(t => {
                    const txYear = new Date(t.transaction_date).getFullYear();
                    return txYear === year && t.transaction_type === 'expense';
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            yearlyData.push({
                year,
                income: incomeFromHistory,
                expenses: expensesFromTx,
                savings: incomeFromHistory - expensesFromTx
            });
        }
        setYearlyComparison(yearlyData);
        console.log('📊 Yearly comparison:', yearlyData);

        // ============================================================
        // Quarterly data
        // ============================================================
        const quarters = [
            { name: 'Q1', months: [1, 2, 3] },
            { name: 'Q2', months: [4, 5, 6] },
            { name: 'Q3', months: [7, 8, 9] },
            { name: 'Q4', months: [10, 11, 12] }
        ];
        const quarterlyArray = quarters.map(q => {
            let income = 0, expenses = 0;
            q.months.forEach(month => {
                const data = monthlyMap.get(month)!;
                income += data.income;
                expenses += data.expenses;
            });
            return { quarter: q.name, income, expenses, savings: income - expenses };
        });
        setQuarterlyData(quarterlyArray);
        console.log('📊 Quarterly data:', quarterlyArray);
    };

    const getTotalIncome = () => monthlyData.reduce((sum, m) => sum + m.income, 0);
    const getTotalExpenses = () => monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const getAverageMonthly = () => {
        const monthsWithData = monthlyData.filter(m => m.expenses > 0).length;
        return monthsWithData === 0 ? 0 : getTotalExpenses() / monthsWithData;
    };
    const getBestMonth = () => {
        const best = [...monthlyData].sort((a, b) => b.savings - a.savings)[0];
        return best ? { month: best.month, savings: best.savings } : null;
    };
    const getWorstMonth = () => {
        const worst = [...monthlyData].sort((a, b) => a.savings - b.savings)[0];
        return worst ? { month: worst.month, savings: worst.savings } : null;
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Description', 'Category', 'Account', 'Amount', 'Type'];
        const rows = transactions.slice(0, 500).map(t => [
            formatDate(t.transaction_date),
            t.description,
            t.category?.name || 'Uncategorized',
            t.account?.name || '—',
            formatCurrency(Math.abs(t.amount)),
            t.transaction_type === 'income' ? 'Income' : 'Expense'
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendwise_report_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (authLoading || isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading reports data...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="reports-page">
            {/* TopNavBar */}
            <header className="top-navbar">
                <nav className="top-navbar-container">
                    <div className="top-navbar-left">
                        <Link href="/dashboard" className="brand">FinTrackSA</Link>
                        <div className="nav-links">
                            <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            <Link href="/dashboard/income" className="nav-link">Income</Link>
                            <Link href="/dashboard/expenses" className="nav-link">Expenses</Link>
                            <Link href="/dashboard/budgets" className="nav-link">Budgets</Link>
                            <Link href="/dashboard/reports" className="nav-link active">Reports</Link>
                        </div>
                    </div>
                    <div className="top-navbar-right">
                        <button className="icon-button"><span className="material-symbols-outlined">notifications</span></button>
                        <button className="icon-button"><span className="material-symbols-outlined">settings</span></button>
                        <div className="user-avatar"><div className="avatar-initials">{getInitials(user.full_name || user.email)}</div></div>
                    </div>
                </nav>
            </header>

            {/* SideNavBar */}
            <aside className="side-navbar">
                <div className="side-navbar-header"><h2>Reports & Analytics</h2><p>Financial Insights</p></div>
                <nav className="side-nav-links">
                    <Link href="/dashboard" className="side-nav-link"><span className="material-symbols-outlined">dashboard</span>Overview</Link>
                    <Link href="/dashboard/income" className="side-nav-link"><span className="material-symbols-outlined">trending_up</span>Income</Link>
                    <Link href="/dashboard/expenses" className="side-nav-link"><span className="material-symbols-outlined">trending_down</span>Expenses</Link>
                    <Link href="/dashboard/budgets" className="side-nav-link"><span className="material-symbols-outlined">receipt</span>Budgets</Link>
                    <Link href="/dashboard/reports" className="side-nav-link active"><span className="material-symbols-outlined">analytics</span>Reports</Link>
                </nav>
                <button className="export-data-btn" onClick={handleExportCSV}><span className="material-symbols-outlined">download</span>Export CSV</button>
            </aside>

            {/* Main Content */}
            <main className="reports-main">
                <div className="reports-content">
                    {/* Header */}
                    <div className="page-header">
                        <div><h1 className="page-title">Financial Reports</h1><p className="page-description">Analyze your spending patterns, track trends, and gain insights into your financial health.</p></div>
                        <div className="header-controls">
                            <select className="year-select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                                <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                                <option value={new Date().getFullYear() - 3}>{new Date().getFullYear() - 3}</option>
                            </select>
                            <button className="btn-outline" onClick={handleExportCSV}><span className="material-symbols-outlined">download</span>Export</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="view-tabs">
                        <button className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`} onClick={() => setViewMode('overview')}><span className="material-symbols-outlined">dashboard</span>Overview</button>
                        <button className={`tab-btn ${viewMode === 'categories' ? 'active' : ''}`} onClick={() => setViewMode('categories')}><span className="material-symbols-outlined">pie_chart</span>Categories</button>
                        <button className={`tab-btn ${viewMode === 'trends' ? 'active' : ''}`} onClick={() => setViewMode('trends')}><span className="material-symbols-outlined">trending_up</span>Trends</button>
                        <button className={`tab-btn ${viewMode === 'insights' ? 'active' : ''}`} onClick={() => setViewMode('insights')}><span className="material-symbols-outlined">insights</span>Insights</button>
                    </div>

                    {error && <div className="error-message"><p>{error}</p><button onClick={loadReportsData}>Retry</button></div>}

                    {/* OVERVIEW VIEW */}
                    {viewMode === 'overview' && (
                        <>
                            <div className="summary-cards-grid">
                                <div className="summary-card"><div className="summary-card-header"><span className="summary-card-icon income-icon"><span className="material-symbols-outlined">account_balance_wallet</span></span><span className="summary-card-label">Total Income</span></div><div className="summary-card-value">{formatCompactCurrency(getTotalIncome())}</div><div className="summary-card-footer">{selectedYear}</div></div>
                                <div className="summary-card"><div className="summary-card-header"><span className="summary-card-icon expense-icon"><span className="material-symbols-outlined">shopping_cart</span></span><span className="summary-card-label">Total Expenses</span></div><div className="summary-card-value">{formatCompactCurrency(getTotalExpenses())}</div><div className="summary-card-footer">{selectedYear}</div></div>
                                <div className="summary-card"><div className="summary-card-header"><span className="summary-card-icon net-icon"><span className="material-symbols-outlined">savings</span></span><span className="summary-card-label">Net Savings</span></div><div className="summary-card-value positive">{formatCompactCurrency(getTotalIncome() - getTotalExpenses())}</div><div className="summary-card-footer">Income - Expenses</div></div>
                                <div className="summary-card"><div className="summary-card-header"><span className="summary-card-icon avg-icon"><span className="material-symbols-outlined">show_chart</span></span><span className="summary-card-label">Avg Monthly</span></div><div className="summary-card-value">{formatCompactCurrency(getAverageMonthly())}</div><div className="summary-card-footer">Average expenses</div></div>
                            </div>

                            {/* Monthly Bar Chart */}
                            <div className="chart-card">
                                <div className="chart-header"><h2>Monthly Income vs Expenses</h2><p>Compare your income and spending throughout the year</p></div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="35%">
                                            <CartesianGrid {...gridProps} />
                                            <XAxis dataKey="month" {...axisProps} />
                                            <YAxis {...axisProps} tickFormatter={formatCompactCurrency} width={72} />
                                            <Tooltip {...tooltipStyle} formatter={formatTooltip} />
                                            <Legend iconType="square" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: CHART_AXIS }}>{value}</span>} />
                                            <Bar dataKey="income" name="Income" fill={CHART_INCOME} radius={[4, 4, 0, 0]} isAnimationActive animationEasing="ease-out" />
                                            <Bar dataKey="expenses" name="Expenses" fill={CHART_EXPENSE} radius={[4, 4, 0, 0]} isAnimationActive animationEasing="ease-out" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Quarterly Performance */}
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h2>Quarterly Performance</h2>
                                    <p>How your net savings trend across the year</p>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={quarterlyData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                                            <CartesianGrid {...gridProps} />
                                            <XAxis dataKey="quarter" {...axisProps} tick={{ fill: CHART_AXIS, fontSize: 13, fontWeight: 500 }} />
                                            <YAxis {...axisProps} tickFormatter={formatCompactCurrency} width={70} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
                                            <Tooltip {...tooltipStyle} formatter={formatTooltip} labelFormatter={(label) => `${label}`} />
                                            <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: CHART_AXIS }}>{value}</span>} />
                                            <defs>
                                                <linearGradient id="quarterGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_SAVINGS} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={CHART_SAVINGS} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="savings" stroke="none" fill="url(#quarterGradient)" isAnimationActive />
                                            <Line type="monotone" dataKey="savings" name="Net Savings" stroke={CHART_SAVINGS} strokeWidth={3} dot={{ fill: CHART_SAVINGS, r: 6, strokeWidth: 0 }} activeDot={{ r: 8, fill: CHART_SAVINGS }} isAnimationActive animationEasing="ease-out" connectNulls />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="quarterly-table">
                                    <div className="quarterly-table-header"><span>Quarter</span><span>Income</span><span>Expenses</span><span>Net Savings</span></div>
                                    {quarterlyData.map((q: any) => (
                                        <div key={q.quarter} className="quarterly-table-row">
                                            <span className="quarter-label">{q.quarter}</span>
                                            <span className="income-value">{formatCompactCurrency(q.income)}</span>
                                            <span className="expense-value">{formatCompactCurrency(q.expenses)}</span>
                                            <span className={`net-value ${q.savings >= 0 ? 'positive' : 'negative'}`}>{q.savings >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(q.savings))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Best & Worst Months */}
                            <div className="insights-grid">
                                <div className="insight-card"><div className="insight-icon">🏆</div><h3>Best Month</h3>{getBestMonth() ? (<><div className="insight-value">{getBestMonth()?.month ?? '—'}</div><div className="insight-amount positive">Saved {formatCurrency(getBestMonth()?.savings ?? 0)}</div></>) : (<p>No data available</p>)}</div>
                                <div className="insight-card"><div className="insight-icon">⚠️</div><h3>Worst Month</h3>{getWorstMonth() ? (<><div className="insight-value">{getWorstMonth()?.month ?? '—'}</div><div className="insight-amount negative">{(getWorstMonth()?.savings ?? 0) < 0 ? `Lost ${formatCurrency(Math.abs(getWorstMonth()?.savings ?? 0))}` : `Saved ${formatCurrency(getWorstMonth()?.savings ?? 0)}`}</div></>) : (<p>No data available</p>)}</div>
                                <div className="insight-card"><div className="insight-icon">📈</div><h3>Savings Rate</h3><div className="insight-value">{getTotalIncome() > 0 ? ((getTotalIncome() - getTotalExpenses()) / getTotalIncome() * 100).toFixed(1) : 0}%</div><div className="insight-amount">of total income</div></div>
                            </div>
                        </>
                    )}

                    {/* CATEGORIES VIEW */}
                    {viewMode === 'categories' && (
                        <>
                            <div className="chart-card">
                                <div className="chart-header"><h2>Spending by Category</h2><p>See where your money goes</p></div>
                                <div className="two-column-layout">
                                    <div className="pie-chart-container">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <PieChart>
                                                <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="amount" paddingAngle={2} isAnimationActive animationEasing="ease-out" label={false} labelLine={false}>
                                                    {categorySpending.map((_, i) => (<Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} strokeWidth={0} />))}
                                                </Pie>
                                                <Tooltip {...tooltipStyle} formatter={formatTooltip} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="category-list">
                                        <h3>Category Breakdown</h3>
                                        {categorySpending.map((cat) => (
                                            <div key={cat.name} className="category-item">
                                                <div className="category-info"><span className="category-dot" style={{ backgroundColor: cat.color }}></span><span className="category-name">{cat.name}</span></div>
                                                <div className="category-stats"><span className="category-amount">{formatCompactCurrency(cat.amount)}</span><span className="category-percentage">{cat.percentage.toFixed(1)}%</span></div>
                                            </div>
                                        ))}
                                        {categorySpending.length === 0 && <p className="no-data">No expense data for {selectedYear}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Top Expenses Table */}
                            <div className="chart-card">
                                <div className="chart-header"><h2>Top 10 Expenses</h2><p>Your largest transactions this year</p></div>
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
                                        <tbody>
                                            {topExpenses.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td>{formatDate(expense.transaction_date)}</td>
                                                    <td>{expense.description}</td>
                                                    <td><span className="category-badge">{expense.category?.name || 'Uncategorized'}</span></td>
                                                    <td className="amount-negative">{formatCurrency(Math.abs(expense.amount))}</td>
                                                </tr>
                                            ))}
                                            {topExpenses.length === 0 && <tr><td colSpan={4} className="no-data">No expense data for {selectedYear}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TRENDS VIEW */}
                    {viewMode === 'trends' && (
                        <>
                            <div className="chart-card">
                                <div className="chart-header"><h2>Year-over-Year Comparison</h2><p>Track your financial progress across years</p></div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={yearlyComparison} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid {...gridProps} />
                                            <XAxis dataKey="year" {...axisProps} />
                                            <YAxis {...axisProps} tickFormatter={formatCompactCurrency} width={72} />
                                            <Tooltip {...tooltipStyle} formatter={formatTooltip} />
                                            <Legend iconType="square" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: CHART_AXIS }}>{value}</span>} />
                                            <Bar dataKey="income" name="Income" fill={CHART_INCOME} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="expenses" name="Expenses" fill={CHART_EXPENSE} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="savings" name="Savings" fill={CHART_SAVINGS} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header"><h2>Monthly Spending Trend</h2><p>How your spending patterns change throughout the year</p></div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_INCOME} stopOpacity={0.15} /><stop offset="95%" stopColor={CHART_INCOME} stopOpacity={0} /></linearGradient>
                                                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_EXPENSE} stopOpacity={0.15} /><stop offset="95%" stopColor={CHART_EXPENSE} stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid {...gridProps} />
                                            <XAxis dataKey="month" {...axisProps} />
                                            <YAxis {...axisProps} tickFormatter={formatCompactCurrency} width={72} />
                                            <Tooltip {...tooltipStyle} formatter={formatTooltip} />
                                            <Legend iconType="square" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: CHART_AXIS }}>{value}</span>} />
                                            <Area type="monotone" dataKey="income" name="Income" stroke={CHART_INCOME} strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive animationEasing="ease-out" />
                                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke={CHART_EXPENSE} strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive animationEasing="ease-out" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {/* INSIGHTS VIEW */}
                    {viewMode === 'insights' && incomeStats && (
                        <>
                            <div className="chart-card">
                                <div className="chart-header"><h2>Income Summary</h2><p>Your earnings at a glance</p></div>
                                <div className="insights-stats-grid">
                                    <div className="insight-stat"><span className="stat-label">Total Annual Income</span><span className="stat-value positive">{formatCurrency(incomeStats.total_annual_income)}</span></div>
                                    <div className="insight-stat"><span className="stat-label">Average Monthly</span><span className="stat-value">{formatCurrency(incomeStats.average_monthly_income)}</span></div>
                                    <div className="insight-stat"><span className="stat-label">Tax Paid</span><span className="stat-value negative">{formatCurrency(incomeStats.total_tax_paid)}</span></div>
                                    <div className="insight-stat"><span className="stat-label">Net Annual</span><span className="stat-value positive">{formatCurrency(incomeStats.net_annual_income)}</span></div>
                                    <div className="insight-stat"><span className="stat-label">Top Source</span><span className="stat-value">{incomeStats.top_source_name}</span></div>
                                    <div className="insight-stat"><span className="stat-label">Top Amount</span><span className="stat-value positive">{formatCurrency(incomeStats.top_source_amount)}</span></div>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header"><h2>Source Breakdown</h2><p>Recurring vs One-time Income</p></div>
                                <div className="source-breakdown">
                                    <div className="source-stat"><div className="source-label">Recurring Sources</div><div className="source-count">{incomeStats.recurring_income_count}</div><div className="source-percent">{((incomeStats.recurring_income_count / (incomeStats.recurring_income_count + incomeStats.one_time_income_count)) * 100).toFixed(0)}%</div></div>
                                    <div className="source-stat"><div className="source-label">One-time Sources</div><div className="source-count">{incomeStats.one_time_income_count}</div><div className="source-percent">{((incomeStats.one_time_income_count / (incomeStats.recurring_income_count + incomeStats.one_time_income_count)) * 100).toFixed(0)}%</div></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}