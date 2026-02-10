'use client';

import * as React from 'react';
import { useState, FormEvent } from 'react';
import Link from 'next/link';

// ============================================
// TYPES & INTERFACES
// ============================================
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// ============================================
// MAIN LOGIN PAGE COMPONENT
// ============================================
const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // VALIDATION
  // ============================================
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // FORM SUBMISSION - CONNECTED TO REAL API
  // ============================================
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // REAL API CALL to your FastAPI backend
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token based on rememberMe preference
        if (formData.rememberMe) {
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('auth_token', data.access_token);
          sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        
        // Update AuthContext if you're using it
        if (typeof window !== 'undefined' && (window as any).authUpdate) {
          (window as any).authUpdate(data.access_token, data.user);
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Handle API errors
        let errorMessage = 'Invalid email or password';
        if (data.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : 'Login failed';
        }
        setErrors({ general: errorMessage });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ 
        general: error.message || 'Network error. Please check if the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // INPUT HANDLERS
  // ============================================
  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ============================================
  // DEMO LOGIN (for testing)
  // ============================================
  const handleDemoLogin = async () => {
    // For testing with real backend
    setFormData({
      email: 'demo@spendwise.co.za',
      password: 'demo123',
      rememberMe: false,
    });
    
    // Auto-submit after setting demo credentials
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 500);
  };

  return (
    <>
      <div className="login-page">
        {/* Left Panel - Branding & Marketing */}
        <div className="login-left">
          <div className="login-left-content">
            <Link href="/" className="logo">
              SpendWise SA
            </Link>
            
            <div className="marketing-content">
              <h1 className="marketing-title">
                Welcome back to your
                <span className="marketing-title-gradient"> financial control center</span>
              </h1>
              
              <p className="marketing-description">
                Continue your journey to financial freedom. Track your progress, manage debt, and achieve your goals.
              </p>
              
              <div className="trust-badges">
                <div className="trust-badge">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Bank-Level Security</span>
                </div>
                <div className="trust-badge">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>50,000+ Users</span>
                </div>
              </div>

              <div className="stats-preview">
                <div className="stat-item">
                  <div className="stat-label">Average Debt Reduction</div>
                  <div className="stat-value">32%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Avg. Net Worth Growth</div>
                  <div className="stat-value">+R 45K</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title">Sign In</h2>
              <p className="form-subtitle">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Demo Login Banner */}
            <div className="demo-banner">
              <svg className="demo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span>Want to try it out?</span>
              <button type="button" onClick={handleDemoLogin} className="demo-link">
                Use Demo Account
              </button>
            </div>

            {/* Error Alert */}
            {errors.general && (
              <div className="alert alert-error">
                <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="error-message">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <Link href="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Remember me for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3"></circle>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span className="divider-text">or continue with</span>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <button type="button" className="social-btn">
                <svg className="social-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                </svg>
                Google
              </button>
              <button type="button" className="social-btn">
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                GitHub
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="footer-link">
              Don't have an account?{' '}
              <Link href="/register" className="link">
                Sign up for free
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* All the CSS styles remain exactly the same as before */
        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-left {
          background: linear-gradient(135deg, #002855 0%, #0052CC 50%, #00875A 100%);
          position: relative;
          overflow: hidden;
          padding: 48px;
          display: flex;
          align-items: center;
        }

        /* ... rest of your CSS stays exactly the same ... */
        
      `}</style>
    </>
  );
};

export default LoginPage;