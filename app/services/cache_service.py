import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class CacheService:
    _redis_client = None
    
    @classmethod
    async def init(cls):
        """Initialize Redis connection"""
        try:
            cls._redis_client = await redis.from_url(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                decode_responses=True
            )
            await cls._redis_client.ping()
            logger.info("✓ Redis connected successfully")
        except Exception as e:
            logger.warning(f"⚠ Redis not available: {e}. Caching disabled.")
            cls._redis_client = None
    
    @classmethod
    async def close(cls):
        """Close Redis connection"""
        if cls._redis_client:
            await cls._redis_client.close()
            cls._redis_client = None
            logger.info("Redis connection closed")

cache_service = CacheService()