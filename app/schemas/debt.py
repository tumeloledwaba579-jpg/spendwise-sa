"""
Pydantic schemas for debt management.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


# ============================================================================
# Debt Account Schemas
# ============================================================================

class DebtAccountCreate(BaseModel):
    """Schema for creating a new debt account."""
    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    type: str = Field(..., description="CREDIT_CARD, PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, STUDENT_LOAN, OTHER")
    creditor_name: Optional[str] = Field(None, max_length=255, description="Creditor name")
    current_balance: Decimal = Field(..., gt=0, description="Current balance")
    credit_limit: Optional[Decimal] = Field(None, ge=0, description="Credit limit (if applicable)")
    interest_rate: Decimal = Field(..., ge=0, le=100, description="Annual interest rate (%)")
    minimum_payment: Optional[Decimal] = Field(None, ge=0, description="Minimum monthly payment")
    due_date: Optional[int] = Field(None, ge=1, le=31, description="Due date (day of month)")
    start_date: date = Field(..., description="Account start date")
    payoff_date: Optional[date] = Field(None, description="Target payoff date")
    notes: Optional[str] = Field(None, description="Additional notes")

    @validator('type')
    def validate_type(cls, v):
        """Normalize and validate debt type."""
        valid_types = ['CREDIT_CARD', 'PERSONAL_LOAN', 'AUTO_LOAN', 'MORTGAGE', 'STUDENT_LOAN', 'OTHER']
        v = v.upper().strip()
        if v not in valid_types:
            raise ValueError(f"Invalid type. Must be one of: {', '.join(valid_types)}")
        return v

    @validator('credit_limit')
    def validate_credit_limit(cls, v, values):
        """Validate credit limit against balance."""
        if v is not None and 'current_balance' in values:
            if v < values['current_balance']:
                raise ValueError('Credit limit cannot be less than current balance')
        return v

    class Config:
        orm_mode = True
        use_enum_values = True


class DebtAccountUpdate(BaseModel):
    """Schema for updating a debt account."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    creditor_name: Optional[str] = Field(None, max_length=255)
    current_balance: Optional[Decimal] = Field(None, gt=0)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    minimum_payment: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[int] = Field(None, ge=1, le=31)
    payoff_date: Optional[date] = Field(None)
    notes: Optional[str] = Field(None)

    class Config:
        orm_mode = True
        use_enum_values = True


class DebtAccountInDB(BaseModel):
    """Schema for returning debt account from database."""
    id: UUID
    user_id: UUID
    name: str
    type: str
    creditor_name: Optional[str]
    current_balance: Decimal
    credit_limit: Optional[Decimal]
    interest_rate: Decimal
    minimum_payment: Optional[Decimal]
    due_date: Optional[int]
    start_date: date
    payoff_date: Optional[date]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# Debt Payment Schemas
# ============================================================================

class DebtPaymentCreate(BaseModel):
    """Schema for recording a debt payment."""
    debt_account_id: UUID = Field(..., description="ID of the debt account")
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    payment_date: date = Field(..., description="Payment date")
    payment_method: Optional[str] = Field(None, description="BANK_TRANSFER, CHECK, CREDIT_CARD, AUTO_PAY, OTHER")
    notes: Optional[str] = Field(None, description="Payment notes")

    @validator('payment_method')
    def validate_payment_method(cls, v):
        """Validate payment method."""
        if v is not None:
            valid_methods = ['BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'AUTO_PAY', 'OTHER']
            v = v.upper().strip()
            if v not in valid_methods:
                raise ValueError(f"Invalid method. Must be one of: {', '.join(valid_methods)}")
        return v

    class Config:
        orm_mode = True
        use_enum_values = True


class DebtPaymentInDB(BaseModel):
    """Schema for returning debt payment from database."""
    id: UUID
    user_id: UUID
    debt_account_id: UUID
    amount: Decimal
    payment_date: date
    payment_method: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# Debt Snapshot Schemas
# ============================================================================

class DebtSnapshotOut(BaseModel):
    """Schema for returning debt snapshot."""
    id: UUID
    user_id: UUID
    debt_account_id: UUID
    year: int
    month: int
    balance_start: Decimal
    balance_end: Decimal
    total_paid: Decimal
    interest_accrued: Decimal
    payment_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# Analytics Schemas
# ============================================================================

class DebtSummary(BaseModel):
    """Monthly debt summary."""
    total_debt: Decimal
    total_paid_this_month: Decimal
    total_interest_accrued: Decimal
    account_count: int
    active_accounts: int
    avg_interest_rate: Decimal


class DebtStats(BaseModel):
    """Annual debt statistics and metrics."""
    total_current_debt: Decimal
    total_paid_annual: Decimal
    total_interest_paid: Decimal
    average_interest_rate: Decimal
    account_count: int
    active_account_count: int
    total_credit_limit: Decimal
    total_available_credit: Decimal
    utilization_rate: Decimal
    highest_rate_debt: Optional[str]
    highest_balance_debt: Optional[str]
    estimated_payoff_months: Optional[int]

    class Config:
        orm_mode = True


class PayoffStrategy(BaseModel):
    """Debt payoff strategy recommendation."""
    strategy_type: str  # SNOWBALL or AVALANCHE
    accounts_in_order: List[dict]
    estimated_total_months: int
    estimated_total_interest: Decimal
    monthly_payment_required: Decimal
    potential_savings: Decimal

    class Config:
        orm_mode = True
