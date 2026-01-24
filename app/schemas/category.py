from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class CategoryType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category_type: str
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    parent_id: Optional[UUID] = None
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0, ge=0)

    @validator('category_type', pre=True)
    def validate_category_type(cls, v):
        if isinstance(v, str):
            v = v.upper()
            if v in ['INCOME', 'EXPENSE', 'TRANSFER']:
                return v
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        return v

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category_type: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    parent_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)

    @validator('category_type', pre=True)
    def validate_category_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.upper()
            if v in ['INCOME', 'EXPENSE', 'TRANSFER']:
                return v
        # Handle enum from ORM
        if hasattr(v, 'value'):
            return v.value
        return v

class CategoryInDB(CategoryBase):
    id: UUID
    user_id: UUID
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
class Category(CategoryInDB):
    pass

# Alias for compatibility
CategoryOut = Category
