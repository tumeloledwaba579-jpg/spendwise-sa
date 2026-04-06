'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './Navbar.css';

interface NavLink {
    href: string;
    label: string;
    icon: string;
}

const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/income', label: 'Income', icon: 'trending_up' },
    { href: '/dashboard/expenses', label: 'Expenses', icon: 'trending_down' },
    { href: '/dashboard/budgets', label: 'Budgets', icon: 'receipt' },
    { href: '/dashboard/reports', label: 'Reports', icon: 'analytics' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <Link href="/dashboard" className="navbar-brand">
                    <span className="brand-flag">🇿🇦</span>
                    <span className="brand-name">SpendWise<span className="brand-sa">SA</span></span>
                </Link>

                <nav className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            <span className="material-symbols-outlined">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="navbar-actions">
                    <button className="icon-button">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="user-menu">
                        <div className="user-avatar">
                            {user ? getInitials(user.full_name || user.email) : 'U'}
                        </div>
                        <div className="user-dropdown">
                            <span className="user-name">{user?.full_name || user?.email?.split('@')[0]}</span>
                            <span className="user-email">{user?.email}</span>
                            <div className="dropdown-divider"></div>
                            <button onClick={logout} className="dropdown-item">
                                <span className="material-symbols-outlined">logout</span>
                                <span>Sign out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}