from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database configuration
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "root123"
    POSTGRES_DB: str = "spendwise_db"
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:root123@127.0.0.1:5432/spendwise_db"
    
    # Add this line - Test database URL
    TEST_DATABASE_URL: str = "postgresql+asyncpg://postgres:root123@127.0.0.1:5433/spendwise_db_test"
    
    # JWT configuration (for authentication)
    SECRET_KEY: str = "your-secret-key-change-in-production-32-characters-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()




