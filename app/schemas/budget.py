"""
Budget Pydantic schemas for the SpendWise SA API.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.budget import BudgetPeriod

class BudgetBase(BaseModel):
    """Base schema for budget."""
    category_id: str
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0, description="Budget amount must be positive")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    period: BudgetPeriod = Field(default=BudgetPeriod.MONTHLY)
    start_date: datetime
    end_date: Optional[datetime] = None
    notifications_enabled: bool = Field(default=True)
    notification_threshold: float = Field(default=80.0, ge=0, le=100, description="Percentage threshold for notifications")

class BudgetCreate(BudgetBase):
    """Schema for creating a new budget."""
    pass

class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    period: Optional[BudgetPeriod] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    notification_threshold: Optional[float] = Field(None, ge=0, le=100)

class BudgetOut(BudgetBase):
    """Schema for budget response."""
    id: str
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
