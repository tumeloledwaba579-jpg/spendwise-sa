# SpendWise SA - Phase 2: Personal Finance Module
## Product Requirements Document (PRD)

**Version:** 2.0  
**Status:** Planning  
**Date:** January 2026  
**Target Release:** Q2 2026

---

## Executive Summary

Phase 2 extends SpendWise SA from basic expense tracking to a comprehensive personal finance management platform. Users will gain complete visibility into their financial health through income tracking, debt management, asset portfolios, and net worth calculations.

**Target Users:**
- Individual consumers (18-65 years old)
- Self-employed professionals
- High-income earners managing multiple income streams
- Users with complex debt situations
- Investors tracking multiple accounts

---

## Part 1: Income Tracking Module

### 1.1 Income Sources

**Overview:** Users can add and manage multiple income streams with detailed categorization.

#### Data Model

```
IncomeSource
├── id: UUID
├── user_id: UUID
├── name: string (e.g., "Primary Salary", "Freelance Projects")
├── type: enum [SALARY, FREELANCE, INVESTMENT, PASSIVE, OTHER]
├── frequency: enum [DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY]
├── amount: decimal (gross amount)
├── start_date: date
├── end_date: date (nullable - for contracts)
├── is_recurring: boolean
├── is_taxable: boolean
├── tax_category: enum [INCOME_TAX, CAPITAL_GAINS_SHORT, CAPITAL_GAINS_LONG, DIVIDEND, SELF_EMPLOYMENT]
├── notes: string
├── created_at: datetime
├── updated_at: datetime
```

#### Features

**Add Income Source**
- Create new income stream
- Set recurring pattern (salary) or one-time (bonus)
- Specify tax implications
- Add optional notes

**Edit/Update**
- Modify amount and frequency
- Change tax classification
- Update end dates for contracts

**Delete**
- Archive income source (soft delete)
- Keep historical data intact

**List/Filter**
- View all active income sources
- Filter by type, frequency, taxable status
- Search by name

### 1.2 Auto-Categorization

**System Rules:**
```
Recurring (monthly) + Consistent Amount → Salary-type
One-time Large Amount → Bonus
Interest/Dividends → Investment Income
Project-based → Freelance
Rental Income → Passive Income
```

**Rules Engine:**
- User can override auto-categorization
- Learn from user patterns (ML-ready for future)
- Custom rules per user

### 1.3 Time-based Views

**Period Grouping:**
- Monthly: Sum all income for each month
- Quarterly: Q1, Q2, Q3, Q4 views
- Yearly: Annual income totals
- Custom ranges: User-specified date ranges

**API Endpoints:**
```
GET /api/v1/income/sources                    # List all sources
GET /api/v1/income/sources/{id}               # Get details
GET /api/v1/income/summary/monthly            # Income by month
GET /api/v1/income/summary/quarterly          # Income by quarter
GET /api/v1/income/summary/yearly             # Income by year
GET /api/v1/income/summary/range?start=&end=  # Custom range
POST /api/v1/income/sources                   # Create
PUT /api/v1/income/sources/{id}               # Update
DELETE /api/v1/income/sources/{id}            # Archive
```

### 1.4 Income Analytics

#### Growth Trends
- Year-over-year income comparison
- Month-over-month growth rate
- Trend line prediction

#### Income Source Diversification
- Pie chart: % breakdown by source type
- Bar chart: Contribution by each source
- Risk assessment: Dependency on single source

#### Predicted Income
- Next month projection based on recurring income
- 12-month forecast
- Confidence interval (based on historical variability)

**Algorithm:**
```
Predicted Income = Sum(recurring_income) + Average(one_time_income)
Confidence = 1 - (StdDev / Mean)  # Higher = more predictable
```

---

## Part 2: Expense Management Module

### 2.1 Expense Categories (Enhanced)

**Predefined Categories:**
```
Fixed Expenses
├── Rent/Mortgage
├── Insurance (auto, health, home, life)
├── Utilities (electricity, water, gas)
├── Subscriptions
├── Phone & Internet
└── Loan Payments

Variable Expenses
├── Groceries
├── Dining & Restaurants
├── Transportation (gas, public transit)
├── Shopping
├── Entertainment
├── Healthcare & Medical
└── Personal Care

Discretionary
├── Hobbies
├── Gifts & Donations
├── Travel & Vacations
└── Entertainment Events
```

**Features:**
- User can create custom categories
- Set category-level budgets
- Tag expenses (for analytics)
- Track recurring vs. one-time

### 2.2 Budget Allocation

**Budget Management:**
```
Budget
├── id: UUID
├── user_id: UUID
├── category_id: UUID
├── period: enum [MONTHLY, QUARTERLY, YEARLY]
├── amount: decimal (budget limit)
├── spending_so_far: decimal (calculated)
├── percentage_used: decimal (spending_so_far / amount)
├── status: enum [UNDER, AT_LIMIT, OVER]
├── created_at: datetime
├── updated_at: datetime
```

**Overspend Alerts:**
- Alert at 80% of budget
- Alert at 100% (at limit)
- Alert when exceeded
- Daily/Weekly digest of budgets at risk

**API Endpoints:**
```
POST /api/v1/budgets                       # Create budget
PUT /api/v1/budgets/{id}                   # Update limit
GET /api/v1/budgets                        # List all budgets
GET /api/v1/budgets/{id}/status            # Current status
GET /api/v1/budgets/{id}/alerts            # Alert history
```

### 2.3 Expense Analytics

#### Spending Patterns
- Daily/Weekly/Monthly spending pace
- Seasonal trends (holiday spending, summer travel)
- Anomaly detection (unusual purchases)

#### Category-wise Breakdowns
- Pie chart: % of total spending per category
- Bar chart: Absolute amounts
- Time-series: How category spending changes over time

#### Month-over-Month Comparisons
- Jan vs Dec: Holiday impact
- Year-ago comparison: Inflation analysis
- Budget variance: Planned vs actual

#### Cost-saving Opportunities
- Subscriptions analysis: Identify unused services
- Category recommendations: "People in your area spend X% on Y"
- Optimization: "You could save $X by reducing Z by 10%"

---

## Part 3: Liabilities Tracker

### 3.1 Debt Management

**Debt Types:**
```
Debt
├── id: UUID
├── user_id: UUID
├── name: string (e.g., "Chase Credit Card", "Student Loan")
├── type: enum [CREDIT_CARD, STUDENT_LOAN, AUTO_LOAN, PERSONAL_LOAN, MORTGAGE, OTHER]
├── original_amount: decimal
├── current_balance: decimal
├── interest_rate: decimal (APR %)
├── min_payment: decimal (monthly)
├── due_date: int (day of month)
├── status: enum [ACTIVE, PAID_OFF, CLOSED]
├── created_at: datetime
├── updated_at: datetime
```

**Features:**
- Add multiple debts with interest rates
- Track minimum payments and due dates
- Automatically calculate interest accrual
- Detect missed/upcoming payments

**Credit Card Specific:**
```
CreditCard extends Debt
├── credit_limit: decimal
├── utilization_ratio: decimal (current_balance / credit_limit)
├── payment_history: decimal (0-100, estimated)
└── grace_period_days: int
```

### 3.2 Debt Payoff Calculator

**Payoff Methods:**

**Snowball Method:**
```
1. Sort by balance (smallest first)
2. Pay minimum on all debts
3. Apply extra to smallest debt
4. Once paid, redirect payment to next smallest

Advantage: Psychological wins, quick early payoffs
Disadvantage: More interest paid overall
```

**Avalanche Method:**
```
1. Sort by interest rate (highest first)
2. Pay minimum on all debts
3. Apply extra to highest interest rate
4. Once paid, redirect payment to next highest

Advantage: Less total interest paid
Disadvantage: Slower initial wins
```

**API Endpoints:**
```
GET /api/v1/debts                                # List all debts
GET /api/v1/debts/payoff-calculator
    ?method=snowball|avalanche
    &extra_payment=500                           # Monthly extra payment
GET /api/v1/debts/payoff-comparison             # Compare both methods
GET /api/v1/debts/{id}/projected-payoff        # Individual debt projection
```

**Output Example:**
```json
{
  "method": "snowball",
  "debts": [
    {
      "id": "card-1",
      "name": "Chase Credit Card",
      "current_balance": 5000,
      "interest_rate": 22.5,
      "payoff_date": "2027-03-15",
      "months_to_payoff": 24,
      "total_interest_paid": 2250,
      "total_cost": 7250
    }
  ],
  "total_payoff_date": "2028-12-31",
  "total_months": 36,
  "total_interest": 8500,
  "total_cost": 58500
}
```

### 3.3 Credit Utilization

**Tracking:**
```
CreditUtilization
├── credit_card_id: UUID
├── utilization_ratio: decimal (0-100%)
├── recommended_max: decimal (30% of credit_limit)
├── impact_on_score: string (analysis)
└── optimization_suggestions: string[]
```

**Factors Impacting Credit Score:**
- Utilization < 30%: Excellent
- Utilization 30-50%: Good
- Utilization 50-80%: Fair
- Utilization > 80%: Poor

---

## Part 4: Equity/Net Worth Dashboard

### 4.1 Assets

**Asset Types:**
```
Asset
├── id: UUID
├── user_id: UUID
├── name: string
├── type: enum [CASH, SAVINGS, CHECKING, STOCKS, BONDS, RETIREMENT_401K, 
                RETIREMENT_IRA, CRYPTO, REAL_ESTATE, VEHICLE, OTHER]
├── value: decimal (current market value)
├── currency: string (USD, EUR, etc.)
├── institution: string (Bank name, Brokerage)
├── date_added: date
├── notes: string
├── created_at: datetime
├── updated_at: datetime
```

**Features:**
- Add assets across categories
- Track market value changes over time
- Categorize for portfolio analysis
- Manual or API-connected (future)

**Asset Groupings:**
```
Liquid Assets = Cash + Savings + Checking
Investments = Stocks + Bonds + Crypto + Retirement Accounts
Real Assets = Real Estate + Vehicles + Other
```

### 4.2 Net Worth Calculation

**Formula:**
```
Net Worth = Total Assets - Total Liabilities

Total Assets = Sum of all asset values
Total Liabilities = Sum of all debt balances

Components:
├── Liquid Assets: Immediately accessible
├── Investments: Medium/long-term holdings
├── Real Assets: Illiquid, slower to convert
└── (Minus)
├── High-interest Debt: Credit cards, personal loans
├── Mortgages: Real estate debt
└── Other Liabilities: Car loans, student loans
```

**API Endpoint:**
```
GET /api/v1/net-worth/current              # Current snapshot
GET /api/v1/net-worth/breakdown            # Assets vs Liabilities breakdown
GET /api/v1/net-worth/trends               # Historical view
```

**Response:**
```json
{
  "timestamp": "2026-01-25",
  "total_assets": 450000,
  "total_liabilities": 250000,
  "net_worth": 200000,
  "breakdown": {
    "assets": {
      "liquid": 75000,
      "investments": 250000,
      "real_estate": 125000
    },
    "liabilities": {
      "credit_cards": 15000,
      "student_loans": 50000,
      "mortgage": 185000
    }
  }
}
```

### 4.3 Net Worth Trends

**Tracking:**
```
NetWorthHistory
├── user_id: UUID
├── snapshot_date: date
├── total_assets: decimal
├── total_liabilities: decimal
├── net_worth: decimal
├── asset_breakdown: json
└── liability_breakdown: json
```

**Visualization:**
- Line chart: Net worth over 1, 5, 10 years
- Stacked area: Asset/liability composition over time
- Growth rate: % change month-over-month
- Projection: Estimated net worth in 5, 10, 30 years

### 4.4 Financial Health Score

**Scoring Components:**

```
Financial Health Score (0-100)

1. Debt-to-Income Ratio (25 points)
   = Total Monthly Debt Payments / Gross Monthly Income
   < 15% = 25 points (Excellent)
   15-35% = 20 points (Good)
   35-50% = 10 points (Fair)
   > 50% = 0 points (Poor)

2. Emergency Fund Status (25 points)
   = Liquid Assets / Monthly Expenses
   ≥ 6 months = 25 points (Excellent)
   3-6 months = 20 points (Good)
   1-3 months = 10 points (Fair)
   < 1 month = 0 points (Poor)

3. Savings Rate (25 points)
   = Monthly Savings / Gross Monthly Income
   ≥ 20% = 25 points (Excellent)
   10-20% = 20 points (Good)
   5-10% = 10 points (Fair)
   < 5% = 0 points (Poor)

4. Net Worth Growth (25 points)
   = YoY Net Worth Change %
   ≥ 10% = 25 points
   5-10% = 20 points
   0-5% = 10 points
   Negative = 0 points

Total Score = Sum of all components
```

**Score Interpretation:**
- 90-100: Excellent financial health
- 75-90: Good financial health
- 60-75: Fair financial health (need improvement)
- 45-60: Poor financial health (needs attention)
- < 45: Critical financial health (urgent action needed)

**Recommendations Based on Score:**
```
If Score < 45:
  → "Build emergency fund immediately"
  → "Prioritize high-interest debt payoff"
  → "Reduce discretionary spending"

If Score 45-60:
  → "Increase savings rate to 10%"
  → "Consider debt consolidation"
  → "Create monthly budget"

If Score 60-75:
  → "Build emergency fund to 6 months"
  → "Start investing for retirement"
  → "Review insurance coverage"

If Score > 75:
  → "Consider diversifying investments"
  → "Plan for major purchases"
  → "Optimize tax strategy"
```

---

## Technical Requirements

### Database Schema
See Technical Architecture document (separate)

### API Endpoints Summary
```
Income Management:
  POST   /api/v1/income/sources
  GET    /api/v1/income/sources
  GET    /api/v1/income/sources/{id}
  PUT    /api/v1/income/sources/{id}
  DELETE /api/v1/income/sources/{id}
  GET    /api/v1/income/summary/{period}

Budgets:
  POST   /api/v1/budgets
  GET    /api/v1/budgets
  PUT    /api/v1/budgets/{id}
  GET    /api/v1/budgets/{id}/status

Debts:
  POST   /api/v1/debts
  GET    /api/v1/debts
  PUT    /api/v1/debts/{id}
  GET    /api/v1/debts/payoff-calculator
  GET    /api/v1/debts/payoff-comparison

Assets:
  POST   /api/v1/assets
  GET    /api/v1/assets
  PUT    /api/v1/assets/{id}

Net Worth:
  GET    /api/v1/net-worth/current
  GET    /api/v1/net-worth/breakdown
  GET    /api/v1/net-worth/trends
  GET    /api/v1/net-worth/score
```

### Authentication & Authorization
- All endpoints require `Authorization: Bearer {token}`
- Users can only access their own data
- Admin endpoints for support team

### Error Handling
- Validate all inputs
- Return meaningful error messages
- Use startup validation for schema alignment

### Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- Comprehensive test suite for financial calculations
- Load testing for analytics endpoints

---

## Rollout Timeline

### Phase 2a: Foundation (Month 1-2)
- [ ] Database schema implementation
- [ ] Income tracking models and APIs
- [ ] Basic expense enhancements
- [ ] Comprehensive test suite

### Phase 2b: Advanced Features (Month 2-3)
- [ ] Debt management system
- [ ] Payoff calculator
- [ ] Asset tracking

### Phase 2c: Analytics & Reporting (Month 3-4)
- [ ] Net worth dashboard
- [ ] Financial health score
- [ ] Trend analysis
- [ ] Mobile optimization

### Phase 2d: Production Hardening (Month 4)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation

---

## Success Metrics

- User engagement: 70% of users add income sources within first month
- Financial literacy: Users increase savings rate by average 5%
- Platform reliability: 99.9% uptime
- Performance: All analytics queries < 500ms
- User satisfaction: NPS > 50

---

## Document Control

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | Jan 2026 | Product Team | Initial draft |
| 2.0 | Jan 2026 | Product Team | Final review |