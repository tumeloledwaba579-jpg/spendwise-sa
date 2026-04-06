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

    # JWT - Token Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    # ✅ Update token expiry settings
    # Access token - short-lived (1 day)
    ACCESS_TOKEN_EXPIRE_DAYS: int = 1
    # For backward compatibility (minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours (1 day)
    
    # ✅ Add refresh token configuration
    REFRESH_TOKEN_EXPIRE_DAYS: int = 365  # 1 year

    # Environment
    ENVIRONMENT: str = "development"
    SENTRY_DSN: Optional[str] = None

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

    @property
    def access_token_expire_seconds(self) -> int:
        """Get access token expiry in seconds"""
        return self.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    @property
    def refresh_token_expire_seconds(self) -> int:
        """Get refresh token expiry in seconds"""
        return self.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

settings = Settings()

# DEBUG - Print what we're getting
print(f"Raw BACKEND_CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
print(f"Parsed cors_origins: {settings.cors_origins}")
print(f"Access token expires in: {settings.ACCESS_TOKEN_EXPIRE_DAYS} days")
print(f"Refresh token expires in: {settings.REFRESH_TOKEN_EXPIRE_DAYS} days")