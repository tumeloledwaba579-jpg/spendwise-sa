from uuid import UUID
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: str
    currency: str = Field(default="USD", min_length=3, max_length=3)
    balance: Decimal = Field(default=Decimal('0.00'), ge=0)
    is_active: bool = Field(default=True)

    @validator('account_type', pre=True)
    def validate_account_type(cls, v):
        if isinstance(v, str):
            v = v.upper()
            if v in ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN']:
                return v
            raise ValueError(f"Invalid account_type: {v}")
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid account_type: {v}")

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_type: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    balance: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @validator('account_type', pre=True)
    def validate_account_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.upper()
            if v in ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN']:
                return v
            raise ValueError(f"Invalid account_type: {v}")
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid account_type: {v}")

class AccountInDB(AccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'

class Account(AccountInDB):
    pass

# Alias for compatibility
AccountOut = Account
