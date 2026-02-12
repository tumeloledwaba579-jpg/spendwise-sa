"""
Authentication schemas for the SpendWise SA API.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
import re
# -------------------------------
# User Schemas
# -------------------------------
class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str
class UserOut(BaseModel):
    """Schema for user response (without sensitive data)."""
    id: str  # UUID as string
    email: EmailStr
    full_name: str
    created_at: datetime
    phone: Optional[str] = None
    @validator('id', pre=True)
    def convert_uuid_to_str(cls, v):
        """Convert UUID object to string."""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
# -------------------------------
# Token Schemas
# -------------------------------
class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict 

    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: str  # user id (as string)
    exp: int  # expiration timestamp
    
    class Config:
        orm_mode = True
        use_enum_values = True
        extra = 'forbid'
