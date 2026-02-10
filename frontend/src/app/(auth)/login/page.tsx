'use client';

import * as React from 'react';
import { useState, FormEvent } from 'react';

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
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // API call to backend
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        if (formData.rememberMe) {
          localStorage.setItem('auth_token', data.access_token);
        } else {
          sessionStorage.setItem('auth_token', data.access_token);
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setErrors({ general: data.message || 'Invalid email or password' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
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
  // DEMO LOGIN
  // ============================================
  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@spendwise.co.za',
      password: 'demo123',
      rememberMe: false,
    });
  };

  return (
    <>
      <div className="login-page">
        {/* Left Panel - Branding & Marketing */}
        <div className="login-left">
          <div className="login-left-content">
            <a href="/" className="logo">
              SpendWise SA
            </a>
            
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
                  <a href="/forgot-password" className="forgot-link">
                    Forgot password?
                  </a>
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
              <a href="/register" className="link">
                Sign up for free
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* All the CSS from the previous version stays exactly the same */
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

        .login-left::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -25%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 200, 83, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 20s ease-in-out infinite;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 102, 204, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 25s ease-in-out infinite reverse;
        }

        .login-left-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .logo {
          display: inline-block;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #00E676 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 48px;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .marketing-content {
          color: white;
        }

        .marketing-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .marketing-title-gradient {
          background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .marketing-description {
          font-size: 18px;
          line-height: 1.7;
          opacity: 0.9;
          margin-bottom: 40px;
        }

        .trust-badges {
          display: flex;
          gap: 24px;
          margin-bottom: 48px;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .trust-icon {
          width: 20px;
          height: 20px;
          color: #00E676;
        }

        .stats-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .stat-item {
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .login-right {
          background: #FAFBFC;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
        }

        .login-form-container {
          width: 100%;
          max-width: 460px;
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 36px;
          font-weight: 800;
          color: #091E42;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6B778C;
        }

        .demo-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #DEEBFF, #C8DDFF);
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #0052CC;
          font-weight: 500;
        }

        .demo-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .demo-link {
          margin-left: auto;
          padding: 6px 16px;
          background: #0052CC;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-link:hover {
          background: #0066CC;
          transform: translateY(-1px);
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: #FFEBE6;
          color: #DE350B;
          border: 1px solid #FFBDAD;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .login-form {
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 8px;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .forgot-link {
          font-size: 14px;
          color: #0052CC;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #0066CC;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #6B778C;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: inherit;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          background: white;
          color: #091E42;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input::placeholder {
          color: #97A0AF;
        }

        .form-input:focus {
          outline: none;
          border-color: #0052CC;
          box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.1);
        }

        .form-input.error {
          border-color: #DE350B;
          background: #FFF4F3;
        }

        .form-input.error:focus {
          border-color: #DE350B;
          box-shadow: 0 0 0 4px rgba(222, 53, 11, 0.1);
        }

        .form-input:disabled {
          background: #F4F5F7;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6B778C;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #091E42;
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
          display: block;
        }

        .error-message {
          margin-top: 8px;
          font-size: 13px;
          color: #DE350B;
          font-weight: 500;
        }

        .form-options {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #DFE1E6;
          border-radius: 4px;
          margin-right: 12px;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
          background: #0052CC;
          border-color: #0052CC;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 5px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-text {
          font-size: 14px;
          color: #505F79;
        }

        .btn-submit {
          width: 100%;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          color: white;
          background: linear-gradient(135deg, #0066CC 0%, #00C853 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        .spinner-circle {
          stroke: currentColor;
          stroke-dasharray: 50;
          stroke-dashoffset: 0;
          animation: spinnerDash 1.5s ease-in-out infinite;
        }

        .divider {
          position: relative;
          text-align: center;
          margin: 32px 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #DFE1E6;
        }

        .divider-text {
          position: relative;
          display: inline-block;
          padding: 0 16px;
          background: #FAFBFC;
          font-size: 14px;
          color: #6B778C;
          font-weight: 500;
        }

        .social-login {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          color: #091E42;
          background: white;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .social-btn:hover {
          border-color: #0052CC;
          background: #FAFBFC;
        }

        .social-icon {
          width: 20px;
          height: 20px;
        }

        .footer-link {
          text-align: center;
          font-size: 15px;
          color: #6B778C;
        }

        .link {
          color: #0052CC;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .link:hover {
          color: #0066CC;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinnerDash {
          0% {
            stroke-dashoffset: 50;
          }
          50% {
            stroke-dashoffset: 12.5;
            transform: rotate(135deg);
          }
          100% {
            stroke-dashoffset: 50;
            transform: rotate(450deg);
          }
        }

        @media (max-width: 1024px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .login-left {
            display: none;
          }

          .login-right {
            padding: 32px 24px;
          }
        }

        @media (max-width: 480px) {
          .login-right {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 28px;
          }

          .social-login {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default LoginPage;

