'use client';

import * as React from 'react';
import { useState, FormEvent } from 'react';

// ============================================
// TYPES & INTERFACES
// ============================================
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  acceptTerms: boolean;
  receiveUpdates: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  acceptTerms?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

// ============================================
// MAIN REGISTRATION PAGE COMPONENT
// ============================================
const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
    receiveUpdates: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================
  // PASSWORD STRENGTH CALCULATOR
  // ============================================
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#DE350B' };
    if (score <= 4) return { score: 2, label: 'Fair', color: '#FF991F' };
    if (score <= 5) return { score: 3, label: 'Good', color: '#00875A' };
    return { score: 4, label: 'Strong', color: '#00C853' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // South African phone number format
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid South African phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          marketing_consent: formData.receiveUpdates,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        localStorage.setItem('auth_token', data.access_token);
        
        // Redirect to onboarding or dashboard
        window.location.href = '/onboarding';
      } else {
        setErrors({ general: data.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // INPUT HANDLERS
  // ============================================
  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ============================================
  // SOCIAL REGISTRATION
  // ============================================
  const handleSocialRegister = (provider: string) => {
    // Implement OAuth flow
    window.location.href = `/api/v1/auth/oauth/${provider}`;
  };

  return (
    <>
      <div className="register-page">
      {/* Left Panel - Branding & Benefits */}
      <div className="register-left">
        <div className="register-left-content">
          <a href="/" className="logo">
            SpendWise SA
          </a>
          
          <div className="marketing-content">
            <h1 className="marketing-title">
              Start your journey to
              <span className="marketing-title-gradient"> financial freedom</span>
            </h1>
            
            <p className="marketing-description">
              Join 50,000+ South Africans who have taken control of their money with our intelligent financial management platform.
            </p>
            
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="benefit-content">
                  <div className="benefit-title">Free Forever</div>
                  <div className="benefit-description">All features included, no hidden fees</div>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div className="benefit-content">
                  <div className="benefit-title">Bank-Level Security</div>
                  <div className="benefit-description">256-bit encryption protects your data</div>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className="benefit-content">
                  <div className="benefit-title">Smart Insights</div>
                  <div className="benefit-description">AI-powered recommendations for your goals</div>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="benefit-content">
                  <div className="benefit-title">Setup in 2 Minutes</div>
                  <div className="benefit-description">Quick registration, instant access</div>
                </div>
              </div>
            </div>

            <div className="testimonial">
              <div className="testimonial-quote">
                "SpendWise helped me pay off R45,000 in debt in just 18 months. The debt payoff calculator was a game-changer!"
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">TM</div>
                <div>
                  <div className="author-name">Thabo Mokoena</div>
                  <div className="author-title">Johannesburg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="register-right">
        <div className="register-form-container">
          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">
                {currentStep > 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : '1'}
              </div>
              <div className="step-label">Personal Info</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Security</div>
            </div>
          </div>

          <div className="form-header">
            <h2 className="form-title">
              {currentStep === 1 ? 'Create Your Account' : 'Secure Your Account'}
            </h2>
            <p className="form-subtitle">
              {currentStep === 1 
                ? 'Tell us a bit about yourself to get started' 
                : 'Set a strong password to protect your financial data'}
            </p>
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

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        id="firstName"
                        type="text"
                        className={`form-input ${errors.firstName ? 'error' : ''}`}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="error-message">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        id="lastName"
                        type="text"
                        className={`form-input ${errors.lastName ? 'error' : ''}`}
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="error-message">{errors.lastName}</p>
                    )}
                  </div>
                </div>

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
                    />
                  </div>
                  {errors.email && (
                    <p className="error-message">{errors.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input
                      id="phone"
                      type="tel"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="0821234567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && (
                    <p className="error-message">{errors.phone}</p>
                  )}
                  <p className="helper-text">We'll never share your phone number</p>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-submit"
                >
                  Continue
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            )}

            {/* STEP 2: Password & Terms */}
            {currentStep === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      autoComplete="new-password"
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-label">
                        Password strength: <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`strength-bar ${bar <= passwordStrength.score ? 'active' : ''}`}
                            style={{ backgroundColor: bar <= passwordStrength.score ? passwordStrength.color : '#DFE1E6' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && (
                    <p className="error-message">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="password-requirements">
                  <div className="requirement-title">Password must contain:</div>
                  <div className="requirements-list">
                    <div className={`requirement-item ${formData.password.length >= 8 ? 'met' : ''}`}>
                      <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      At least 8 characters
                    </div>
                    <div className={`requirement-item ${/[A-Z]/.test(formData.password) ? 'met' : ''}`}>
                      <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      One uppercase letter
                    </div>
                    <div className={`requirement-item ${/[a-z]/.test(formData.password) ? 'met' : ''}`}>
                      <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      One lowercase letter
                    </div>
                    <div className={`requirement-item ${/[0-9]/.test(formData.password) ? 'met' : ''}`}>
                      <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      One number
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      I agree to the{' '}
                      <a href="/terms" className="link" target="_blank">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" className="link" target="_blank">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="error-message" style={{ marginTop: '8px' }}>{errors.acceptTerms}</p>
                  )}

                  <label className="checkbox-label" style={{ marginTop: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.receiveUpdates}
                      onChange={(e) => handleInputChange('receiveUpdates', e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      Send me tips, updates, and special offers
                    </span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-back"
                    disabled={isLoading}
                  >
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back
                  </button>

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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Divider - Only show on step 1 */}
          {currentStep === 1 && (
            <>
              <div className="divider">
                <span className="divider-text">or sign up with</span>
              </div>

              {/* Social Registration */}
              <div className="social-login">
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => handleSocialRegister('google')}
                >
                  <svg className="social-icon" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => handleSocialRegister('github')}
                >
                  <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
                  </svg>
                  GitHub
                </button>
              </div>
            </>
          )}

          {/* Sign In Link */}
          <div className="footer-link">
            Already have an account?{' '}
            <a href="/login" className="link">
              Sign in
            </a>
          </div>
        </div>
      </div>

      <style>{`
        /* ============================================
           LAYOUT
           ============================================ */
        .register-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ============================================
           LEFT PANEL
           ============================================ */
        .register-left {
          background: linear-gradient(135deg, #002855 0%, #0052CC 50%, #00875A 100%);
          position: relative;
          overflow: hidden;
          padding: 48px;
          display: flex;
          align-items: center;
        }

        .register-left::before {
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

        .register-left::after {
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

        .register-left-content {
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

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 48px;
        }

        .benefit-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .benefit-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .benefit-icon svg {
          width: 24px;
          height: 24px;
          color: #00E676;
        }

        .benefit-content {
          flex: 1;
        }

        .benefit-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .benefit-description {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.5;
        }

        .testimonial {
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .testimonial-quote {
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 16px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00E676, #0066CC);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .author-name {
          font-size: 14px;
          font-weight: 600;
        }

        .author-title {
          font-size: 13px;
          opacity: 0.7;
        }

        /* ============================================
           RIGHT PANEL
           ============================================ */
        .register-right {
          background: #FAFBFC;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
        }

        .register-form-container {
          width: 100%;
          max-width: 520px;
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ============================================
           PROGRESS INDICATOR
           ============================================ */
        .progress-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          gap: 16px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #E0E0E0;
          color: #6B778C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #0066CC, #00C853);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .progress-step.completed .step-number {
          background: #00C853;
          color: white;
        }

        .progress-step.completed .step-number svg {
          width: 24px;
          height: 24px;
        }

        .step-label {
          font-size: 13px;
          font-weight: 600;
          color: #6B778C;
        }

        .progress-step.active .step-label {
          color: #0066CC;
        }

        .progress-line {
          width: 80px;
          height: 2px;
          background: #E0E0E0;
        }

        /* ============================================
           FORM HEADER
           ============================================ */
        .form-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          color: #091E42;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6B778C;
          line-height: 1.5;
        }

        /* ============================================
           ALERT
           ============================================ */
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

        /* ============================================
           FORM
           ============================================ */
        .register-form {
          margin-bottom: 32px;
        }

        .form-step {
          animation: fadeIn 0.4s ease-out;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 8px;
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

        .helper-text {
          margin-top: 6px;
          font-size: 13px;
          color: #6B778C;
        }

        /* ============================================
           PASSWORD STRENGTH
           ============================================ */
        .password-strength {
          margin-top: 12px;
        }

        .strength-label {
          font-size: 13px;
          color: #505F79;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .strength-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          height: 4px;
        }

        .strength-bar {
          height: 100%;
          border-radius: 2px;
          background: #DFE1E6;
          transition: background-color 0.3s;
        }

        /* ============================================
           PASSWORD REQUIREMENTS
           ============================================ */
        .password-requirements {
          padding: 16px;
          background: #F4F5F7;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .requirement-title {
          font-size: 13px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 12px;
        }

        .requirements-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6B778C;
        }

        .requirement-item.met {
          color: #00875A;
        }

        .requirement-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .requirement-item:not(.met) .requirement-icon {
          opacity: 0.3;
        }

        /* ============================================
           CHECKBOX
           ============================================ */
        .form-options {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
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
          margin-top: 2px;
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
          line-height: 1.5;
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

        /* ============================================
           BUTTONS
           ============================================ */
        .form-actions {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
        }

        .btn-back {
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          color: #505F79;
          background: white;
          border: 2px solid #DFE1E6;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-back:hover:not(:disabled) {
          border-color: #0052CC;
          color: #0052CC;
        }

        .btn-back:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        /* ============================================
           DIVIDER
           ============================================ */
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

        /* ============================================
           SOCIAL LOGIN
           ============================================ */
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

        /* ============================================
           FOOTER LINK
           ============================================ */
        .footer-link {
          text-align: center;
          font-size: 15px;
          color: #6B778C;
        }

        /* ============================================
           ANIMATIONS
           ============================================ */
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .register-page {
            grid-template-columns: 1fr;
          }

          .register-left {
            display: none;
          }

          .register-right {
            padding: 32px 24px;
          }

          .requirements-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .register-right {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 28px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .social-login {
            grid-template-columns: 1fr;
          }

          .form-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
    </>
  );
};

export default RegisterPage;

