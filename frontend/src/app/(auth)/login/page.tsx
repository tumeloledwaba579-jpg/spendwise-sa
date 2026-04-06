'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left panel ── */}
      <aside className="auth-left">
        <div className="auth-left-grid" />

        <div className="auth-brand">
          <div className="auth-brand-name">FinTrackSA</div>
          <div className="auth-brand-tagline">Personal Finance</div>
        </div>

        <div className="auth-left-body">
          <h1 className="auth-left-headline">
            Your money,<br />
            <em>finally</em> under<br />
            control.
          </h1>
          <p className="auth-left-desc">
            Track income, manage expenses, set budgets, and understand where
            every rand goes — all in one place.
          </p>

          <div className="auth-features">
            {[
              'Automated income tracking',
              'Smart expense categorisation',
              'Budget alerts & forecasting',
              'South African Rand native',
            ].map(f => (
              <div key={f} className="auth-feature">
                <div className="auth-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="auth-stat">
            <span className="auth-stat-value">R0</span>
            <span className="auth-stat-label">Hidden fees</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">100%</span>
            <span className="auth-stat-label">Private</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">ZAR</span>
            <span className="auth-stat-label">Native currency</span>
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">
              Don't have an account?{' '}
              <Link href="/register">Create one free</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error-banner" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon material-symbols-outlined">mail</span>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon material-symbols-outlined">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me / Forgot */}
            <div className="auth-extras">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

        </div>
      </div>

    </div>
  );
}