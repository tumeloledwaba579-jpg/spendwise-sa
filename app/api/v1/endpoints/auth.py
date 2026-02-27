"""
Updated auth.py with HTTP-only cookie support and register endpoint
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import timedelta
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.limiter import limiter, attempt_tracker, RATE_LIMITS
from app.services.cache_service import CacheService
from app.core.security import create_access_token, verify_password, hash_password ,verify_password_cached, invalidate_password_cache
from app.core.config import settings
from app.core.csrf import csrf_protection
from app.api.deps import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserOut, UserCreate  # Added UserCreate
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
        hashed_password=hash_password(user_data.password),  # Changed
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
            # Even with cache hit, we need to fetch from DB to get complete User object
            # The cache only stores basic info for quick validation
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
# LOGIN ENDPOINT
# ============================================================================
# ============================================================================
# LOGIN ENDPOINT - COMPLETE WITH RATE LIMITING
# ============================================================================
@router.post("/login")
@limiter.limit(RATE_LIMITS["auth"])
async def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Authenticate user and set HTTP-only cookie with Redis caching and rate limiting.
    
    Performance optimizations:
    - bcrypt cost 8 (50-80ms vs 150-200ms)
    - Password caching for repeated attempts
    - Redis user session caching
    - Database index on email (already in place)
    
    Rate limits:
    - 5 attempts per minute per IP
    - 15 minute lockout after 5 failed attempts
    
    Security features:
    - bcrypt password verification (cost 8)
    - HTTP-only cookies (XSS protection)
    - CSRF token (double-submit pattern)
    - Rate limiting (brute force protection)
    - Redis session caching
    - JWT with 30-minute expiry
    - Password cache invalidation on change
    """
    client_ip = request.client.host
    print(f"🔐 Login attempt for email: {login_data.email} from IP: {client_ip}")
    
    # Check rate limiting attempt tracking
    try:
        attempt_tracker.check_attempts(client_ip)
    except HTTPException as e:
        print(f"❌ Rate limit exceeded for IP: {client_ip}")
        raise

    try:
        # Find user by email (using indexed column for fast lookup)
        result = await db.execute(
            select(User).where(User.email == login_data.email)
        )
        user = result.scalars().first()

        # Check if user exists
        if not user:
            # Record failed attempt (no user found)
            attempt_tracker.add_attempt(client_ip)
            print(f"❌ Login failed for {login_data.email} - user not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Verify password with caching for repeated attempts
        # This uses SHA-256 cache after first successful verification
        password_valid = verify_password_cached(
            str(user.id), 
            login_data.password, 
            user.hashed_password
        )
        
        if not password_valid:
            # Record failed attempt
            attempt_tracker.add_attempt(client_ip)
            print(f"❌ Login failed for {login_data.email} - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Check if user is active
        if not user.is_active:
            print(f"❌ Login failed for {login_data.email} - account inactive")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support."
            )

        # Reset rate limiting on success
        attempt_tracker.reset_attempts(client_ip)
        print(f"✅ Rate limiting reset for IP: {client_ip}")

        # Cache user data in Redis for future requests (1 hour TTL)
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin if hasattr(user, 'is_admin') else False
        }
        
        cache_success = await CacheService.set_user_session(str(user.id), user_data, ttl=3600)
        if cache_success:
            print(f"✅ User {user.id} cached in Redis")
        else:
            print(f"⚠️ Redis cache unavailable for user {user.id}")

        # Generate unique session ID for this login
        session_id = str(uuid.uuid4())

        # Create JWT token with 30-minute expiry
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={
                "sub": str(user.id),
                "session": session_id,
                "email": user.email
            },
            expires_delta=access_token_expires
        )

        # Generate CSRF token for this session
        csrf_token = csrf_protection.generate_token(session_id)

        # Set HTTP-only cookie (for auth) - Can't be accessed by JavaScript
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        # Set CSRF token cookie (for JavaScript to read)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,  # JavaScript needs to read this
            secure=False,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        # Set session ID cookie (for CSRF tracking) - HTTP-only
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )

        # Log success with performance metrics
        print(f"✅ Login successful for {user.email}")
        print(f"   Session ID: {session_id}")
        print(f"   CSRF Token: {csrf_token[:10]}...")
        print(f"   Cookies set: access_token, csrf_token, session_id")
        password_cached = is_password_cached(str(user.id)) if password_valid else False
        print(f"   Password verification: {'cached' if password_cached else 'bcrypt'}") 

        # Return user data (excluding sensitive info)
        return {
            "message": "Login successful",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name
            }
        }

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log unexpected errors and return 500
        print(f"❌ Unexpected error during login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )

# ============================================================================
# LOGOUT ENDPOINT
# ============================================================================
@router.post("/logout")
async def logout(
    request: Request, 
    response: Response,
    current_user: User = Depends(get_current_user_from_cookie)
):
    """
    Clear authentication cookies and invalidate cache.
    """
    # Invalidate Redis cache
    await CacheService.invalidate_user_session(str(current_user.id))
    
    # Get session ID from cookie
    session_id = request.cookies.get("session_id")

    if session_id:
        # Remove CSRF token
        csrf_protection.remove_token(session_id)
        print(f"🚪 Logout for session: {session_id}")

    # Clear all cookies
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("csrf_token", path="/")
    response.delete_cookie("session_id", path="/")

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

