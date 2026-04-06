"""
Income Pydantic schemas for SpendWise API.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.models.income import IncomeType, IncomeFrequency, TaxCategory


class IncomeSourceBase(BaseModel):
    """Base schema for income source."""
    name: str = Field(..., min_length=1, max_length=255)
    type: IncomeType
    frequency: IncomeFrequency
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    start_date: date
    end_date: Optional[date] = None
    is_recurring: bool = True
    is_taxable: bool = True
    tax_category: Optional[TaxCategory] = None
    auto_tax_calculation: bool = False
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    is_active: bool = True
    # ✅ Auto-generation fields
    auto_generate_entries: bool = True
    generate_if_manual_exists: bool = False
    generate_on_weekends: bool = True


class IncomeSourceCreate(IncomeSourceBase):
    """Schema for creating a new income source."""
    pass


class IncomeSourceUpdate(BaseModel):
    """Schema for updating an income source."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[IncomeType] = None
    frequency: Optional[IncomeFrequency] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    is_taxable: Optional[bool] = None
    tax_category: Optional[TaxCategory] = None
    auto_tax_calculation: Optional[bool] = None
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    # ✅ Auto-generation fields
    auto_generate_entries: Optional[bool] = None
    generate_if_manual_exists: Optional[bool] = None
    generate_on_weekends: Optional[bool] = None


class IncomeSourceInDB(IncomeSourceBase):
    """Schema for income source from database."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True


IncomeSourceOut = IncomeSourceInDB


# ============================================================================
# INCOME HISTORY SCHEMAS
# ============================================================================

class IncomeHistoryBase(BaseModel):
    """Base schema for income history."""
    income_source_id: UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    received_date: date
    tax_amount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None
    is_manual_entry: bool = True
    skip_auto_generation: bool = False


class IncomeHistoryCreate(IncomeHistoryBase):
    """Schema for creating an income history entry."""
    pass


class IncomeHistoryInDB(IncomeHistoryBase):
    """Schema for income history from database."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True


IncomeHistoryOut = IncomeHistoryInDB


# ============================================================================
# MONTHLY SUMMARY SCHEMA
# ============================================================================

class IncomeMonthlySummaryOut(BaseModel):
    """Schema for monthly income summary."""
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

    class Config:
        from_attributes = True


# ============================================================================
# INCOME STATS SCHEMA
# ============================================================================

class IncomeStats(BaseModel):
    """Schema for income statistics."""
    total_annual_income: Decimal
    average_monthly_income: Decimal
    predicted_next_month: Decimal
    total_tax_paid: Decimal
    net_annual_income: Decimal
    recurring_income_count: int
    one_time_income_count: int
    top_source_name: str
    top_source_amount: Decimal

    class Config:
        from_attributes = True