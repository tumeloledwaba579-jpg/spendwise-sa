'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import '../auth.css';

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(pw: string): { level: PasswordStrength; score: number; label: string } {
  if (pw.length === 0) return { level: 'weak', score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 'weak', score: 1, label: 'Weak' };
  if (score === 2) return { level: 'fair', score: 2, label: 'Fair' };
  if (score === 3) return { level: 'good', score: 3, label: 'Good' };
  return { level: 'strong', score: 4, label: 'Strong' };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const pwStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email address.';

    if (formData.password.length < 8)
      errors.password = 'Password must be at least 8 characters.';

    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.';

    if (!formData.agreeToTerms)
      errors.agreeToTerms = 'You must agree to the terms to continue.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await register({
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        password: formData.password,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: string) => ({
    onChange: () => {
      if (fieldErrors[key]) {
        setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    },
  });

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
            Start taking<br />
            <em>control</em> of<br />
            your finances.
          </h1>
          <p className="auth-left-desc">
            Join thousands of South Africans who track their spending, grow
            their savings, and plan their financial future with FinTrackSA.
          </p>

          <div className="auth-features">
            {[
              'Set up in under 3 minutes',
              'Link multiple bank accounts',
              'Automatic category detection',
              'Monthly insights & reports',
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
            <span className="auth-stat-value">Free</span>
            <span className="auth-stat-label">Forever plan</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">ZAR</span>
            <span className="auth-stat-label">Native currency</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">100%</span>
            <span className="auth-stat-label">Your data</span>
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error-banner" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Name row */}
            <div className="auth-field-row">
              <div className="auth-field">
                <label htmlFor="firstName">First name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">person</span>
                  <input
                    id="firstName"
                    type="text"
                    className="auth-input"
                    placeholder="Thabo"
                    value={formData.firstName}
                    onChange={e => {
                      setFormData({ ...formData, firstName: e.target.value });
                      field('firstName').onChange();
                    }}
                    autoComplete="given-name"
                  />
                </div>
                {fieldErrors.firstName && (
                  <span className="auth-field-error">{fieldErrors.firstName}</span>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="lastName">Last name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon material-symbols-outlined">person</span>
                  <input
                    id="lastName"
                    type="text"
                    className="auth-input"
                    placeholder="Nkosi"
                    value={formData.lastName}
                    onChange={e => {
                      setFormData({ ...formData, lastName: e.target.value });
                      field('lastName').onChange();
                    }}
                    autoComplete="family-name"
                  />
                </div>
                {fieldErrors.lastName && (
                  <span className="auth-field-error">{fieldErrors.lastName}</span>
                )}
              </div>
            </div>

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
                  onChange={e => {
                    setFormData({ ...formData, email: e.target.value });
                    field('email').onChange();
                  }}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <span className="auth-field-error">{fieldErrors.email}</span>
              )}
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
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={e => {
                    setFormData({ ...formData, password: e.target.value });
                    field('password').onChange();
                  }}
                  autoComplete="new-password"
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
              {fieldErrors.password && (
                <span className="auth-field-error">{fieldErrors.password}</span>
              )}

              {/* Strength meter — only shown when the user has typed something */}
              {formData.password.length > 0 && (
                <div className="auth-pw-strength">
                  <div className="auth-pw-strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`auth-pw-strength-bar ${i <= pwStrength.score ? pwStrength.level : ''}`}
                      />
                    ))}
                  </div>
                  <span className={`auth-pw-strength-label ${pwStrength.level}`}>
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon material-symbols-outlined">lock_reset</span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={e => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    field('confirmPassword').onChange();
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            {/* Terms */}
            <div className="auth-field">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={e => {
                    setFormData({ ...formData, agreeToTerms: e.target.checked });
                    field('agreeToTerms').onChange();
                  }}
                />
                I agree to the{' '}
                <Link href="/terms" className="auth-link" style={{ fontSize: '0.8125rem' }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="auth-link" style={{ fontSize: '0.8125rem' }}>
                  Privacy Policy
                </Link>
              </label>
              {fieldErrors.agreeToTerms && (
                <span className="auth-field-error" style={{ paddingLeft: '1.5rem' }}>
                  {fieldErrors.agreeToTerms}
                </span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

          </form>

        </div>
      </div>

    </div>
  );
}