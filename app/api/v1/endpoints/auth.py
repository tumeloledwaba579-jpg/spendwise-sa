"""
Updated auth.py with HTTP-only cookie support and refresh tokens
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import datetime, timedelta
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.limiter import limiter, attempt_tracker, RATE_LIMITS
from app.services.cache_service import CacheService
from app.core.security import (
    create_access_token, create_refresh_token, verify_refresh_token,
    verify_password, hash_password, verify_password_cached, invalidate_password_cache,
    ACCESS_TOKEN_EXPIRE_DAYS, REFRESH_TOKEN_EXPIRE_DAYS
)
from app.core.config import settings
from app.core.csrf import csrf_protection
from app.api.deps import get_db
from app.models.user import User
from app.schemas.auth import (
    UserLogin, UserOut, UserCreate, 
    TokenResponse, RefreshTokenResponse, Token
)
from app.core.security import is_password_cached

router = APIRouter(tags=["authentication"])

# ============================================================================
# TEST ENDPOINT
# ============================================================================
@router.get("/test")
async def test_route():
    """Simple test endpoint to verify routing works"""
    return {"message": "Auth router is working!"}


# ============================================================================
# REGISTER ENDPOINT
# ============================================================================
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register a new user.
    """
    print(f"📝 Register attempt for email: {user_data.email}")
    
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalars().first()
    
    if existing_user:
        print(f"❌ User already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    new_user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        email_verified=False
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    print(f"✅ User registered: {new_user.email}")
    
    return {
        "message": "User registered successfully",
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }


# ============================================================================
# GET CURRENT USER DEPENDENCY
# ============================================================================
async def get_current_user_from_cookie(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current user from HTTP-only cookie with Redis cache.
    """
    from jose import JWTError, jwt

    # Get token from cookie
    token = request.cookies.get("access_token")

    if not token:
        print("❌ No access_token cookie found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        # Decode JWT
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        session_id: str = payload.get("session")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication"
            )

        # Try to get user from cache first
        cached_user = await CacheService.get_user_session(user_id)
        if cached_user:
            print(f"✅ Cache hit for user {user_id}")
            result = await db.execute(
                select(User).where(User.id == uuid.UUID(user_id))
            )
            user = result.scalars().first()
            if user:
                return user

        print(f"🔍 Cache miss for user {user_id}, querying database...")

    except JWTError as e:
        print(f"❌ JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )

    # Get user from database
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Cache for next time
    user_data = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name
    }
    await CacheService.set_user_session(str(user.id), user_data, ttl=3600)

    return user


# ============================================================================
# LOGIN ENDPOINT WITH REFRESH TOKEN
# ============================================================================
@router.post("/login", response_model=TokenResponse)
@limiter.limit(RATE_LIMITS["auth"])
async def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Authenticate user and set HTTP-only cookies with refresh token support.
    
    Sets:
    - access_token (short-lived, HTTP-only)
    - refresh_token (long-lived, HTTP-only)
    - csrf_token (JavaScript readable)
    - session_id (HTTP-only)
    """
    client_ip = request.client.host
    print(f"🔐 Login attempt for email: {login_data.email} from IP: {client_ip}")
    
    # Check rate limiting
    try:
        attempt_tracker.check_attempts(client_ip)
    except HTTPException as e:
        print(f"❌ Rate limit exceeded for IP: {client_ip}")
        raise

    try:
        # Find user by email
        result = await db.execute(
            select(User).where(User.email == login_data.email)
        )
        user = result.scalars().first()

        if not user:
            attempt_tracker.add_attempt(client_ip)
            print(f"❌ Login failed - user not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Verify password
        password_valid = verify_password_cached(
            str(user.id), 
            login_data.password, 
            user.hashed_password
        )
        
        if not password_valid:
            attempt_tracker.add_attempt(client_ip)
            print(f"❌ Login failed - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not user.is_active:
            print(f"❌ Login failed - account inactive")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support."
            )

        # Reset rate limiting on success
        attempt_tracker.reset_attempts(client_ip)
        print(f"✅ Rate limiting reset for IP: {client_ip}")

        # Generate unique session ID
        session_id = str(uuid.uuid4())

        # Create access token (short-lived)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "session": session_id,
                "email": user.email
            }
        )

        # Create refresh token (long-lived)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token in database
        user.refresh_token = refresh_token
        user.refresh_token_expires = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        await db.commit()

        # Cache user data
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active
        }
        await CacheService.set_user_session(str(user.id), user_data, ttl=3600)

        # Generate CSRF token
        csrf_token = csrf_protection.generate_token(session_id)

        # Calculate expiration times in seconds
        access_expires_seconds = ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        refresh_expires_seconds = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

        # Set cookies
        # Access token (short-lived)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=access_expires_seconds,
            path="/"
        )

        # Refresh token (long-lived)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=refresh_expires_seconds,
            path="/"
        )

        # CSRF token (JavaScript readable)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=False,
            samesite="lax",
            max_age=access_expires_seconds,
            path="/"
        )

        # Session ID (HTTP-only)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=access_expires_seconds,
            path="/"
        )

        print(f"✅ Login successful for {user.email}")
        print(f"   Access token expires in {ACCESS_TOKEN_EXPIRE_DAYS} days")
        print(f"   Refresh token expires in {REFRESH_TOKEN_EXPIRE_DAYS} days")

        # Return TokenResponse with expiration times
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=access_expires_seconds,
            refresh_expires_in=refresh_expires_seconds
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error during login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )


# ============================================================================
# REFRESH TOKEN ENDPOINT
# ============================================================================
@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token cookie.
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token found"
        )
    
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload"
        )
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalars().first()
    
    if not user or user.refresh_token != refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token expired
    if user.refresh_token_expires and user.refresh_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired. Please log in again."
        )
    
    # Generate new session ID
    session_id = str(uuid.uuid4())
    
    # Create new access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "session": session_id,
            "email": user.email
        }
    )
    
    # Generate new CSRF token
    csrf_token = csrf_protection.generate_token(session_id)
    
    # Calculate expiration time in seconds
    access_expires_seconds = ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    
    # Update cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=access_expires_seconds,
        path="/"
    )
    
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=False,
        samesite="lax",
        max_age=access_expires_seconds,
        path="/"
    )
    
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=access_expires_seconds,
        path="/"
    )
    
    # Refresh token stays the same (keep long-lived)
    
    print(f"🔄 Access token refreshed for user {user.email}")
    
    return RefreshTokenResponse(
        access_token=access_token,
        expires_in=access_expires_seconds
    )


# ============================================================================
# LOGOUT ENDPOINT
# ============================================================================
@router.post("/logout")
async def logout(
    request: Request, 
    response: Response,
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
):
    """
    Clear authentication cookies and invalidate refresh token.
    """
    # Clear refresh token from database
    current_user.refresh_token = None
    current_user.refresh_token_expires = None
    await db.commit()
    
    # Invalidate Redis cache
    await CacheService.invalidate_user_session(str(current_user.id))
    
    # Get session ID from cookie
    session_id = request.cookies.get("session_id")
    if session_id:
        csrf_protection.remove_token(session_id)
        print(f"🚪 Logout for session: {session_id}")

    # Clear all cookies
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("csrf_token", path="/")
    response.delete_cookie("session_id", path="/")

    print(f"👋 User {current_user.email} logged out")
    return {"message": "Logout successful"}


# ============================================================================
# GET CURRENT USER ENDPOINT
# ============================================================================
@router.get("/me", response_model=UserOut)
async def get_current_user(
    current_user: User = Depends(get_current_user_from_cookie)
):
    """
    Get current authenticated user.
    """
    print(f"👤 Returning user: {current_user.email}")
    return current_user