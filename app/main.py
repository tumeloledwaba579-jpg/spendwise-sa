from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from app.core.config import settings
from app.api.v1.endpoints import (
    accounts,
    auth,
    budgets,
    categories,
    payment_methods,
    transactions,
    transaction_payments,
    income
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    await startup_validation()
    yield
    pass


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
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc"
    )
    
    # Add GZip compression for response payloads (OPTIMIZATION)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Set up CORS
    if hasattr(settings, 'BACKEND_CORS_ORIGINS') and settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
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
    
    return app


app = create_application()
