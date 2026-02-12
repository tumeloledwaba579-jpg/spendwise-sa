from fastapi import APIRouter
from app.api.v1.endpoints import accounts, categories, payment_methods

router = APIRouter()

router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(payment_methods.router, prefix="/payment-methods", tags=["payment-methods"])
