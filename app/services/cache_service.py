"""
Redis caching service for performance optimization.
"""
import json
import logging
from typing import Any, Optional
from datetime import timedelta

logger = logging.getLogger(__name__)

# Try to import redis, but make it optional
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not installed. Caching disabled.")

from app.core.config import settings


class CacheService:
    """Redis cache service for distributed caching."""
    
    _redis: Optional[Any] = None
    
    @classmethod
    async def init(cls):
        """Initialize Redis connection."""
        if not REDIS_AVAILABLE:
            logger.info("Redis caching disabled (module not installed)")
            return
        
        try:
            cls._redis = await redis.from_url(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
                encoding="utf8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True
            )
            
            # Test connection
            await cls._redis.ping()
            logger.info("Redis cache initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled.")
            cls._redis = None
    
    @classmethod
    async def close(cls):
        """Close Redis connection."""
        if cls._redis:
            await cls._redis.close()
            logger.info("Redis cache closed")
    
    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        if not cls._redis:
            return None
        
        try:
            value = await cls._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
            return None
    
    @classmethod
    async def set(
        cls,
        key: str,
        value: Any,
        ttl: int = 3600  # 1 hour default
    ) -> bool:
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default 1 hour)
            
        Returns:
            True if successful, False otherwise
        """
        if not cls._redis:
            return False
        
        try:
            json_value = json.dumps(value, default=str)
            await cls._redis.setex(key, ttl, json_value)
            return True
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")
            return False
    
    @classmethod
    async def delete(cls, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key existed, False otherwise
        """
        if not cls._redis:
            return False
        
        try:
            result = await cls._redis.delete(key)
            return result > 0
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")
            return False
    
    @classmethod
    async def invalidate_pattern(cls, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.
        
        Args:
            pattern: Pattern to match (e.g., 'income:stats:*')
            
        Returns:
            Number of keys deleted
        """
        if not cls._redis:
            return 0
        
        try:
            keys = await cls._redis.keys(pattern)
            if keys:
                return await cls._redis.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Cache invalidate pattern error for {pattern}: {e}")
            return 0
    
    @classmethod
    async def clear_all(cls) -> bool:
        """
        Clear all cache (use with caution!).
        
        Returns:
            True if successful
        """
        if not cls._redis:
            return False
        
        try:
            await cls._redis.flushdb()
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.warning(f"Cache clear error: {e}")
            return False
