from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from app.core.config import settings
from app.services.cache_service import CacheService
from app.api.v1.endpoints import (
    accounts,
    auth,
    budgets,
    categories,
    payment_methods,
    transactions,
    transaction_payments,
    income,
    debt
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    await startup_validation()
    await CacheService.init()
    yield
    await CacheService.close()


async def startup_validation():
    """Run essential startup validation."""
    try:
        from app.core.schema_model_validator import run_all_checks
        run_all_checks()
    except Exception as e:
        logger.error(f"Startup validation failed: {e}")
        raise


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="SpendWise API - Personal Finance Management",
        description="Comprehensive personal finance management API",
        version="3.0.0",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        lifespan=lifespan
    )
    
    # Add GZip compression for response payloads
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Set up CORS with fallback
    cors_origins = []
    
    if hasattr(settings, 'BACKEND_CORS_ORIGINS') and settings.BACKEND_CORS_ORIGINS:
        cors_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
        logger.info(f"CORS origins configured: {cors_origins}")
    else:
        # Fallback to default origins
        cors_origins = [
            "http://localhost:3000",
            "http://frontend:3000",
            "http://localhost:8000",
        ]
        logger.warning(f"CORS origins not configured, using fallback: {cors_origins}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"]
    )
    
    # Include all routers
    app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
    app.include_router(budgets.router, prefix="/api/v1", tags=["budgets"])
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(payment_methods.router, prefix="/api/v1/payment-methods", tags=["payment-methods"])
    app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
    app.include_router(transaction_payments.router, prefix="/api/v1", tags=["transaction-payments"])
    app.include_router(income.router, prefix="/api/v1", tags=["income"])
    app.include_router(debt.router, prefix="/api/v1", tags=["debts"])
    
    # Add health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "spendwise-api",
            "version": "3.0.0"
        }
    
    # Add CORS test endpoint
    @app.get("/api/v1/test-cors")
    async def test_cors():
        return {
            "message": "CORS is working correctly",
            "allowed_origins": cors_origins
        }
    
    return app


app = create_application()