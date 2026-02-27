"""
Debt management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.debt_service import DebtService
from app.schemas.debt import (
    DebtAccountCreate,
    DebtAccountUpdate,
    DebtAccountInDB,
    DebtPaymentCreate,
    DebtPaymentInDB,
    DebtSummary,
    DebtStats,
    PayoffStrategy
)

router = APIRouter(prefix="/debts", tags=["debts"])


# ============================================================================
# DEBT ACCOUNT ENDPOINTS
# ============================================================================

@router.post("/accounts", response_model=DebtAccountInDB, status_code=status.HTTP_201_CREATED)
async def create_debt_account(
    account_in: DebtAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtAccountInDB:
    """Create a new debt account."""
    service = DebtService(db)
    return await service.create_debt_account(current_user.id, account_in)


@router.get("/accounts", response_model=List[DebtAccountInDB])
async def list_debt_accounts(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[DebtAccountInDB]:
    """List all debt accounts for the current user."""
    service = DebtService(db)
    return await service.list_debt_accounts(current_user.id, active_only=active_only)


@router.get("/accounts/{account_id}", response_model=DebtAccountInDB)
async def get_debt_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtAccountInDB:
    """Get a specific debt account."""
    service = DebtService(db)
    account = await service.get_debt_account(current_user.id, account_id)
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found"
        )
    
    return account


@router.put("/accounts/{account_id}", response_model=DebtAccountInDB)
async def update_debt_account(
    account_id: UUID,
    account_in: DebtAccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtAccountInDB:
    """Update a debt account."""
    service = DebtService(db)
    account = await service.update_debt_account(current_user.id, account_id, account_in)
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found"
        )
    
    return account


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_debt_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Deactivate a debt account."""
    service = DebtService(db)
    success = await service.deactivate_debt_account(current_user.id, account_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found"
        )


# ============================================================================
# DEBT PAYMENT ENDPOINTS
# ============================================================================

@router.post("/payments", response_model=DebtPaymentInDB, status_code=status.HTTP_201_CREATED)
async def record_debt_payment(
    payment_in: DebtPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtPaymentInDB:
    """Record a debt payment."""
    service = DebtService(db)
    
    try:
        return await service.record_payment(current_user.id, payment_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payments", response_model=List[DebtPaymentInDB])
async def get_debt_payments(
    account_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[DebtPaymentInDB]:
    """Get debt payment history."""
    service = DebtService(db)
    return await service.get_payment_history(
        current_user.id,
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )


# ============================================================================
# DEBT ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/summary", response_model=DebtSummary)
async def get_debt_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtSummary:
    """Get debt summary for a specific period or current totals."""
    service = DebtService(db)
    return await service.get_debt_summary(current_user.id, year=year, month=month)


@router.get("/stats", response_model=DebtStats)
async def get_debt_stats(
    year: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DebtStats:
    """Get annual debt statistics."""
    service = DebtService(db)
    return await service.get_debt_stats(current_user.id, year)


@router.get("/payoff-strategy", response_model=PayoffStrategy)
async def calculate_payoff_strategy(
    strategy_type: str = "SNOWBALL",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PayoffStrategy:
    """Calculate optimal debt payoff strategy."""
    if strategy_type.upper() not in ["SNOWBALL", "AVALANCHE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Strategy must be either SNOWBALL or AVALANCHE"
        )
    
    service = DebtService(db)
    return await service.calculate_payoff_strategy(current_user.id, strategy_type.upper())


@router.get("/health")
async def health_check():
    """Health check endpoint for debt module."""
    return {"status": "healthy", "module": "debt"}



