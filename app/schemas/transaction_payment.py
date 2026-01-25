"""
TransactionPayment Pydantic schemas for the SpendWise SA API.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TransactionPaymentBase(BaseModel):
    """Base schema for transaction payment."""
    transaction_id: str
    payment_method_id: str
    amount: float = Field(..., gt=0, description="Payment amount must be positive")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    status: str = Field(default="completed", description="Payment status: pending, completed, failed")
    reference: Optional[str] = Field(None, max_length=100, description="External reference/transaction ID")
    notes: Optional[str] = None

class TransactionPaymentCreate(TransactionPaymentBase):
    """Schema for creating a new transaction payment."""
    pass

class TransactionPaymentUpdate(BaseModel):
    """Schema for updating a transaction payment."""
    payment_method_id: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    status: Optional[str] = Field(None, description="Payment status: pending, completed, failed")
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class TransactionPaymentOut(TransactionPaymentBase):
    """Schema for transaction payment response."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'