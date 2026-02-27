'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './globals.css';

// Data arrays
const features = [
  {
    icon: 'ðŸ“Š',
    title: 'Smart Budgeting',
    description: 'AI-powered budgets that adapt to your spending habits and help you save more.',
    link: '/features/budgeting'
  },
  {
    icon: 'ðŸŽ¯',
    title: 'Goal Tracking',
    description: 'Set and track financial goals - from emergency funds to that dream holiday.',
    link: '/features/goals'
  },
  {
    icon: 'ðŸ“ˆ',
    title: 'Investment Insights',
    description: 'Get personalized investment recommendations based on your risk profile.',
    link: '/features/investments'
  },
  {
    icon: 'ðŸ’³',
    title: 'Debt Management',
    description: 'Smart debt payoff strategies that save you thousands in interest.',
    link: '/features/debt'
  },
  {
    icon: 'ðŸ ',
    title: 'Net Worth Tracker',
    description: 'Track your complete financial picture including assets and liabilities.',
    link: '/features/net-worth'
  },
  {
    icon: 'ðŸ”’',
    title: 'Bank-Grade Security',
    description: 'Your data is encrypted and protected with enterprise-level security.',
    link: '/features/security'
  }
];

const steps = [
  {
    title: 'Create Your Account',
    description: 'Sign up for free in under 2 minutes. No credit card required.'
  },
  {
    title: 'Connect Your Accounts',
    description: 'Securely link your bank accounts or track expenses manually.'
  },
  {
    title: 'Start Saving Money',
    description: 'Get personalized insights and start achieving your financial goals.'
  }
];

const testimonials = [
  {
    rating: 5,
    quote: 'SpendWise helped me pay off R45,000 in debt in just 18 months. The debt payoff calculator was a game-changer!',
    name: 'Thabo Mokoena',
    location: 'Johannesburg',
    initials: 'TM',
    color: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  {
    rating: 5,
    quote: 'Finally a financial app built for South Africans. The automatic tax calculations and local bank integration are perfect.',
    name: 'Sarah van der Merwe',
    location: 'Cape Town',
    initials: 'SV',
    color: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  {
    rating: 4,
    quote: "I've saved over R12,000 this year just by following the smart budgeting recommendations. It's like having a financial advisor in your pocket.",
    name: 'Priya Naidoo',
    location: 'Durban',
    initials: 'PN',
    color: 'linear-gradient(135deg, #4facfe, #00f2fe)'
  }
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={
avbar }>
        <div className="nav-container">
          <Link href="/" className="logo">
            <span className="logo-icon">ðŸ’°</span>
            SpendWise<span className="logo-accent">SA</span>
          </Link>
          
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#pricing">Pricing</Link>
            
            {!authLoading && user ? (
              <>
                <Link href="/dashboard" className="nav-link">
                  ðŸ“Š Dashboard
                </Link>
                <Link href="/dashboard/income" className="nav-link highlight-link">
                  ðŸ’µ Income
                </Link>
                <div className="user-menu">
                  <span className="user-email-small">
                    {user.email?.split('@')[0]}
                  </span>
                  <Link href="/dashboard" className="nav-button">
                    My Account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Sign In</Link>
                <Link href="/register" className="nav-button">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            Trusted by 50,000+ South Africans
          </div>
          <h1 className="hero-title">
            Take Control of Your
            <span className="gradient-text"> Financial Future</span>
          </h1>
          <p className="hero-subtitle">
            Join thousands of smart spenders who've saved over R100M using our intelligent 
            financial management platform. Get AI-powered insights, track expenses, and 
            achieve your financial goals faster.
          </p>
          <div className="hero-cta">
            {!authLoading && user ? (
              <>
                <Link href="/dashboard" className="cta-primary">
                  Go to Dashboard
                  <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="/dashboard/income" className="cta-secondary">
                  Track Income
                  <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5"/>
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="cta-primary">
                  Start Free Trial
                  <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="#demo" className="cta-secondary">
                  Watch Demo
                  <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                  </svg>
                </Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">R100M+</div>
              <div className="stat-label">Total Saved</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50k+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">4.9â˜…</div>
              <div className="stat-label">User Rating</div>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <span>Dashboard Overview</span>
            </div>
            <div className="preview-chart">
              <div className="chart-bar" style={{height: '60px'}}></div>
              <div className="chart-bar" style={{height: '80px'}}></div>
              <div className="chart-bar" style={{height: '45px'}}></div>
              <div className="chart-bar" style={{height: '70px'}}></div>
              <div className="chart-bar" style={{height: '55px'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2 className="section-title">
            Everything You Need to 
            <span className="gradient-text"> Master Your Money</span>
          </h2>
          <p className="section-subtitle">
            Powerful tools designed specifically for South African financial management
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-bg"></div>
                <div className="feature-icon">{feature.icon}</div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <Link href={feature.link} className="feature-link">
                Learn more
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">
            Get Started in 
            <span className="gradient-text"> 3 Simple Steps</span>
          </h2>
          <p className="section-subtitle">
            Join thousands of South Africans who've transformed their financial habits
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing">
        <div className="section-header">
          <h2 className="section-title">
            Simple, Transparent
            <span className="gradient-text"> Pricing</span>
          </h2>
          <p className="section-subtitle">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3 className="pricing-name">Free</h3>
              <div className="pricing-price">
                <span className="price-amount">R0</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>âœ“ Basic expense tracking</li>
              <li>âœ“ Monthly reports</li>
              <li>âœ“ 3 budget categories</li>
              <li>âœ“ 30-day transaction history</li>
            </ul>
            <Link href="/register" className="pricing-button">
              Get Started
            </Link>
          </div>

          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-header">
              <h3 className="pricing-name">Pro</h3>
              <div className="pricing-price">
                <span className="price-amount">R99</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>âœ“ Everything in Free</li>
              <li>âœ“ AI-powered insights</li>
              <li>âœ“ Unlimited budgets</li>
              <li>âœ“ 5-year transaction history</li>
              <li>âœ“ Priority support</li>
              <li>âœ“ Export to PDF/Excel</li>
            </ul>
            <Link href="/register" className="pricing-button pro">
              Start Free Trial
            </Link>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3 className="pricing-name">Family</h3>
              <div className="pricing-price">
                <span className="price-amount">R199</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>âœ“ Everything in Pro</li>
              <li>âœ“ Up to 5 members</li>
              <li>âœ“ Shared budgets</li>
              <li>âœ“ Family goals</li>
              <li>âœ“ Parental controls</li>
            </ul>
            <Link href="/register" className="pricing-button">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
          <h2 className="section-title">
            Loved by 
            <span className="gradient-text"> South Africans</span>
          </h2>
          <p className="section-subtitle">
            Join 50,000+ happy users who've transformed their finances
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-rating">
                {'â˜…'.repeat(testimonial.rating)}
                {'â˜†'.repeat(5 - testimonial.rating)}
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{background: testimonial.color}}>
                  {testimonial.initials}
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-location">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">
            {user ? 'Continue Your Financial Journey' : 'Ready to Take Control of Your Finances?'}
          </h2>
          <p className="cta-subtitle">
            {user 
              ? 'Head to your dashboard to track income, manage expenses, and achieve your goals.'
              : 'Join 50,000+ South Africans who\'ve already started their journey to financial freedom'}
          </p>
          <div className="cta-buttons">
            {user ? (
              <>
                <Link href="/dashboard" className="cta-primary large">
                  Go to Dashboard
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="/dashboard/income" className="cta-secondary large">
                  Track Income
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="cta-primary large">
                  Get Started Free
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="/contact" className="cta-secondary large">
                  Contact Sales
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="cta-note">No credit card required â€¢ 14-day free trial â€¢ Cancel anytime</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <Link href="/" className="footer-logo">
              <span className="logo-icon">ðŸ’°</span>
              SpendWise<span className="logo-accent">SA</span>
            </Link>
            <p className="footer-description">
              Making financial management simple and effective for South Africans since 2024.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">ðŸ“±</a>
              <a href="#" className="social-link">ðŸ’¬</a>
              <a href="#" className="social-link">ðŸ“˜</a>
              <a href="#" className="social-link">ðŸ¦</a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links">
              <h4>Product</h4>
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
              <Link href="/security">Security</Link>
              <Link href="/roadmap">Roadmap</Link>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/press">Press</Link>
              <Link href="/blog">Blog</Link>
            </div>
            <div className="footer-links">
              <h4>Resources</h4>
              <Link href="/help">Help Center</Link>
              <Link href="/guides">Guides</Link>
              <Link href="/api">API</Link>
              <Link href="/status">Status</Link>
            </div>
            <div className="footer-links">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/licenses">Licenses</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Â© {new Date().getFullYear()} SpendWise SA. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
