"""
Main FastAPI application for SpendWise API.
Includes comprehensive monitoring, logging, and middleware.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
import time
from typing import Dict, Any

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
from app.api.v1.endpoints import health
from app.middleware.metrics import MetricsMiddleware, metrics_endpoint
from app.core.logging_config import logger, RequestContext, log_request
from app.core.limiter import limiter, rate_limit_handler
from app.middleware.security import SecurityHeadersMiddleware

# Optional Sentry import
try:
    from app.core.sentry import init_sentry
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    logger.warning("Sentry module not available - skipping initialization")

# Configure basic logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager with monitoring.
    Handles startup and shutdown events.
    """
    logger.info("starting_up", phase="startup")
    start_time = time.time()
    
    # Startup
    try:
        # Initialize Sentry only if SENTRY_DSN exists in settings
        if SENTRY_AVAILABLE and hasattr(settings, 'SENTRY_DSN') and settings.SENTRY_DSN:
            init_sentry(
                dsn=settings.SENTRY_DSN,
                environment=getattr(settings, 'ENVIRONMENT', 'development')
            )
            logger.info("sentry_initialized")
        
        # Run startup validation
        await startup_validation()
        
        # Initialize Redis cache
        redis_client = await CacheService.get_redis()
        if redis_client:
            logger.info("cache_service_initialized", status="success")
        
        startup_time = (time.time() - start_time) * 1000
        logger.info("startup_complete", duration_ms=round(startup_time, 2))
        
        yield  # This is where the app runs
        
    except Exception as e:
        logger.error("startup_failed", error=str(e), phase="startup")
        raise
    
    finally:
        # Shutdown
        logger.info("shutting_down", phase="shutdown")
        await CacheService.close()
        logger.info("shutdown_complete")

async def startup_validation():
    """Run essential startup validation."""
    try:
        from app.core.schema_model_validator import run_all_checks
        run_all_checks()
        logger.info("startup_validation_passed")
    except Exception as e:
        logger.error("startup_validation_failed", error=str(e))
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

    # =========================================================================
    # MIDDLEWARE (Order matters!)
    # =========================================================================
    
    # 1. GZip compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    logger.info("gzip_middleware_configured")
    
    # 2. CORS
    cors_origins = settings.cors_origins
    logger.info("cors_configured", origins=cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"]
    )
    
    # 3. Security headers
    app.add_middleware(
        SecurityHeadersMiddleware, 
        is_development=settings.ENVIRONMENT == "development"
    )
    logger.info("security_headers_configured")
    
    # 4. Metrics middleware
    app.add_middleware(MetricsMiddleware)
    logger.info("metrics_middleware_configured")

    # 5. Request logging middleware (custom)
    @app.middleware("http")
    async def request_logging_middleware(request: Request, call_next):
        """Log all requests with timing and metadata."""
        request_id = request.headers.get("X-Request-ID", None)
        with RequestContext(request_id):
            start_time = time.time()
            
            # Process request
            try:
                response = await call_next(request)
                status_code = response.status_code
            except Exception as e:
                status_code = 500
                raise e
            finally:
                # Calculate duration
                duration = (time.time() - start_time) * 1000
                
                # Get user ID from request state if available
                user_id = getattr(request.state, "user_id", None)
                
                # Log the request
                log_request(
                    method=request.method,
                    path=request.url.path,
                    status_code=status_code,
                    duration_ms=duration,
                    user_id=user_id
                )
            
            return response
    logger.info("request_logging_middleware_configured")

    # 6. Rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(429, rate_limit_handler)
    logger.info("rate_limiter_configured")

    # =========================================================================
    # ROUTERS
    # =========================================================================
    
    # Health and monitoring endpoints
    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    logger.info("health_routes_configured")
    
    # Authentication
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
    logger.info("auth_routes_configured")
    
    # Core financial endpoints
    app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
    app.include_router(budgets.router, prefix="/api/v1", tags=["budgets"])
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(payment_methods.router, prefix="/api/v1/payment-methods", tags=["payment-methods"])
    app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
    app.include_router(transaction_payments.router, prefix="/api/v1", tags=["transaction-payments"])
    app.include_router(income.router, prefix="/api/v1", tags=["income"])
    app.include_router(debt.router, prefix="/api/v1", tags=["debts"])
    
    logger.info("core_routes_configured", count=9)

    # =========================================================================
    # METRICS ENDPOINT
    # =========================================================================
    app.add_route("/metrics", metrics_endpoint)
    logger.info("metrics_endpoint_configured")

    # =========================================================================
    # SIMPLE HEALTH CHECK
    # =========================================================================
    @app.get("/health")
    async def simple_health():
        """Simple health check for load balancers."""
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "3.0.0"
        }
    logger.info("simple_health_endpoint_configured")

    # =========================================================================
    # ROOT ENDPOINT
    # =========================================================================
    @app.get("/")
    async def root():
        """API root with version info."""
        return {
            "name": "SpendWise API",
            "version": "3.0.0",
            "environment": settings.ENVIRONMENT,
            "documentation": "/api/v1/docs"
        }
    logger.info("root_endpoint_configured")

    logger.info("application_created", version="3.0.0", environment=settings.ENVIRONMENT)
    return app

# Create the application instance
app = create_application()