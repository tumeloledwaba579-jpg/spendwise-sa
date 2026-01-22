from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Create FastAPI app with sensible defaults
app = FastAPI(
    title="SpendWise API",  # Hardcoded since settings doesn't have PROJECT_NAME
    openapi_url="/api/v1/openapi.json"  # Hardcoded since settings doesn't have API_V1_STR
)

# Set up CORS - check if BACKEND_CORS_ORIGINS exists in settings
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