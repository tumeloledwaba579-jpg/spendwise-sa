from uuid import UUID
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: str
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    balance: Decimal = Field(default=Decimal('0.00'))
    is_active: bool = Field(default=True)

    @validator('account_type', pre=True)
    def validate_account_type(cls, v):
        if isinstance(v, str):
            v = v.upper()
            allowed_types = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE']
            if v in allowed_types:
                return v
            raise ValueError(f"Invalid account_type: {v}")
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid account_type: {v}")

    @validator('balance', pre=True, always=True)
    def validate_balance(cls, v, values):
        """Allow negative balances for debt accounts"""
        account_type = values.get('account_type', '').upper() if values else ''
        
        # Convert to Decimal if needed
        if isinstance(v, (int, float, str)):
            v = Decimal(str(v))
        
        # Debt accounts can have negative balances
        debt_accounts = ['CREDIT_CARD', 'LOAN', 'MORTGAGE', 'OVERDRAFT']
        
        if account_type in debt_accounts:
            return v  # Allow negative (debt)
        
        # Asset accounts must have non-negative balance
        if v < 0:
            raise ValueError(f"Balance cannot be negative for {account_type} accounts (asset accounts must be >= 0)")
        
        return v

class AccountCreate(AccountBase):
    """Schema for creating a new account"""
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_type: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    balance: Optional[Decimal] = Field(None)
    is_active: Optional[bool] = None

    @validator('account_type', pre=True)
    def validate_account_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.upper()
            allowed_types = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'MORTGAGE']
            if v in allowed_types:
                return v
            raise ValueError(f"Invalid account_type: {v}")
        if hasattr(v, 'value'):
            return v.value
        raise ValueError(f"Invalid account_type: {v}")

    @validator('balance', pre=True, always=True)
    def validate_balance(cls, v, values):
        if v is None:
            return v
        
        # Convert to Decimal if needed
        if isinstance(v, (int, float, str)):
            v = Decimal(str(v))
        
        # For updates, we need the account_type from the request or existing data
        # This will be handled in the service layer
        
        return v

class AccountInDB(AccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True

# Alias for compatibility
AccountOut = AccountInDB