import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.security import create_access_token
from app.schemas.auth import Token, UserCreate, UserOut
from app.services.auth_service import AuthService  # Correct service import

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(deps.get_db)
) -> Token:
    """
    Authenticate user and return JWT access token.
    
    This endpoint implements OAuth2 password flow authentication. Users provide
    their credentials (email as username and password) to receive a JSON Web Token
    for accessing protected API endpoints.
    
    Args:
        form_data (OAuth2PasswordRequestForm): OAuth2-compliant form data containing:
            - username: User's email address
            - password: User's password
            - grant_type: Should be "password" (handled automatically)
            - scope: Optional space-separated scopes
            - client_id: Optional client identifier
            - client_secret: Optional client secret
        session (AsyncSession): Async SQLAlchemy database session dependency
    
    Returns:
        Token: JWT token object containing:
            - access_token (str): Bearer token for API authentication
            - token_type (str): Always "bearer"
    
    Raises:
        HTTPException: 400 Bad Request - Invalid credentials
        HTTPException: 500 Internal Server Error - Database or authentication error
    
    Notes:
        - The token is valid for 30 minutes (configurable in settings)
        - Use the token in the Authorization header: `Bearer <access_token>`
        - Refresh tokens are not implemented in this version
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/auth/login" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          -d "username=user@example.com&password=yourpassword"
        ```
    
    Example Response:
        ```json
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer"
        }
        ```
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
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserOut)
async def register(
    user_in: UserCreate,
    session: AsyncSession = Depends(deps.get_db)
) -> UserOut:
    """
    Create a new user account.
    
    Registers a new user with the provided information. The email must be unique
    across the system. Passwords are hashed before storage for security.
    
    Args:
        user_in (UserCreate): User registration data containing:
            - email (str): User's email address (must be unique, valid email format)
            - password (str): User's password (will be hashed, minimum 8 characters)
            - full_name (str): User's full name
        session (AsyncSession): Async SQLAlchemy database session
    
    Returns:
        UserOut: Newly created user object (excluding sensitive data like password hash)
    
    Raises:
        HTTPException: 400 Bad Request - Email already registered or invalid input
        HTTPException: 422 Unprocessable Entity - Validation error in request data
        HTTPException: 500 Internal Server Error - Database error during creation
    
    Notes:
        - Email addresses are converted to lowercase before storage
        - Passwords must meet minimum security requirements
        - User is automatically logged in after registration (no auto-login token)
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/auth/register" \
          -H "Content-Type: application/json" \
          -d '{
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "full_name": "John Doe"
          }'
        ```
    
    Example Response:
        ```json
        {
            "id": 42,
            "email": "newuser@example.com",
            "full_name": "John Doe",
            "created_at": "2024-01-15T10:30:00Z"
        }
        ```
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
    
    Returns the complete profile information for the currently authenticated user
    based on the JWT token in the Authorization header.
    
    Args:
        current_user: Automatically injected current user object
            from JWT token validation
    
    Returns:
        UserOut: Current user's profile information (excluding sensitive data)
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid, expired, or missing token
        HTTPException: 404 Not Found - User no longer exists (if deleted after token issuance)
    
    Notes:
        - Requires valid JWT token in Authorization header
        - Token must not be expired
        - User must still exist in the database
        - Returns same data structure as registration but with additional fields
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/auth/me" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    
    Example Response:
        ```json
        {
            "id": 42,
            "email": "user@example.com",
            "full_name": "John Doe",
            "created_at": "2024-01-10T08:15:00Z"
        }
        ```
    """
    return current_user