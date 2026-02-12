import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.api import deps
from app.core.security import create_access_token
from app.schemas.auth import Token, UserCreate, UserOut
from app.services.auth_service import AuthService

router = APIRouter()

# Add Pydantic model for JSON login
class LoginJSON(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginJSON,  # ? CHANGED: Simple JSON model
    session: AsyncSession = Depends(deps.get_db)
) -> Token:
    """
    Authenticate user and return JWT access token.
    """
    email = login_data.email
    password = login_data.password

    # Create AuthService instance and use async methods
    auth_service = AuthService(session)
    user = await auth_service.authenticate_user(
        email=email, password=password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )

    # Create access token
    access_token = create_access_token(data={'sub': str(user.id)})

    # Return token with user info (matching frontend expectations)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone if hasattr(user, 'phone') else None
        }
    }

# Update register endpoint to return token
@router.post("/register", response_model=Token)
async def register(
    user_in: UserCreate,
    session: AsyncSession = Depends(deps.get_db)
) -> Token:
    """
    Create a new user account and return JWT token.
    """
    auth_service = AuthService(session)

    # Check if user exists
    user = await auth_service.get_user_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create new user
    user = await auth_service.create_user(user_in)

    # Create access token for the new user
    access_token = create_access_token(data={'sub': str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone if hasattr(user, 'phone') else None
        }
    }

@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user = Depends(deps.get_current_user)
) -> UserOut:
    """
    Retrieve current authenticated user's profile.
    """
    return current_user

# Add health endpoint for auth service
@router.get("/health")
async def auth_health():
    return {"status": "healthy", "service": "auth"}
