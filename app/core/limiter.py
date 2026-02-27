"""
Rate limiting configuration for authentication endpoints.
Provides rate limiting, attempt tracking, and custom exception handling.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
from typing import Dict, List, Optional
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    "auth": "5/minute",      # Login/register: 5 per minute
    "api": "100/minute",      # General API: 100 per minute
    "sensitive": "10/minute",  # Password reset: 10 per minute
    "public": "1000/minute",   # Public endpoints: 1000 per minute
}

class AttemptTracker:
    """
    Track failed login attempts per IP address.
    In production, this should use Redis instead of in-memory storage.
    
    Features:
    - Tracks failed attempts per IP
    - Automatic cleanup of old attempts
    - Lockout after max attempts
    - Configurable attempt limits and windows
    """
    
    def __init__(self):
        self.attempts: Dict[str, List[float]] = {}  # IP -> list of attempt timestamps
        self.lock_time: Dict[str, float] = {}       # IP -> unlock timestamp
        logger.info("✓ AttemptTracker initialized (in-memory)")
    
    def check_attempts(self, ip: str, max_attempts: int = 5, window: int = 300) -> bool:
        """
        Check if IP has exceeded max attempts.
        
        Args:
            ip: Client IP address
            max_attempts: Maximum attempts allowed (default 5)
            window: Time window in seconds (default 300 = 5 minutes)
            
        Returns:
            True if within limits
            
        Raises:
            HTTPException 429 if rate limit exceeded
        """
        now = time.time()
        
        # Check if IP is locked
        if ip in self.lock_time and now < self.lock_time[ip]:
            remaining = int(self.lock_time[ip] - now)
            logger.warning(f"🔒 IP {ip} is locked for {remaining} more seconds")
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Too many failed attempts. Try again in {remaining} seconds.",
                    "retry_after": remaining
                }
            )
        
        # Clean old attempts outside the window
        if ip in self.attempts:
            old_count = len(self.attempts[ip])
            self.attempts[ip] = [
                t for t in self.attempts[ip] 
                if now - t < window
            ]
            new_count = len(self.attempts[ip])
            if old_count != new_count:
                logger.debug(f"Cleaned {old_count - new_count} old attempts for IP {ip}")
        else:
            self.attempts[ip] = []
        
        # Check if attempts exceed limit
        attempt_count = len(self.attempts[ip])
        if attempt_count >= max_attempts:
            # Lock for 15 minutes
            lock_duration = 900  # 15 minutes
            self.lock_time[ip] = now + lock_duration
            logger.warning(f"🔒 IP {ip} locked for {lock_duration} seconds after {attempt_count} attempts")
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": "Too many failed attempts. Locked for 15 minutes.",
                    "retry_after": lock_duration
                }
            )
        
        logger.debug(f"IP {ip} has {attempt_count}/{max_attempts} attempts in window")
        return True
    
    def add_attempt(self, ip: str):
        """
        Record a failed attempt.
        
        Args:
            ip: Client IP address
        """
        if ip not in self.attempts:
            self.attempts[ip] = []
        self.attempts[ip].append(time.time())
        attempt_count = len(self.attempts[ip])
        logger.info(f"⚠️ Failed attempt recorded for IP: {ip} (total: {attempt_count})")
    
    def reset_attempts(self, ip: str):
        """
        Reset attempts on successful login.
        
        Args:
            ip: Client IP address
        """
        if ip in self.attempts:
            del self.attempts[ip]
            logger.info(f"✅ Attempts reset for IP: {ip}")
        if ip in self.lock_time:
            del self.lock_time[ip]
            logger.info(f"✅ Lock removed for IP: {ip}")
    
    def get_attempt_count(self, ip: str) -> int:
        """
        Get current attempt count for an IP.
        
        Args:
            ip: Client IP address
            
        Returns:
            Number of attempts in current window
        """
        if ip not in self.attempts:
            return 0
        
        # Clean old attempts first
        now = time.time()
        window = 300  # 5 minutes
        self.attempts[ip] = [
            t for t in self.attempts[ip] 
            if now - t < window
        ]
        return len(self.attempts[ip])
    
    def get_lock_remaining(self, ip: str) -> Optional[int]:
        """
        Get remaining lock time for an IP.
        
        Args:
            ip: Client IP address
            
        Returns:
            Seconds remaining, or None if not locked
        """
        if ip in self.lock_time:
            remaining = int(self.lock_time[ip] - time.time())
            return max(0, remaining)
        return None


# Rate limit handler
async def rate_limit_handler(request: Request, exc: HTTPException):
    """
    Custom handler for rate limit exceeded exceptions.
    Returns a JSON response with error details.
    """
    logger.warning(f"🚫 Rate limit exceeded for {request.client.host} - {request.url.path}")
    
    # Extract details from exception
    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", "Rate limit exceeded")
        retry_after = exc.detail.get("retry_after", 60)
    else:
        message = str(exc.detail)
        retry_after = 60
    
    return JSONResponse(
        status_code=429,
        headers={"Retry-After": str(retry_after)},
        content={
            "error": "rate_limit_exceeded",
            "message": message,
            "retry_after": retry_after,
            "detail": "Too many requests. Please wait before trying again."
        }
    )


# Create global instance
attempt_tracker = AttemptTracker()

# Export all necessary components
__all__ = [
    "limiter", 
    "RATE_LIMITS", 
    "AttemptTracker", 
    "attempt_tracker", 
    "rate_limit_handler"
]