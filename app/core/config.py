from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # CORS - MUST be a string, not List[str]
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://frontend:3000,http://localhost:8000"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 👇 ADD THESE LINES 👇
    ENVIRONMENT: str = "development"
    SENTRY_DSN: Optional[str] = None  # Optional Sentry DSN

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def cors_origins(self) -> List[str]:
        """Convert comma-separated string to list"""
        if not self.BACKEND_CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

settings = Settings()

# DEBUG - Print what we're getting
print(f"Raw BACKEND_CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
print(f"Parsed cors_origins: {settings.cors_origins}")
