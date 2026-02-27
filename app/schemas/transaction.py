"""
Transaction Pydantic schemas for the SpendWise SA API.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, validator

class TransactionBase(BaseModel):
    """Base schema for transaction."""
    account_id: str
    category_id: Optional[str] = None
    amount: float
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    transaction_date: datetime
    description: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    is_transfer: bool = Field(default=False)
    is_recurring: bool = Field(default=False)
    recurrence_rule: Optional[str] = Field(None, description="Recurrence rule (e.g., 'MONTHLY')")

    @validator('account_id', 'category_id', pre=True)
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed."""
        if v is None:
            return v
        if isinstance(v, UUID):
            return str(v)
        return v

class TransactionCreate(TransactionBase):
    """Schema for creating a new transaction."""
    pass

class TransactionUpdate(BaseModel):
    """Schema for updating a transaction."""
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    transaction_date: Optional[datetime] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    notes: Optional[str] = None
    is_transfer: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None

    @validator('account_id', 'category_id', pre=True)
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed."""
        if v is None:
            return v
        if isinstance(v, UUID):
            return str(v)
        return v

class TransactionOut(TransactionBase):
    """Schema for transaction response."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True
        extra = 'forbid'

    @validator('id', 'user_id', 'account_id', 'category_id', pre=True)
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed."""
        if v is None:
            return v
        if isinstance(v, UUID):
            return str(v)
        return v
