# SpendWise SA - Backend Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Data Models](#data-models)
7. [Service Layer](#service-layer)
8. [Error Handling](#error-handling)
9. [Development Guide](#development-guide)

---

## System Overview

SpendWise SA is a comprehensive personal finance management platform built with:
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with AsyncPG
- **ORM**: SQLAlchemy 2.0.23
- **Async**: Full async/await support
- **Authentication**: JWT tokens with python-jose
- **Validation**: Pydantic 1.10.13

### Core Features
- Income tracking and predictions
- Debt management with payoff strategies
- Asset management and net worth tracking
- Financial goal setting and tracking
- Advanced analytics and insights
- Financial health scoring

---

## Architecture

### Layered Architecture

\\\
┌─────────────────────────────────────┐
│         API Layer (FastAPI)         │
│    /api/v1/endpoints/*.py           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Service Layer (Business Logic) │
│    /app/services/*.py               │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│    Schema Layer (Validation)        │
│    /app/schemas/*.py                │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Model Layer (Database)         │
│    /app/models/*.py                 │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         PostgreSQL Database         │
└─────────────────────────────────────┘
\\\

### Directory Structure

\\\
spendwise-sa/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── accounts.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── budgets.py
│   │   │   │   ├── categories.py
│   │   │   │   ├── payment_methods.py
│   │   │   │   ├── transactions.py
│   │   │   │   ├── income.py
│   │   │   │   ├── debt.py
│   │   │   │   ├── net_worth.py
│   │   │   │   └── analytics.py
│   │   │   └── deps.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── deps.py
│   │   └── security.py
│   ├── models/
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── budget.py
│   │   ├── category.py
│   │   ├── payment_method.py
│   │   ├── transaction.py
│   │   ├── income.py
│   │   ├── debt.py
│   │   ├── asset.py
│   │   ├── net_worth.py
│   │   ├── goal.py
│   │   └── analytics.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── budget.py
│   │   ├── transaction.py
│   │   ├── income.py
│   │   ├── debt.py
│   │   ├── asset.py
│   │   └── analytics.py
│   ├── services/
│   │   ├── income_service.py
│   │   ├── debt_service.py
│   │   ├── net_worth_service.py
│   │   ├── analytics_service.py
│   │   └── cache_service.py
│   ├── tests/
│   │   └── *.py
│   └── main.py
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_setup.py
│   │   ├── 002_add_transactions.py
│   │   ├── 003_add_income_tracking.py
│   │   ├── 004_add_debt_management.py
│   │   └── 005_add_asset_net_worth.py
│   └── env.py
└── docker-compose.yml
\\\

---

## Authentication

### JWT Token Flow

1. **User Registration** → POST /api/v1/auth/register
2. **User Login** → POST /api/v1/auth/login
3. **Receive JWT Token** → {access_token, token_type}
4. **API Requests** → Authorization: Bearer {token}

### Securing Requests

All API endpoints require JWT authentication:

\\\python
from app.core.deps import get_current_user

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id}
\\\

### Token Details

- **Type**: Bearer Token
- **Algorithm**: HS256
- **Expiry**: Configurable in .env
- **Scope**: User-specific (user_id in token)

---

## Database Schema

### Core Tables

#### users
\\\sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
\\\

#### accounts
\\\sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance NUMERIC(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### transactions
\\\sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    account_id UUID FOREIGN KEY,
    category_id UUID FOREIGN KEY,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL (EXPENSE/INCOME),
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### income_sources
\\\sql
CREATE TABLE income_sources (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### income_history
\\\sql
CREATE TABLE income_history (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    income_source_id UUID FOREIGN KEY,
    amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2),
    received_date DATE NOT NULL,
    is_manual_entry BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### debt_accounts
\\\sql
CREATE TABLE debt_accounts (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    current_balance NUMERIC(12,2) NOT NULL,
    credit_limit NUMERIC(12,2),
    interest_rate NUMERIC(5,2) NOT NULL,
    due_date INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### debt_payments
\\\sql
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    debt_account_id UUID FOREIGN KEY,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### assets
\\\sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL,
    is_liquid BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

#### goals
\\\sql
CREATE TABLE goals (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    priority INTEGER DEFAULT 5,
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
\\\

---

## API Reference

### Authentication Endpoints

#### Register User
\\\
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

Response 201:
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true
}
\\\

#### Login
\\\
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response 200:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
\\\

### Income Endpoints

#### Create Income Source
\\\
POST /api/v1/income/sources
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Primary Salary",
  "type": "SALARY",
  "frequency": "MONTHLY",
  "amount": "5000.00",
  "is_recurring": true,
  "is_taxable": true
}

Response 201:
{
  "id": "uuid",
  "name": "Primary Salary",
  "type": "SALARY",
  "frequency": "MONTHLY",
  "amount": "5000.00",
  "is_recurring": true,
  "is_active": true,
  "created_at": "2026-01-28T10:00:00Z"
}
\\\

#### List Income Sources
\\\
GET /api/v1/income/sources?active_only=true
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "name": "Primary Salary",
    "type": "SALARY",
    "amount": "5000.00",
    "is_recurring": true
  }
]
\\\

#### Record Income
\\\
POST /api/v1/income/history
Authorization: Bearer {token}
Content-Type: application/json

{
  "income_source_id": "uuid",
  "amount": "5000.00",
  "received_date": "2026-01-28",
  "tax_amount": "1000.00"
}

Response 201:
{
  "id": "uuid",
  "income_source_id": "uuid",
  "amount": "5000.00",
  "tax_amount": "1000.00",
  "received_date": "2026-01-28",
  "is_manual_entry": true
}
\\\

#### Get Monthly Summary
\\\
GET /api/v1/income/summary/2026/1
Authorization: Bearer {token}

Response 200:
{
  "year": 2026,
  "month": 1,
  "total_income": "10000.00",
  "total_tax": "2000.00",
  "net_income": "8000.00",
  "recurring_income": "10000.00",
  "one_time_income": "0.00"
}
\\\

#### Get Annual Statistics
\\\
GET /api/v1/income/stats?year=2026
Authorization: Bearer {token}

Response 200:
{
  "total_annual_income": "120000.00",
  "average_monthly_income": "10000.00",
  "predicted_next_month": "10000.00",
  "total_tax_paid": "24000.00",
  "net_annual_income": "96000.00",
  "recurring_income_count": 2,
  "one_time_income_count": 0,
  "top_source_name": "Primary Salary",
  "top_source_amount": "60000.00"
}
\\\

### Debt Endpoints

#### Create Debt Account
\\\
POST /api/v1/debts/accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Chase Credit Card",
  "type": "CREDIT_CARD",
  "creditor_name": "Chase Bank",
  "current_balance": "5000.00",
  "credit_limit": "10000.00",
  "interest_rate": "19.99",
  "minimum_payment": "150.00",
  "due_date": 15,
  "start_date": "2026-01-01"
}

Response 201:
{
  "id": "uuid",
  "name": "Chase Credit Card",
  "type": "CREDIT_CARD",
  "current_balance": "5000.00",
  "credit_limit": "10000.00",
  "interest_rate": "19.99",
  "is_active": true
}
\\\

#### List Debt Accounts
\\\
GET /api/v1/debts/accounts?active_only=true
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "name": "Chase Credit Card",
    "type": "CREDIT_CARD",
    "current_balance": "5000.00",
    "interest_rate": "19.99"
  }
]
\\\

#### Record Debt Payment
\\\
POST /api/v1/debts/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "debt_account_id": "uuid",
  "amount": "500.00",
  "payment_date": "2026-01-28",
  "payment_method": "BANK_TRANSFER"
}

Response 201:
{
  "id": "uuid",
  "debt_account_id": "uuid",
  "amount": "500.00",
  "payment_date": "2026-01-28",
  "payment_method": "BANK_TRANSFER"
}
\\\

#### Get Debt Summary
\\\
GET /api/v1/debts/summary
Authorization: Bearer {token}

Response 200:
{
  "total_debt": "50000.00",
  "total_paid_this_month": "1000.00",
  "total_interest_accrued": "500.00",
  "account_count": 3,
  "active_accounts": 2,
  "avg_interest_rate": "15.50"
}
\\\

#### Calculate Payoff Strategy
\\\
GET /api/v1/debts/payoff-strategy?strategy_type=SNOWBALL
Authorization: Bearer {token}

Response 200:
{
  "strategy_type": "SNOWBALL",
  "accounts_in_order": [
    {
      "id": "uuid",
      "name": "Small Personal Loan",
      "balance": 1000.00,
      "interest_rate": 15.00,
      "payoff_order": 1
    }
  ],
  "estimated_total_months": 24,
  "estimated_total_interest": "2500.00",
  "monthly_payment_required": "300.00",
  "potential_savings": "1000.00"
}
\\\

### Asset Endpoints

#### Create Asset
\\\
POST /api/v1/net-worth/assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Home",
  "type": "REAL_ESTATE",
  "current_value": "300000.00",
  "last_valued_date": "2026-01-28",
  "is_liquid": false
}

Response 201:
{
  "id": "uuid",
  "name": "Home",
  "type": "REAL_ESTATE",
  "current_value": "300000.00",
  "is_liquid": false,
  "is_active": true
}
\\\

#### Get Net Worth Dashboard
\\\
GET /api/v1/net-worth/dashboard
Authorization: Bearer {token}

Response 200:
{
  "total_assets": "500000.00",
  "total_liabilities": "200000.00",
  "net_worth": "300000.00",
  "debt_to_assets_ratio": "40.00",
  "debt_to_income_ratio": "2.50",
  "total_income": "80000.00",
  "cash_value": "50000.00",
  "investments_value": "150000.00",
  "real_estate_value": "300000.00"
}
\\\

### Goal Endpoints

#### Create Goal
\\\
POST /api/v1/analytics/goals
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Emergency Fund",
  "type": "EMERGENCY_FUND",
  "target_amount": "10000.00",
  "target_date": "2026-12-31",
  "priority": 10
}

Response 201:
{
  "id": "uuid",
  "name": "Emergency Fund",
  "type": "EMERGENCY_FUND",
  "target_amount": "10000.00",
  "current_amount": "0.00",
  "status": "NOT_STARTED",
  "progress_percentage": "0.00",
  "priority": 10
}
\\\

#### Get Financial Health Score
\\\
GET /api/v1/analytics/health-score
Authorization: Bearer {token}

Response 200:
{
  "overall_score": "80.00",
  "net_worth_score": "85.00",
  "debt_health_score": "75.00",
  "savings_score": "80.00",
  "goal_achievement_score": "70.00",
  "spending_score": "85.00",
  "recommendations": [
    "Focus on reducing high-interest debt",
    "Increase emergency fund savings"
  ]
}
\\\

---

## Data Models

### User Model
\\\python
class User(Base):
    id: UUID
    email: str
    hashed_password: str
    full_name: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    
    # Relationships
    accounts: List[Account]
    budgets: List[Budget]
    income_sources: List[IncomeSource]
    income_history: List[IncomeHistory]
    debt_accounts: List[DebtAccount]
    debt_payments: List[DebtPayment]
    assets: List[Asset]
    goals: List[Goal]
    insights: List[FinancialInsight]
\\\

### Income Models
\\\python
class IncomeSource(Base):
    id: UUID
    name: str
    type: IncomeType  # SALARY, FREELANCE, INVESTMENT, PASSIVE, CUSTOM, OTHER
    frequency: Frequency  # DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
    amount: Decimal
    is_recurring: bool
    is_taxable: bool
    auto_tax_calculation: bool
    tax_rate: Decimal
    is_active: bool

class IncomeHistory(Base):
    id: UUID
    income_source_id: UUID
    amount: Decimal
    tax_amount: Optional[Decimal]
    received_date: date
    is_manual_entry: bool
\\\

### Debt Models
\\\python
class DebtAccount(Base):
    id: UUID
    name: str
    type: DebtType  # CREDIT_CARD, PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, STUDENT_LOAN, OTHER
    creditor_name: Optional[str]
    current_balance: Decimal
    credit_limit: Optional[Decimal]
    interest_rate: Decimal
    minimum_payment: Optional[Decimal]
    due_date: Optional[int]
    start_date: date
    payoff_date: Optional[date]
    is_active: bool

class DebtPayment(Base):
    id: UUID
    debt_account_id: UUID
    amount: Decimal
    payment_date: date
    payment_method: Optional[str]
\\\

### Asset Models
\\\python
class Asset(Base):
    id: UUID
    name: str
    type: AssetType  # CASH, SAVINGS, INVESTMENT, REAL_ESTATE, VEHICLE, etc
    current_value: Decimal
    purchase_price: Optional[Decimal]
    purchase_date: Optional[date]
    last_valued_date: date
    is_liquid: bool
    is_active: bool

class AssetValuation(Base):
    id: UUID
    asset_id: UUID
    valuation_date: date
    value: Decimal
\\\

### Goal Models
\\\python
class Goal(Base):
    id: UUID
    name: str
    type: GoalType  # DEBT_PAYOFF, SAVINGS, INVESTMENT, RETIREMENT, etc
    target_amount: Decimal
    current_amount: Decimal
    target_date: date
    status: str  # NOT_STARTED, IN_PROGRESS, ON_TRACK, COMPLETED
    priority: int  # 1-10
    progress_percentage: Decimal
    is_active: bool

class Milestone(Base):
    id: UUID
    goal_id: UUID
    name: str
    target_amount: Decimal
    target_date: date
    is_completed: bool
    completed_date: Optional[date]
\\\

---

## Service Layer

### IncomeService
\\\python
class IncomeService:
    async def create_income_source(user_id, data)
    async def list_income_sources(user_id, active_only)
    async def get_income_source(user_id, source_id)
    async def update_income_source(user_id, source_id, data)
    async def deactivate_income_source(user_id, source_id)
    
    async def record_income(user_id, data)
    async def get_income_history(user_id, filters)
    
    async def get_monthly_summary(user_id, year, month)
    async def predict_next_month_income(user_id)
    async def get_income_stats(user_id, year)
\\\

### DebtService
\\\python
class DebtService:
    async def create_debt_account(user_id, data)
    async def list_debt_accounts(user_id, active_only)
    async def get_debt_account(user_id, account_id)
    async def update_debt_account(user_id, account_id, data)
    async def deactivate_debt_account(user_id, account_id)
    
    async def record_payment(user_id, data)
    async def get_payment_history(user_id, filters)
    
    async def get_debt_summary(user_id, year, month)
    async def get_debt_stats(user_id, year)
    async def calculate_payoff_strategy(user_id, strategy_type)
\\\

### NetWorthService
\\\python
class NetWorthService:
    async def create_asset(user_id, data)
    async def list_assets(user_id)
    async def get_asset(user_id, asset_id)
    async def update_asset(user_id, asset_id, data)
    
    async def record_valuation(user_id, data)
    async def calculate_net_worth(user_id)
    async def get_net_worth_history(user_id, months)
\\\

### AnalyticsService
\\\python
class AnalyticsService:
    async def create_goal(user_id, data)
    async def list_goals(user_id)
    async def get_goal(user_id, goal_id)
    async def update_goal_progress(user_id, goal_id, amount)
    
    async def create_milestone(user_id, data)
    async def complete_milestone(user_id, milestone_id, amount)
    
    async def generate_insights(user_id)
    async def calculate_health_score(user_id)
    async def get_financial_forecast(user_id, months)
\\\

---

## Error Handling

### Standard Error Responses

#### 400 Bad Request
\\\json
{
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
\\\

#### 401 Unauthorized
\\\json
{
  "detail": "Not authenticated"
}
\\\

#### 403 Forbidden
\\\json
{
  "detail": "Not enough permissions"
}
\\\

#### 404 Not Found
\\\json
{
  "detail": "Resource not found"
}
\\\

#### 422 Validation Error
\\\json
{
  "detail": [
    {
      "loc": ["body", "amount"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
\\\

#### 500 Server Error
\\\json
{
  "detail": "Internal server error"
}
\\\

---

## Development Guide

### Setting Up Development Environment

1. **Clone Repository**
\\\ash
git clone <repository>
cd spendwise-sa
\\\

2. **Create Virtual Environment**
\\\ash
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate       # Unix
\\\

3. **Install Dependencies**
\\\ash
pip install -r requirements.txt
\\\

4. **Configure Environment**
\\\ash
cp .env.example .env
# Edit .env with your settings
\\\

5. **Run Migrations**
\\\ash
alembic upgrade head
\\\

6. **Start Development Server**
\\\ash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\\\

### Database Migrations

**Create New Migration**
\\\ash
alembic revision --autogenerate -m "Add new column"
\\\

**Apply Migration**
\\\ash
alembic upgrade head
\\`\bash
**Rollback Migration**
\\\ash
alembic downgrade -1
\\\

### Testing

**Run All Tests**
\\\ash
pytest
\\`\bash
**Run Specific Test**
\\\ash
pytest app/tests/test_income.py -v
\\`\bash
**Run with Coverage**
\\`\ash
pytest --cov=app
\\`\

### API Documentation

Auto-generated Swagger UI available at:
- \http://localhost:8000/api/v1/docs\
- \http://localhost:8000/api/v1/redoc\ (ReDoc)

### Docker Deployment

**Build and Run**
\\\ash
docker-compose build
docker-compose up -d
\\`\`

**Stop Services**
\\\ash
docker-compose down
\\`\`

---

## Key Enums & Constants

### Income Types
- SALARY
- FREELANCE
- INVESTMENT
- PASSIVE
- CUSTOM
- OTHER

### Debt Types
- CREDIT_CARD
- PERSONAL_LOAN
- AUTO_LOAN
- MORTGAGE
- STUDENT_LOAN
- OTHER

### Asset Types
- CASH
- SAVINGS_ACCOUNT
- CHECKING_ACCOUNT
- INVESTMENT_ACCOUNT
- RETIREMENT_ACCOUNT
- REAL_ESTATE
- VEHICLE
- CRYPTOCURRENCY
- PRECIOUS_METALS
- COLLECTIBLES
- BUSINESS
- OTHER

### Goal Types
- DEBT_PAYOFF
- SAVINGS
- INVESTMENT
- RETIREMENT
- HOME_PURCHASE
- EDUCATION
- EMERGENCY_FUND
- VACATION
- VEHICLE
- OTHER

### Payment Methods
- BANK_TRANSFER
- CHECK
- CREDIT_CARD
- AUTO_PAY
- OTHER

### Frequencies
- DAILY
- WEEKLY
- BIWEEKLY
- MONTHLY
- QUARTERLY
- YEARLY

---

## Performance Considerations

1. **Pagination**: List endpoints support skip/limit parameters
2. **Caching**: Redis caching for frequently accessed data
3. **Indexing**: Database indexes on user_id and date fields
4. **Aggregation**: SQL-level aggregation for analytics
5. **Connection Pooling**: Database connection pooling enabled

---

## Security Considerations

1. **Password Hashing**: bcrypt with salt
2. **JWT Tokens**: HS256 algorithm with expiration
3. **CORS**: Configurable origin restrictions
4. **SQL Injection**: Protected via ORM (SQLAlchemy)
5. **Rate Limiting**: Configurable per endpoint
6. **Input Validation**: Pydantic schema validation

---

## Common Use Cases

### Track Monthly Budget
1. Get income summary: GET /api/v1/income/summary/{year}/{month}
2. Get transactions: GET /api/v1/transactions
3. Compare income vs expenses

### Monitor Debt Payoff
1. List debts: GET /api/v1/debts/accounts
2. Get payoff strategy: GET /api/v1/debts/payoff-strategy
3. Record payments: POST /api/v1/debts/payments

### Track Net Worth
1. Get assets: GET /api/v1/net-worth/assets
2. Get dashboard: GET /api/v1/net-worth/dashboard
3. View history: GET /api/v1/net-worth/history

### Achieve Financial Goals
1. Create goal: POST /api/v1/analytics/goals
2. Track progress: GET /api/v1/analytics/goals/{id}
3. Get health score: GET /api/v1/analytics/health-score

---

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL in .env
- Check PostgreSQL service is running
- Ensure user has proper permissions

### Authentication Failures
- Verify JWT token not expired
- Check Authorization header format
- Ensure token includes Bearer prefix

### Validation Errors
- Check request body matches schema
- Verify data types (string, number, date)
- Check required fields are present

### Performance Issues
- Check database indexes
- Review query patterns
- Enable caching
- Check connection pool size

---

## Support & Contact

For issues or questions:
- Create GitHub issue
- Contact development team
- Check documentation
- Review API logs

---

**Last Updated**: January 28, 2026
**Version**: 3.0
**Status**: Production Ready
