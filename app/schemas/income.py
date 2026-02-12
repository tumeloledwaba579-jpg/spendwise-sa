"""
Pydantic schemas for income tracking module.
"""
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.models.income import IncomeType, IncomeFrequency, TaxCategory


# ============================================================================
# INCOME SOURCE SCHEMAS
# ============================================================================

class IncomeSourceCreate(BaseModel):
    """Schema for creating a new income source."""
    name: str = Field(..., min_length=1, max_length=255)
    type: str  # IncomeType enum value
    frequency: str  # IncomeFrequency enum value
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    start_date: date
    end_date: Optional[date] = None
    is_recurring: bool = Field(default=True)
    is_taxable: bool = Field(default=True)
    tax_category: Optional[str] = None  # TaxCategory enum value
    auto_tax_calculation: bool = Field(default=False)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('type', pre=True)
    def validate_type(cls, v):
        """Validate and normalize income type."""
        if isinstance(v, str):
            v = v.upper()
            valid_types = ['SALARY', 'FREELANCE', 'INVESTMENT', 'PASSIVE', 'CUSTOM', 'OTHER']
            if v not in valid_types:
                raise ValueError(f"Invalid type: {v}. Must be one of {valid_types}")
            return v
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid type: {v}")

    @validator('frequency', pre=True)
    def validate_frequency(cls, v):
        """Validate and normalize frequency."""
        if isinstance(v, str):
            v = v.upper()
            valid_freqs = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']
            if v not in valid_freqs:
                raise ValueError(f"Invalid frequency: {v}. Must be one of {valid_freqs}")
            return v
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid frequency: {v}")

    @validator('end_date', always=True)
    def validate_dates(cls, v, values):
        """Ensure end_date >= start_date."""
        if v and 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class IncomeSourceUpdate(BaseModel):
    """Schema for updating an income source."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    frequency: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    end_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    is_taxable: Optional[bool] = None
    tax_category: Optional[str] = None
    auto_tax_calculation: Optional[bool] = None
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None

    @validator('frequency', pre=True)
    def validate_frequency(cls, v):
        """Validate frequency if provided."""
        if v is None:
            return v
        if isinstance(v, str):
            v = v.upper()
            valid_freqs = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']
            if v not in valid_freqs:
                raise ValueError(f"Invalid frequency: {v}")
            return v
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid frequency: {v}")


class IncomeSourceInDB(IncomeSourceCreate):
    """Schema for income source response (database)."""
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# INCOME HISTORY SCHEMAS
# ============================================================================

class IncomeHistoryCreate(BaseModel):
    """Schema for recording actual income (manual entry)."""
    income_source_id: UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    received_date: date
    tax_amount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    is_manual_entry: bool = Field(default=True)

    @validator('tax_amount', always=True)
    def validate_tax(cls, v, values):
        """Ensure tax_amount <= amount."""
        if v and 'amount' in values and v > values['amount']:
            raise ValueError('tax_amount cannot be greater than amount')
        return v


class IncomeHistoryInDB(IncomeHistoryCreate):
    """Schema for income history response (database)."""
    id: UUID
    user_id: UUID
    net_amount: Optional[Decimal] = None  # Calculated: amount - tax_amount
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# MONTHLY SUMMARY SCHEMAS
# ============================================================================

class IncomeMonthlySummaryOut(BaseModel):
    """Schema for monthly income summary response."""
    id: UUID
    user_id: UUID
    year: int
    month: int
    total_income: Decimal
    total_tax: Decimal
    net_income: Decimal
    recurring_income: Decimal
    one_time_income: Decimal
    source_count: int
    record_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'


# ============================================================================
# AGGREGATE/SUMMARY SCHEMAS
# ============================================================================

class IncomeSummary(BaseModel):
    """Summary of income for a specific period with sources."""
    period: str  # Format: "2026-01" for monthly
    year: int
    month: int
    total_income: Decimal
    total_tax: Decimal
    net_income: Decimal
    recurring_income: Decimal
    one_time_income: Decimal
    source_count: int
    record_count: int
    sources: list[IncomeSourceInDB] = []  # List of active sources for this month


class IncomeStats(BaseModel):
    """Income statistics and metrics."""
    total_annual_income: Decimal
    average_monthly_income: Decimal
    predicted_next_month: Decimal
    total_tax_paid: Decimal
    net_annual_income: Decimal
    recurring_income_count: int
    one_time_income_count: int
    top_source_name: Optional[str] = None
    top_source_amount: Optional[Decimal] = None

