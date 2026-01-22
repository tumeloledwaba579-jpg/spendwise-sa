"""
PaymentMethod Pydantic schemas for the SpendWise SA API.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.payment_method import PaymentMethodType

class PaymentMethodBase(BaseModel):
    """Base schema for payment method."""
    name: str = Field(..., min_length=1, max_length=100)
    payment_type: PaymentMethodType
    last_four: Optional[str] = Field(None, min_length=4, max_length=4, description="Last 4 digits for cards")
    is_default: bool = Field(default=False)

class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a new payment method."""
    pass

class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    payment_type: Optional[PaymentMethodType] = None
    last_four: Optional[str] = Field(None, min_length=4, max_length=4)
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class PaymentMethodOut(PaymentMethodBase):
    """Schema for payment method response."""
    id: str
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
