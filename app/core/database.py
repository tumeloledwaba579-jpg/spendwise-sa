from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Debug: Print the generated URL
print(f"Database URL: {settings.DATABASE_URL}")

# Create async engine - this should now be: postgresql+asyncpg://postgres:root123@postgres:5432/spendwise_db
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Keep True for debugging
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def close_db():
    await engine.dispose()
