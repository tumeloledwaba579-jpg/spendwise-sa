'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAndValidateArray, postAndValidate, putAndValidate, deleteRequest } from '@/lib/api';
import { AccountSchema, type Account } from '@/lib/schemas';
import './accounts.css';

// Account types with categories
const ACCOUNT_TYPES = {
    ASSETS: [
        { value: 'CHECKING', label: 'Checking Account', icon: 'account_balance_wallet' },
        { value: 'SAVINGS', label: 'Savings Account', icon: 'savings' },
        { value: 'INVESTMENT', label: 'Investment', icon: 'trending_up' },
    ],
    LIABILITIES: [
        { value: 'CREDIT_CARD', label: 'Credit Card', icon: 'credit_card' },
        { value: 'LOAN', label: 'Loan', icon: 'receipt' },
        { value: 'MORTGAGE', label: 'Mortgage', icon: 'home' },
    ],
};

export default function AccountsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        account_type: 'CHECKING',
        balance: '',
        currency: 'ZAR',
        is_active: true,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchAccounts();
        }
    }, [user, authLoading]);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAndValidateArray<Account>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`,
                AccountSchema,
                { credentials: 'include' }
            );
            setAccounts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await postAndValidate<Account>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts/`,
                AccountSchema,
                {
                    name: formData.name,
                    account_type: formData.account_type,
                    balance: parseFloat(formData.balance) || 0,
                    currency: formData.currency,
                    is_active: true,
                },
                { credentials: 'include' }
            );
            await fetchAccounts();
            setShowAddModal(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            account_type: 'CHECKING',
            balance: '',
            currency: 'ZAR',
            is_active: true,
        });
        setEditingAccount(null);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getAccountTypeLabel = (type: string): string => {
        for (const category of Object.values(ACCOUNT_TYPES)) {
            const found = category.find(t => t.value === type);
            if (found) return found.label;
        }
        return type;
    };

    const getAccountIcon = (type: string): string => {
        for (const category of Object.values(ACCOUNT_TYPES)) {
            const found = category.find(t => t.value === type);
            if (found) return found.icon;
        }
        return 'account_balance';
    };

    const isLiability = (type: string): boolean => {
        return ['CREDIT_CARD', 'LOAN', 'MORTGAGE'].includes(type);
    };

    if (authLoading || isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading accounts...</p>
            </div>
        );
    }

    return (
        <div className="accounts-page">
            {/* Top NavBar */}
            <header className="top-navbar">...</header>

            {/* Side NavBar */}
            <aside className="side-navbar">...</aside>

            {/* Main Content */}
            <main className="accounts-main">
                <div className="accounts-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Accounts</h1>
                            <p className="page-description">Manage your assets and liabilities</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <span className="material-symbols-outlined">add</span>
                            Add Account
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                            <button onClick={fetchAccounts}>Retry</button>
                        </div>
                    )}

                    {/* Assets Section */}
                    <div className="section-card">
                        <h2 className="section-title">Assets</h2>
                        <div className="accounts-grid">
                            {accounts.filter(a => !isLiability(a.account_type)).map(account => (
                                <div key={account.id} className="account-card">
                                    <div className="account-icon">
                                        <span className="material-symbols-outlined">
                                            {getAccountIcon(account.account_type)}
                                        </span>
                                    </div>
                                    <div className="account-info">
                                        <h3>{account.name}</h3>
                                        <p>{getAccountTypeLabel(account.account_type)}</p>
                                    </div>
                                    <div className="account-balance positive">
                                        {formatCurrency(account.balance)}
                                    </div>
                                </div>
                            ))}
                            {accounts.filter(a => !isLiability(a.account_type)).length === 0 && (
                                <div className="empty-state">No assets. Add your first account.</div>
                            )}
                        </div>
                    </div>

                    {/* Liabilities Section */}
                    <div className="section-card">
                        <h2 className="section-title">Liabilities</h2>
                        <div className="accounts-grid">
                            {accounts.filter(a => isLiability(a.account_type)).map(account => (
                                <div key={account.id} className="account-card">
                                    <div className="account-icon liability">
                                        <span className="material-symbols-outlined">
                                            {getAccountIcon(account.account_type)}
                                        </span>
                                    </div>
                                    <div className="account-info">
                                        <h3>{account.name}</h3>
                                        <p>{getAccountTypeLabel(account.account_type)}</p>
                                    </div>
                                    <div className="account-balance negative">
                                        -{formatCurrency(account.balance)}
                                    </div>
                                </div>
                            ))}
                            {accounts.filter(a => isLiability(a.account_type)).length === 0 && (
                                <div className="empty-state">No liabilities. You're debt-free!</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Account</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddAccount}>
                            <div className="form-group">
                                <label>Account Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Main Checking, Car Loan"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Account Type *</label>
                                <div className="type-selector">
                                    <div className="type-category">
                                        <strong>Assets (What you own)</strong>
                                        {ACCOUNT_TYPES.ASSETS.map(type => (
                                            <label key={type.value} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="account_type"
                                                    value={type.value}
                                                    checked={formData.account_type === type.value}
                                                    onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                                />
                                                <span className="material-symbols-outlined">{type.icon}</span>
                                                {type.label}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="type-category">
                                        <strong>Liabilities (What you owe)</strong>
                                        {ACCOUNT_TYPES.LIABILITIES.map(type => (
                                            <label key={type.value} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="account_type"
                                                    value={type.value}
                                                    checked={formData.account_type === type.value}
                                                    onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                                />
                                                <span className="material-symbols-outlined">{type.icon}</span>
                                                {type.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Balance (ZAR) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.balance}
                                    onChange={e => setFormData({ ...formData, balance: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                                <p className="field-hint">
                                    For liabilities (credit cards, loans), enter the amount you owe as a positive number.
                                </p>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}