from uuid import UUID
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class PaymentMethodBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    payment_type: str
    last_four: Optional[str] = Field(None, max_length=4)
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)

    @validator('payment_type', pre=True)
    def validate_payment_type(cls, v):
        if isinstance(v, str):
            v = v.upper()
            if v in ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET', 'OTHER']:
                return v
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        return v

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    payment_type: Optional[str] = None
    last_four: Optional[str] = Field(None, max_length=4)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

    @validator('payment_type', pre=True)
    def validate_payment_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.upper()
            if v in ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET', 'OTHER']:
                return v
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        return v

class PaymentMethodInDB(PaymentMethodBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
class PaymentMethod(PaymentMethodInDB):
    pass

# Alias for compatibility
PaymentMethodOut = PaymentMethod
