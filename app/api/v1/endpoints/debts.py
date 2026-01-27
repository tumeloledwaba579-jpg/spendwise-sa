"""
API endpoints for debt management module.
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.debt import (
    DebtAccountCreate, DebtAccountInDB, DebtAccountUpdate,
    DebtPaymentCreate, DebtPaymentInDB,
    DebtSummary, DebtStats, PayoffStrategy
)
from app.services.debt_service import DebtService

router = APIRouter(prefix="/debts", tags=["debts"])


# ============================================================================
# DEBT ACCOUNT ENDPOINTS
# ============================================================================

@router.post("/accounts", response_model=DebtAccountInDB, status_code=201)
async def create_debt_account(
    account_in: DebtAccountCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new debt account.

    - **name**: Account name (e.g., "Chase Credit Card", "Student Loan")
    - **type**: CREDIT_CARD, PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, STUDENT_LOAN, OTHER
    - **current_balance**: Current balance (must be > 0)
    - **interest_rate**: Annual interest rate (0-100)
    - **credit_limit**: Credit limit (optional, for credit cards)
    - **minimum_payment**: Minimum monthly payment (optional)
    - **due_date**: Day of month the payment is due (optional, 1-31)
    - **start_date**: Date the debt was started
    - **payoff_date**: Target payoff date (optional)
    """
    service = DebtService(session)
    return await service.create_debt_account(current_user.id, account_in)


@router.get("/accounts", response_model=List[DebtAccountInDB])
async def list_debt_accounts(
    active_only: bool = Query(True, description="Only show active accounts"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all debt accounts for the current user."""
    service = DebtService(session)
    return await service.list_debt_accounts(current_user.id, active_only)


@router.get("/accounts/{account_id}", response_model=DebtAccountInDB)
async def get_debt_account(
    account_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific debt account by ID."""
    service = DebtService(session)
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
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a debt account."""
    service = DebtService(session)
    account = await service.update_debt_account(current_user.id, account_id, account_in)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found"
        )
    return account


@router.delete("/accounts/{account_id}", status_code=204)
async def deactivate_debt_account(
    account_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate a debt account (soft delete)."""
    service = DebtService(session)
    success = await service.deactivate_debt_account(current_user.id, account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found"
        )


# ============================================================================
# DEBT PAYMENT ENDPOINTS
# ============================================================================

@router.post("/payments", response_model=DebtPaymentInDB, status_code=201)
async def record_debt_payment(
    payment_in: DebtPaymentCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a payment on a debt account.

    - **debt_account_id**: ID of the debt account
    - **amount**: Payment amount (must be > 0)
    - **payment_date**: Date of the payment
    - **payment_method**: BANK_TRANSFER, CHECK, CREDIT_CARD, AUTO_PAY, OTHER (optional)
    """
    service = DebtService(session)
    try:
        return await service.record_payment(current_user.id, payment_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payments", response_model=List[DebtPaymentInDB])
async def get_payment_history(
    account_id: Optional[UUID] = Query(None, description="Filter by debt account"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment history for the current user."""
    service = DebtService(session)
    return await service.get_payment_history(
        current_user.id, account_id, start_date, end_date
    )


# ============================================================================
# DEBT ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/summary", response_model=DebtSummary)
async def get_debt_summary(
    year: Optional[int] = Query(None, ge=2000, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get debt summary for a specific period or current totals."""
    service = DebtService(session)
    return await service.get_debt_summary(current_user.id, year, month)


@router.get("/stats", response_model=DebtStats)
async def get_debt_stats(
    year: int = Query(..., ge=2000, le=2100, description="Year for statistics"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get annual debt statistics."""
    service = DebtService(session)
    return await service.get_debt_stats(current_user.id, year)


@router.get("/payoff-strategy", response_model=PayoffStrategy)
async def get_payoff_strategy(
    strategy_type: str = Query("SNOWBALL", pattern="^(SNOWBALL|AVALANCHE)$"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate optimal debt payoff strategy (snowball or avalanche)."""
    service = DebtService(session)
    return await service.calculate_payoff_strategy(current_user.id, strategy_type)
