from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator
import uuid
from datetime import datetime

class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: AccountType
    currency: str = Field(default="USD", min_length=3, max_length=3)
    is_active: bool = True

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_type: Optional[AccountType] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    is_active: Optional[bool] = None

    @validator('currency')
    def currency_uppercase(cls, v):
        return v.upper() if v else v

class AccountOut(AccountBase):
    id: uuid.UUID
    user_id: uuid.UUID
    balance: float = Field(..., ge=0)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
