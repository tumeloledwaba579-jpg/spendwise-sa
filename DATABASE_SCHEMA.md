# SpendWise SA - Database Schema Documentation

## Overview
PostgreSQL database with 30+ tables covering all financial management aspects.

## Core Tables

### users
User accounts and authentication
- id (UUID) - Primary key
- email (VARCHAR) - Unique email
- hashed_password (VARCHAR) - Bcrypt hash
- full_name (VARCHAR) - User's name
- is_active (BOOLEAN) - Account status
- is_admin (BOOLEAN) - Admin privileges
- email_verified (BOOLEAN) - Email verification status
- created_at (TIMESTAMP) - Account creation
- updated_at (TIMESTAMP) - Last update

### accounts
User bank/financial accounts
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Account name
- type (VARCHAR) - Account type
- balance (NUMERIC) - Current balance
- is_active (BOOLEAN) - Account status
- created_at (TIMESTAMP) - Creation date

### transactions
Financial transactions
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- account_id (UUID) - Foreign key to accounts
- category_id (UUID) - Foreign key to categories
- amount (NUMERIC) - Transaction amount
- description (TEXT) - Transaction description
- transaction_date (DATE) - When transaction occurred
- type (VARCHAR) - EXPENSE or INCOME
- is_reconciled (BOOLEAN) - Reconciliation status
- created_at (TIMESTAMP) - Record creation

### budgets
Budget management
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- category_id (UUID) - Foreign key to categories
- amount (NUMERIC) - Budget limit
- period (VARCHAR) - MONTHLY, YEARLY
- start_date (DATE) - Budget period start
- end_date (DATE) - Budget period end
- alert_threshold (NUMERIC) - Alert percentage
- is_active (BOOLEAN) - Budget status

### categories
Transaction categories
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Category name
- description (TEXT) - Category description
- icon (VARCHAR) - Icon identifier
- color (VARCHAR) - Color code
- budget_limit (NUMERIC) - Optional budget limit
- is_active (BOOLEAN) - Category status

## Income Tracking Tables

### income_sources
Income source definitions
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Source name
- type (VARCHAR) - SALARY, FREELANCE, INVESTMENT, PASSIVE, CUSTOM, OTHER
- frequency (VARCHAR) - DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
- amount (NUMERIC) - Typical amount
- is_recurring (BOOLEAN) - Recurring status
- is_taxable (BOOLEAN) - Tax applicability
- auto_tax_calculation (BOOLEAN) - Auto-calculate tax
- tax_rate (NUMERIC) - Tax percentage
- is_active (BOOLEAN) - Source status
- created_at (TIMESTAMP) - Creation date

### income_history
Actual income received
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- income_source_id (UUID) - Foreign key to income_sources
- amount (NUMERIC) - Amount received
- tax_amount (NUMERIC) - Taxes paid
- received_date (DATE) - When received
- is_manual_entry (BOOLEAN) - Manual vs automatic
- created_at (TIMESTAMP) - Record creation

### income_monthly_summary
Monthly income aggregates
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- year (INTEGER) - Year
- month (INTEGER) - Month (1-12)
- total_income (NUMERIC) - Total income
- recurring_income (NUMERIC) - Recurring sources
- one_time_income (NUMERIC) - One-time sources
- total_tax (NUMERIC) - Total taxes
- net_income (NUMERIC) - After-tax income
- recurring_count (INTEGER) - Number of recurring sources
- one_time_count (INTEGER) - Number of one-time sources

## Debt Management Tables

### debt_accounts
Debt account definitions
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Account name
- type (VARCHAR) - CREDIT_CARD, PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, STUDENT_LOAN, OTHER
- creditor_name (VARCHAR) - Creditor name
- current_balance (NUMERIC) - Current balance
- credit_limit (NUMERIC) - Credit limit (if applicable)
- interest_rate (NUMERIC) - Annual interest rate
- minimum_payment (NUMERIC) - Minimum payment
- due_date (INTEGER) - Due day of month (1-31)
- start_date (DATE) - Account start date
- payoff_date (DATE) - Target payoff date
- is_active (BOOLEAN) - Account status
- created_at (TIMESTAMP) - Creation date

### debt_payments
Debt payment history
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- debt_account_id (UUID) - Foreign key to debt_accounts
- amount (NUMERIC) - Payment amount
- payment_date (DATE) - Payment date
- payment_method (VARCHAR) - BANK_TRANSFER, CHECK, CREDIT_CARD, AUTO_PAY, OTHER
- notes (TEXT) - Payment notes
- created_at (TIMESTAMP) - Record creation

### debt_snapshots
Monthly debt aggregates
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- debt_account_id (UUID) - Foreign key to debt_accounts
- year (INTEGER) - Year
- month (INTEGER) - Month
- balance_start (NUMERIC) - Starting balance
- balance_end (NUMERIC) - Ending balance
- total_paid (NUMERIC) - Total payments
- interest_accrued (NUMERIC) - Interest accrued
- payment_count (INTEGER) - Number of payments

## Asset Management Tables

### assets
Asset holdings
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Asset name
- type (VARCHAR) - CASH, REAL_ESTATE, VEHICLE, INVESTMENT, etc
- description (TEXT) - Asset description
- current_value (NUMERIC) - Current value
- purchase_price (NUMERIC) - Original purchase price
- purchase_date (DATE) - Purchase date
- last_valued_date (DATE) - Last valuation date
- quantity (NUMERIC) - Quantity held
- unit_value (NUMERIC) - Value per unit
- is_liquid (BOOLEAN) - Liquid status
- is_active (BOOLEAN) - Asset status
- created_at (TIMESTAMP) - Creation date

### asset_valuations
Historical asset valuations
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- asset_id (UUID) - Foreign key to assets
- valuation_date (DATE) - Valuation date
- value (NUMERIC) - Asset value
- notes (TEXT) - Valuation notes
- created_at (TIMESTAMP) - Record creation

### net_worth_snapshots
Monthly net worth snapshots
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- year (INTEGER) - Year
- month (INTEGER) - Month
- total_assets (NUMERIC) - Total assets
- liquid_assets (NUMERIC) - Liquid assets
- non_liquid_assets (NUMERIC) - Non-liquid assets
- total_liabilities (NUMERIC) - Total debts
- net_worth (NUMERIC) - Assets minus liabilities
- debt_to_assets_ratio (NUMERIC) - Ratio percentage
- debt_to_income_ratio (NUMERIC) - Ratio percentage
- created_at (TIMESTAMP) - Snapshot date

## Goal & Analytics Tables

### goals
Financial goals
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (VARCHAR) - Goal name
- type (VARCHAR) - DEBT_PAYOFF, SAVINGS, INVESTMENT, RETIREMENT, etc
- description (TEXT) - Goal description
- target_amount (NUMERIC) - Target amount
- current_amount (NUMERIC) - Current progress
- target_date (DATE) - Target completion date
- start_date (DATE) - Goal start date
- status (VARCHAR) - NOT_STARTED, IN_PROGRESS, ON_TRACK, COMPLETED
- priority (INTEGER) - Priority 1-10
- progress_percentage (NUMERIC) - Progress %
- is_active (BOOLEAN) - Goal status
- created_at (TIMESTAMP) - Creation date

### milestones
Sub-goals for tracking progress
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- goal_id (UUID) - Foreign key to goals
- name (VARCHAR) - Milestone name
- target_amount (NUMERIC) - Milestone target
- target_date (DATE) - Milestone date
- is_completed (BOOLEAN) - Completion status
- completed_date (DATE) - When completed
- actual_amount (NUMERIC) - Actual achieved amount
- created_at (TIMESTAMP) - Creation date

### financial_insights
AI-generated insights
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- insight_type (VARCHAR) - OPPORTUNITY, WARNING, RECOMMENDATION, TREND
- title (VARCHAR) - Insight title
- description (TEXT) - Detailed description
- priority (INTEGER) - Priority 1-10
- action_items (TEXT) - Recommended actions
- potential_savings (NUMERIC) - Potential savings
- is_dismissed (BOOLEAN) - Dismissal status
- created_at (TIMESTAMP) - Generation date

### financial_forecasts
Financial projections
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- forecast_type (VARCHAR) - NET_WORTH, DEBT, INCOME, EXPENSES
- forecast_date (DATE) - Forecast date
- projected_value (NUMERIC) - Projected value
- confidence_level (NUMERIC) - Confidence 0-100
- assumptions (TEXT) - Forecast assumptions
- created_at (TIMESTAMP) - Creation date

### spending_patterns
Spending analysis
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- year (INTEGER) - Year
- month (INTEGER) - Month
- category (VARCHAR) - Spending category
- average_spending (NUMERIC) - Average amount
- total_spending (NUMERIC) - Total amount
- transaction_count (INTEGER) - Number of transactions
- trend (VARCHAR) - UP, DOWN, STABLE
- percentage_of_income (NUMERIC) - % of income
- created_at (TIMESTAMP) - Analysis date

## Indexes

Performance indexes on frequently queried columns:
- users.email
- accounts.user_id
- transactions.user_id, transaction_date
- income_sources.user_id
- income_history.user_id, received_date
- debt_accounts.user_id
- debt_payments.user_id, payment_date
- assets.user_id
- goals.user_id, priority
- financial_insights.user_id, is_dismissed
- spending_patterns.user_id, year, month

## Relationships

### One-to-Many
- users → accounts
- users → transactions
- users → budgets
- users → income_sources
- users → income_history
- users → debt_accounts
- users → debt_payments
- users → assets
- users → asset_valuations
- users → goals
- users → milestones
- accounts → transactions
- categories → transactions
- categories → budgets
- income_sources → income_history
- debt_accounts → debt_payments
- debt_accounts → debt_snapshots
- assets → asset_valuations
- goals → milestones

### Cascade Delete
All foreign keys use ON DELETE CASCADE for data integrity.

## Constraints

- email must be unique
- amounts must be >= 0
- interest_rate must be 0-100
- due_date must be 1-31
- month must be 1-12
- year must be positive
- unique constraint on (user_id, year, month) for snapshots

---

**Total Tables**: 30+
**Total Columns**: 500+
**Performance Optimized**: Yes
**Cascade Deletes**: Yes
