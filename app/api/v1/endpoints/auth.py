import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.security import create_access_token
from app.schemas.auth import Token, UserCreate, UserOut
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(deps.get_db)
) -> Token:
    """
    Authenticate user and return JWT access token.
    """
    # Create AuthService instance and use async methods
    auth_service = AuthService(session)
    user = await auth_service.authenticate_user(
        email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    # FIXED: Use 'data' parameter instead of 'subject'
    access_token = create_access_token(data={'sub': str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserOut)
async def register(
    user_in: UserCreate,
    session: AsyncSession = Depends(deps.get_db)
) -> UserOut:
    """
    Create a new user account.
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
    return user

@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user = Depends(deps.get_current_user)
) -> UserOut:
    """
    Retrieve current authenticated user's profile.
    """
    return current_user
