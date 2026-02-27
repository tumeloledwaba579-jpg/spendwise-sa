"""
Database configuration with connection pooling.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Optimized engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable echo in production
    pool_size=20,           # Increased from default
    max_overflow=10,        # Allow burst connections
    pool_pre_ping=True,     # Verify connections before using
    pool_recycle=3600,      # Recycle after 1 hour
    pool_timeout=30         # Wait up to 30 seconds for connection
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """
    Dependency to get database session.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def close_db():
    """Close database connection pool."""
    await engine.dispose()