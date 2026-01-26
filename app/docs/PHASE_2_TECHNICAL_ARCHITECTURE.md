# SpendWise SA - Phase 2: Technical Architecture
## Personal Finance Module - System Design

---

## Database Schema

### Income Module

```sql
-- Income source tracking
CREATE TABLE income_sources (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- SALARY, FREELANCE, INVESTMENT, PASSIVE, OTHER
    frequency VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_recurring BOOLEAN DEFAULT TRUE,
    is_taxable BOOLEAN DEFAULT TRUE,
    tax_category VARCHAR(50), -- INCOME_TAX, CAPITAL_GAINS_SHORT, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT chk_amount CHECK (amount > 0),
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date),
    INDEX idx_user_created (user_id, created_at)
);

-- Income history for analytics
CREATE TABLE income_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    income_source_id UUID REFERENCES income_sources(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    received_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_received (user_id, received_date)
);

-- Monthly income summary (denormalized for performance)
CREATE TABLE income_monthly_summary (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    total_income DECIMAL(12,2) NOT NULL,
    recurring_income DECIMAL(12,2) NOT NULL,
    one_time_income DECIMAL(12,2) NOT NULL,
    source_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, year, month),
    INDEX idx_user_period (user_id, year, month)
);
```

### Budget Module (Enhanced)

```sql
-- Budgets with per-category limits
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, YEARLY
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT chk_budget_amount CHECK (amount > 0),
    UNIQUE(user_id, category_id, period, start_date),
    INDEX idx_user_active (user_id, is_active)
);

-- Budget alerts
CREATE TABLE budget_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- AT_80, AT_100, EXCEEDED
    current_spending DECIMAL(12,2) NOT NULL,
    percentage_used DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_created (user_id, created_at)
);
```

### Debt Module

```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- CREDIT_CARD, STUDENT_LOAN, AUTO_LOAN, PERSONAL_LOAN, MORTGAGE, OTHER
    original_amount DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL, -- APR as percentage
    min_payment DECIMAL(12,2),
    due_date INT, -- Day of month
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAID_OFF, CLOSED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT chk_balance CHECK (current_balance >= 0),
    CONSTRAINT chk_rate CHECK (interest_rate >= 0),
    CONSTRAINT chk_due_date CHECK (due_date IS NULL OR (due_date >= 1 AND due_date <= 31)),
    INDEX idx_user_status (user_id, status)
);

-- Credit card specific fields
CREATE TABLE credit_cards (
    debt_id UUID PRIMARY KEY REFERENCES debts(id) ON DELETE CASCADE,
    credit_limit DECIMAL(12,2) NOT NULL,
    utilization_ratio DECIMAL(5,2) GENERATED ALWAYS AS (current_balance / credit_limit * 100),
    grace_period_days INT DEFAULT 21,
    CONSTRAINT chk_limit CHECK (credit_limit > 0)
);

-- Debt payment history
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    principal DECIMAL(12,2) NOT NULL,
    interest DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_debt (user_id, debt_id, payment_date)
);
```

### Asset Module

```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- CASH, SAVINGS, CHECKING, STOCKS, BONDS, RETIREMENT_401K, etc.
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    institution VARCHAR(255), -- Bank/Brokerage name
    date_added DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT chk_value CHECK (value >= 0),
    INDEX idx_user_type (user_id, type)
);

-- Asset value history for net worth tracking
CREATE TABLE asset_value_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL,
    date_recorded DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(asset_id, date_recorded),
    INDEX idx_user_date (user_id, date_recorded)
);
```

### Net Worth Module

```sql
-- Net worth snapshots (calculated daily)
CREATE TABLE net_worth_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_assets DECIMAL(15,2) NOT NULL,
    total_liabilities DECIMAL(15,2) NOT NULL,
    net_worth DECIMAL(15,2) NOT NULL,
    asset_breakdown JSON NOT NULL, -- {liquid: X, investments: Y, real_estate: Z}
    liability_breakdown JSON NOT NULL, -- {credit_cards: X, student_loans: Y, mortgage: Z}
    health_score INT, -- 0-100
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date),
    INDEX idx_user_date (user_id, snapshot_date)
);

-- Financial health score components
CREATE TABLE financial_health_scores (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    debt_to_income_score INT, -- 0-25
    emergency_fund_score INT, -- 0-25
    savings_rate_score INT, -- 0-25
    net_worth_growth_score INT, -- 0-25
    total_score INT, -- 0-100
    recommendations JSON, -- Array of recommendations
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date),
    INDEX idx_user_date (user_id, snapshot_date)
);
```

---

## API Models & Schemas

### Income Module Schemas

```python
# app/schemas/income.py

from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

class IncomeType(str, Enum):
    SALARY = "SALARY"
    FREELANCE = "FREELANCE"
    INVESTMENT = "INVESTMENT"
    PASSIVE = "PASSIVE"
    OTHER = "OTHER"

class IncomeFrequency(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"

class TaxCategory(str, Enum):
    INCOME_TAX = "INCOME_TAX"
    CAPITAL_GAINS_SHORT = "CAPITAL_GAINS_SHORT"
    CAPITAL_GAINS_LONG = "CAPITAL_GAINS_LONG"
    DIVIDEND = "DIVIDEND"
    SELF_EMPLOYMENT = "SELF_EMPLOYMENT"

class IncomeSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: IncomeType
    frequency: IncomeFrequency
    amount: Decimal = Field(..., gt=0)
    start_date: date
    end_date: Optional[date] = None
    is_recurring: bool = True
    is_taxable: bool = True
    tax_category: Optional[TaxCategory] = None
    notes: Optional[str] = Field(None, max_length=1000)

class IncomeSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    frequency: Optional[IncomeFrequency] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    end_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    is_taxable: Optional[bool] = None
    tax_category: Optional[TaxCategory] = None

class IncomeSourceInDB(IncomeSourceCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'

class IncomeSummary(BaseModel):
    period: str  # "2026-01" for monthly
    total_income: Decimal
    recurring_income: Decimal
    one_time_income: Decimal
    source_count: int
    sources: list[IncomeSourceInDB]
```

### Debt Module Schemas

```python
# app/schemas/debt.py

from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

class DebtType(str, Enum):
    CREDIT_CARD = "CREDIT_CARD"
    STUDENT_LOAN = "STUDENT_LOAN"
    AUTO_LOAN = "AUTO_LOAN"
    PERSONAL_LOAN = "PERSONAL_LOAN"
    MORTGAGE = "MORTGAGE"
    OTHER = "OTHER"

class DebtStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAID_OFF = "PAID_OFF"
    CLOSED = "CLOSED"

class DebtCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: DebtType
    original_amount: Decimal = Field(..., gt=0)
    current_balance: Decimal = Field(..., ge=0)
    interest_rate: Decimal = Field(..., ge=0, le=100)
    min_payment: Optional[Decimal] = Field(None, gt=0)
    due_date: Optional[int] = Field(None, ge=1, le=31)

class DebtInDB(DebtCreate):
    id: UUID
    user_id: UUID
    status: DebtStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    monthly_interest: Decimal  # Calculated: (current_balance * interest_rate / 100) / 12
    months_to_payoff: Optional[int]  # Calculated based on min_payment
    total_interest_to_pay: Decimal  # Calculated

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'

class PayoffCalculation(BaseModel):
    debt_id: UUID
    name: str
    current_balance: Decimal
    interest_rate: Decimal
    payoff_date: date
    months_to_payoff: int
    total_interest_paid: Decimal
    total_cost: Decimal

class PayoffComparison(BaseModel):
    snowball: list[PayoffCalculation]
    avalanche: list[PayoffCalculation]
    snowball_total_payoff_date: date
    avalanche_total_payoff_date: date
    snowball_total_months: int
    avalanche_total_months: int
    snowball_total_interest: Decimal
    avalanche_total_interest: Decimal
    interest_saved_with_avalanche: Decimal
```

### Net Worth Schemas

```python
# app/schemas/net_worth.py

from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class AssetBreakdown(BaseModel):
    liquid: Decimal
    investments: Decimal
    real_estate: Decimal
    vehicles: Decimal
    other: Decimal

class LiabilityBreakdown(BaseModel):
    credit_cards: Decimal
    student_loans: Decimal
    auto_loans: Decimal
    mortgages: Decimal
    personal_loans: Decimal
    other: Decimal

class NetWorthSnapshot(BaseModel):
    timestamp: datetime
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    asset_breakdown: AssetBreakdown
    liability_breakdown: LiabilityBreakdown

class FinancialHealthScore(BaseModel):
    score: int  # 0-100
    components: dict  # {debt_to_income: 20, emergency_fund: 25, ...}
    rating: str  # "Excellent", "Good", "Fair", "Poor", "Critical"
    recommendations: list[str]

class NetWorthTrend(BaseModel):
    date: date
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    growth_rate: Optional[float]  # % change from previous month
```

---

## Service Layer Architecture

### Income Service

```python
# app/services/income_service.py

class IncomeService:
    @staticmethod
    async def create_income_source(
        session: AsyncSession,
        user_id: UUID,
        income_in: IncomeSourceCreate
    ) -> IncomeSource:
        """Create new income source"""
        pass

    @staticmethod
    async def get_income_summary_monthly(
        session: AsyncSession,
        user_id: UUID,
        year: int,
        month: int
    ) -> IncomeSummary:
        """Get income summary for specific month"""
        # Group all income for the month
        # Calculate recurring vs one-time
        # Include all sources
        pass

    @staticmethod
    async def predict_next_month_income(
        session: AsyncSession,
        user_id: UUID
    ) -> dict:
        """Predict income for next month based on recurring income"""
        # Sum all recurring income
        # Add average one-time income from last 3 months
        # Calculate confidence level
        pass

    @staticmethod
    async def get_income_diversification(
        session: AsyncSession,
        user_id: UUID
    ) -> dict:
        """Analyze income source diversification"""
        # Calculate % of income from each source
        # Identify dependency risks
        # Recommend diversification
        pass
```

### Debt Service

```python
# app/services/debt_service.py

class DebtService:
    @staticmethod
    async def calculate_payoff_date(
        current_balance: Decimal,
        monthly_payment: Decimal,
        annual_interest_rate: Decimal
    ) -> date:
        """Calculate payoff date using compound interest formula"""
        # n = -log(1 - (balance * rate / 12) / payment) / log(1 + rate/100/12)
        pass

    @staticmethod
    async def get_payoff_plan(
        session: AsyncSession,
        user_id: UUID,
        method: str,  # 'snowball' or 'avalanche'
        extra_payment: Decimal
    ) -> PayoffComparison:
        """Generate payoff plan using selected method"""
        debts = await session.query(Debt).filter(
            Debt.user_id == user_id,
            Debt.status == 'ACTIVE'
        ).all()

        if method == 'snowball':
            debts.sort(key=lambda d: d.current_balance)
        else:  # avalanche
            debts.sort(key=lambda d: d.interest_rate, reverse=True)

        # Calculate payoff for each debt in order
        # Account for minimum payments on other debts
        # Return timeline and interest calculations
        pass

    @staticmethod
    async def calculate_monthly_interest(
        current_balance: Decimal,
        annual_rate: Decimal
    ) -> Decimal:
        """Calculate monthly interest accrual"""
        return current_balance * (annual_rate / 100) / 12
```

### Net Worth Service

```python
# app/services/net_worth_service.py

class NetWorthService:
    @staticmethod
    async def calculate_net_worth(
        session: AsyncSession,
        user_id: UUID
    ) -> NetWorthSnapshot:
        """Calculate current net worth"""
        assets = await session.query(Asset).filter(
            Asset.user_id == user_id
        ).all()
        debts = await session.query(Debt).filter(
            Debt.user_id == user_id,
            Debt.status == 'ACTIVE'
        ).all()

        total_assets = sum(a.value for a in assets)
        total_liabilities = sum(d.current_balance for d in debts)

        return NetWorthSnapshot(
            timestamp=datetime.now(),
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            net_worth=total_assets - total_liabilities,
            asset_breakdown=...
            liability_breakdown=...
        )

    @staticmethod
    async def calculate_financial_health_score(
        session: AsyncSession,
        user_id: UUID
    ) -> FinancialHealthScore:
        """Calculate comprehensive financial health score"""
        # Get net worth snapshot
        # Get income and expenses
        # Get emergency fund status
        # Calculate each component (0-25 points each)
        # Generate recommendations
        pass

    @staticmethod
    async def record_daily_snapshot(
        session: AsyncSession,
        user_id: UUID
    ) -> None:
        """Record daily net worth snapshot (scheduled job)"""
        # Called daily by scheduler
        # Calculates net worth
        # Stores in net_worth_snapshots
        # Cleans up old snapshots (keep 7 years)
        pass
```

---

## API Endpoints Structure

### Income Endpoints

```python
# app/api/v1/endpoints/income.py

@router.post("/sources", response_model=IncomeSourceInDB, status_code=201)
async def create_income_source(
    income_in: IncomeSourceCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create new income source"""
    return await IncomeService.create_income_source(
        session, current_user.id, income_in
    )

@router.get("/summary/monthly", response_model=IncomeSummary)
async def get_monthly_income(
    year: int,
    month: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get income summary for specific month"""
    pass

@router.get("/summary/range", response_model=list[IncomeSummary])
async def get_income_range(
    start_date: date,
    end_date: date,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get income summary for date range"""
    pass

@router.get("/predict/next-month", response_model=dict)
async def predict_next_month(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Predict income for next month"""
    pass

@router.get("/analytics/diversification", response_model=dict)
async def get_diversification(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Analyze income source diversification"""
    pass
```

### Debt Endpoints

```python
# app/api/v1/endpoints/debts.py

@router.post("/", response_model=DebtInDB, status_code=201)
async def create_debt(
    debt_in: DebtCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create new debt"""
    pass

@router.get("/payoff-calculator", response_model=PayoffComparison)
async def get_payoff_calculator(
    method: str = Query(..., regex="^(snowball|avalanche)$"),
    extra_payment: Decimal = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate payoff plan"""
    return await DebtService.get_payoff_plan(
        session, current_user.id, method, extra_payment
    )

@router.get("/{id}/projected-payoff", response_model=PayoffCalculation)
async def get_projected_payoff(
    id: UUID,
    monthly_payment: Optional[Decimal] = None,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get projected payoff for single debt"""
    pass
```

### Net Worth Endpoints

```python
# app/api/v1/endpoints/net_worth.py

@router.get("/current", response_model=NetWorthSnapshot)
async def get_current_net_worth(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current net worth snapshot"""
    return await NetWorthService.calculate_net_worth(session, current_user.id)

@router.get("/trends", response_model=list[NetWorthTrend])
async def get_net_worth_trends(
    period: str = Query("1y", regex="^(1m|3m|1y|5y|10y|all)$"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get net worth trends over time"""
    pass

@router.get("/score", response_model=FinancialHealthScore)
async def get_financial_health_score(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get financial health score"""
    return await NetWorthService.calculate_financial_health_score(
        session, current_user.id
    )
```

---

## Background Jobs & Scheduled Tasks

### Daily Net Worth Snapshot

```python
# app/jobs/daily_net_worth.py

@scheduler.scheduled_job('cron', hour=2, minute=0)
async def daily_net_worth_snapshot():
    """Run daily at 2 AM UTC to record net worth snapshots"""
    async with get_db() as session:
        # Get all active users
        users = await session.query(User).filter(
            User.is_active == True
        ).all()

        for user in users:
            await NetWorthService.record_daily_snapshot(session, user.id)

        await session.commit()
```

### Monthly Budget Alert Digest

```python
# app/jobs/budget_alerts.py

@scheduler.scheduled_job('cron', day=1, hour=9, minute=0)
async def send_monthly_budget_digest():
    """Send budget summary email on 1st of month"""
    async with get_db() as session:
        users = await session.query(User).all()

        for user in users:
            budgets = await BudgetService.get_alert_summary(session, user.id)
            await send_email(
                user.email,
                "Your Monthly Budget Summary",
                budgets
            )
```

---

## Testing Strategy

### Unit Tests

```python
# app/tests/test_debt_payoff.py

def test_calculate_payoff_date_simple():
    """Test basic payoff calculation"""
    balance = Decimal("5000")
    payment = Decimal("200")
    rate = Decimal("20")
    
    payoff_date = DebtService.calculate_payoff_date(balance, payment, rate)
    assert payoff_date > date.today()

def test_snowball_sorts_by_balance():
    """Test snowball method sorts by balance"""
    debts = [
        Debt(balance=5000, rate=20),
        Debt(balance=1000, rate=25),
        Debt(balance=10000, rate=10),
    ]
    
    sorted_debts = DebtService.snowball_sort(debts)
    assert sorted_debts[0].balance == 1000
```

### Integration Tests

```python
# app/tests/test_net_worth_integration.py

@pytest.mark.asyncio
async def test_net_worth_calculation_with_multiple_assets():
    """Test net worth calculation with various assets"""
    # Create user, assets, debts
    # Calculate net worth
    # Verify correctness
    pass

@pytest.mark.asyncio
async def test_financial_health_score_calculation():
    """Test comprehensive health score"""
    # Set up user with known financial situation
    # Calculate score
    # Verify components and recommendations
    pass
```

---

## Performance Considerations

### Database Optimization

- Index on `(user_id, created_at)` for queries
- Denormalized `monthly_summary` tables to avoid aggregation queries
- Archive old transactions (> 7 years) to `archive_transactions`

### API Performance

- Cache net worth snapshots (recalculate daily, not on every request)
- Limit income/debt history queries to last 24 months by default
- Pagination for list endpoints (25 items per page)
- Gzip compression for large responses

### Calculation Efficiency

- Pre-calculate monthly summaries nightly
- Use stored procedures for complex calculations
- Cache payoff calculations (valid for 30 days)

---

## Security Considerations

- All endpoints require authentication
- Users can only access their own data (row-level security)
- Sensitive calculations done server-side (never in frontend)
- Audit log for financial data changes
- PCI compliance for credit card storage (tokenize instead)

---

## Monitoring & Observability

- Track calculation errors (failed net worth snapshots)
- Monitor payoff calculator response times (should be < 500ms)
- Alert on missed daily snapshots
- Log all balance updates and major changes
- Dashboard: % of users with complete financial profiles