from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from datetime import datetime

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="SpendWise API - Personal Finance Management",
    description="""A comprehensive REST API for managing personal finances.
    
## Features
- **Budget Planning**: Create and track budgets for different categories
- **Transaction Management**: Record and categorize expenses/income
- **Account Tracking**: Monitor bank and cash accounts
- **Payment Methods**: Manage various payment options
- **Financial Reports**: Generate insights on spending patterns

## Authentication
Uses JWT tokens for secure API access.
""",
    version="1.0.0",
    contact={
        "name": "SpendWise Support",
        "email": "support@spendwise.com",
        "url": "https://spendwise.com/support"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    },
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and token management"
        },
        {
            "name": "accounts",
            "description": "Bank accounts and financial account management"
        },
        {
            "name": "budgets",
            "description": "Budget planning, tracking, and analysis"
        },
        {
            "name": "categories",
            "description": "Transaction categorization and management"
        },
        {
            "name": "payment-methods",
            "description": "Credit cards, cash, digital wallets, etc."
        },
        {
            "name": "transaction-payments",
            "description": "Payment tracking for transactions"
        },
        {
            "name": "transactions",
            "description": "Income and expense transaction management"
        },
        {
            "name": "health",
            "description": "API health and status monitoring"
        }
    ]
)

# Health endpoint - add this BEFORE the CORS middleware for immediate access
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for API monitoring.
    
    Returns:
        dict: API status including:
            - status: "healthy" or "unhealthy"
            - timestamp: Current UTC time
            - service: API name
            - version: API version
            - uptime: Approximate uptime in seconds
    """
    from datetime import datetime
    import time
    
    # Simple health check - in production, add database connectivity, etc.
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "SpendWise API",
        "version": "1.0.0",
        "uptime": "unknown",  # For production, calculate actual uptime
        "endpoints": {
            "openapi": "/api/v1/openapi.json",
            "docs": "/api/v1/docs",
            "redoc": "/api/v1/redoc"
        }
    }

# Set up CORS - keep your existing CORS configuration
if hasattr(settings, "BACKEND_CORS_ORIGINS") and settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Optional: Add default CORS for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Import all existing routers
from app.api.v1.endpoints import (
    accounts,
    auth,
    budgets,
    categories,
    payment_methods,
    transaction_payments,
    transactions
)

# Include routers with appropriate prefixes and tags
# Note: API prefix is hardcoded as "/api/v1" since settings doesn't have API_V1_STR
app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(budgets.router, prefix="/api/v1", tags=["budgets"])  # router has its own prefix="/budgets"
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(payment_methods.router, prefix="/api/v1/payment-methods", tags=["payment-methods"])
app.include_router(transaction_payments.router, prefix="/api/v1", tags=["transaction-payments"])  # router has prefix="/transaction-payments"
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])  # router has prefix="/transactions"