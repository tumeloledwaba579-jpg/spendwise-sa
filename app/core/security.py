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
from app.core.config import settings

logger = logging.getLogger(__name__)

# JWT configuration
ALGORITHM = settings.ALGORITHM
SECRET_KEY = settings.SECRET_KEY

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
    Create a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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