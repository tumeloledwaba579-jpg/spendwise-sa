"""
Redis cache service for user sessions and frequently accessed data.
"""
import json
import logging
from typing import Optional, Any
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    _redis_client = None

    @classmethod
    async def get_redis(cls):
        """Get or create Redis connection."""
        if not cls._redis_client:
            try:
                cls._redis_client = await redis.from_url(
                    f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                    decode_responses=True
                )
                await cls._redis_client.ping()
                logger.info("✓ Redis connected successfully")
            except Exception as e:
                logger.warning(f"⚠️ Redis not available: {e}. Caching disabled.")
                return None
        return cls._redis_client

    @classmethod
    async def get_user_session(cls, user_id: str) -> Optional[dict]:
        """Get cached user session data."""
        try:
            redis_client = await cls.get_redis()
            if not redis_client:
                return None
            
            key = f"user:{user_id}"
            data = await redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error getting user session: {e}")
            return None

    @classmethod
    async def set_user_session(cls, user_id: str, user_data: dict, ttl: int = 3600) -> bool:
        """Cache user session data with TTL (default 1 hour)."""
        try:
            redis_client = await cls.get_redis()
            if not redis_client:
                return False
            
            key = f"user:{user_id}"
            await redis_client.setex(key, ttl, json.dumps(user_data, default=str))
            return True
        except Exception as e:
            logger.error(f"Error setting user session: {e}")
            return False

    @classmethod
    async def invalidate_user_session(cls, user_id: str) -> bool:
        """Remove cached user session."""
        try:
            redis_client = await cls.get_redis()
            if not redis_client:
                return False
            
            key = f"user:{user_id}"
            await redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error invalidating user session: {e}")
            return False

    @classmethod
    async def close(cls):
        """Close Redis connection."""
        if cls._redis_client:
            await cls._redis_client.close()
            cls._redis_client = None
            logger.info("Redis connection closed")