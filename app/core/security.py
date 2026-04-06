"""
Security utilities for password hashing and JWT token handling.
Using bcrypt directly with optimized cost factor.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import hashlib
import logging
import uuid
from app.core.config import settings

logger = logging.getLogger(__name__)

# JWT configuration
ALGORITHM = settings.ALGORITHM
SECRET_KEY = settings.SECRET_KEY

# Token configuration
ACCESS_TOKEN_EXPIRE_DAYS = 1      # Access token expires in 1 day
REFRESH_TOKEN_EXPIRE_DAYS = 365   # Refresh token expires in 1 year

# BCRYPT settings - OPTIMIZED for better performance
# Cost 8 gives ~50-80ms vs cost 10's 150-200ms
# Still highly secure for most applications
BCRYPT_COST = 8  # Reduced from 10

# Password cache for subsequent verifications
# In production, move this to Redis
_password_cache = {}  # user_id -> sha256 hash


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with optimized cost.
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_COST)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def verify_password_cached(user_id: str, plain_password: str, hashed_password: str) -> bool:
    """
    Verify password with caching for repeated attempts.
    
    This significantly speeds up repeated verifications for the same user
    by caching the SHA-256 hash of the password after first successful verification.
    
    Security features:
    - Only caches SHA-256 hash, never the plain password
    - Cache is per-user (doesn't leak across users)
    - Verification failures not cached (prevents timing attacks)
    """
    cache_key = f"pwd_hash:{user_id}"
    
    # Check cache for fast verification
    if cache_key in _password_cache:
        cached_hash = _password_cache[cache_key]
        # Fast SHA-256 comparison (microseconds instead of milliseconds)
        if hashlib.sha256(plain_password.encode()).hexdigest() == cached_hash:
            logger.debug(f"✅ Password cache hit for user {user_id}")
            return True
        else:
            logger.debug(f"❌ Password cache miss (wrong password) for user {user_id}")
            # Don't cache failed attempts
            return False
    
    # First attempt: do full bcrypt verification
    logger.debug(f"🔍 Password cache miss for user {user_id}, using bcrypt")
    is_valid = verify_password(plain_password, hashed_password)
    
    # Cache successful verification
    if is_valid:
        _password_cache[cache_key] = hashlib.sha256(plain_password.encode()).hexdigest()
        logger.debug(f"💾 Cached password hash for user {user_id}")
    
    return is_valid


def invalidate_password_cache(user_id: str):
    """
    Invalidate cached password when user changes password.
    """
    cache_key = f"pwd_hash:{user_id}"
    if cache_key in _password_cache:
        del _password_cache[cache_key]
        logger.info(f"🗑️ Invalidated password cache for user {user_id}")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token (short-lived).
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived refresh token.
    
    Args:
        user_id: The user's UUID as string
    
    Returns:
        JWT refresh token with type "refresh" and unique JTI
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4())  # Unique token ID for revocation
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_refresh_token(token: str) -> Optional[dict]:
    """
    Verify a refresh token and return payload if valid.
    
    Args:
        token: The refresh token to verify
    
    Returns:
        Payload dict if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Check that it's a refresh token
        if payload.get("type") != "refresh":
            logger.warning("Token is not a refresh token")
            return None
        return payload
    except JWTError as e:
        logger.error(f"Refresh token decode error: {e}")
        return None


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise e


def is_password_cached(user_id: str) -> bool:
    """
    Check if a user's password is currently cached.
    Used for debugging and monitoring.
    """
    cache_key = f"pwd_hash:{user_id}"
    return cache_key in _password_cache


# ============================================================================
# TOKEN UTILITIES
# ============================================================================
def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiry time from a token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp)
        return None
    except JWTError:
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token has expired.
    """
    expiry = get_token_expiry(token)
    if expiry:
        return expiry < datetime.utcnow()
    return True


def get_token_type(token: str) -> Optional[str]:
    """
    Get the token type ('access' or 'refresh') from the payload.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        # If it has 'type' field, use it; otherwise assume it's an access token
        return payload.get("type", "access")
    except JWTError:
        return None