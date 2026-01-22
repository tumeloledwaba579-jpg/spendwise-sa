"""
User Pydantic schemas for profile updates (not authentication).
Note: Authentication schemas are in auth.py.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

class UserProfileBase(BaseModel):
    """Base schema for user profile."""
    full_name: str = Field(..., min_length=2, max_length=100)
    is_active: bool = Field(default=True)

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None

class UserProfileOut(BaseModel):
    """Schema for user profile response (detailed)."""
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserStatsOut(BaseModel):
    """Schema for user statistics."""
    total_accounts: int
    total_transactions: int
    total_budgets: int
    total_categories: int
    total_payment_methods: int
    last_login: Optional[datetime] = None
