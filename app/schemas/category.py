from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator
import uuid
from datetime import datetime

class CategoryType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_type: CategoryType
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    parent_id: Optional[uuid.UUID] = None
    is_active: bool = True
    display_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category_type: Optional[CategoryType] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    parent_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class CategoryOut(CategoryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
