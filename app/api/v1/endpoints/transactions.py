"""
Transaction management endpoints for SpendWise API.
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut
from app.api.v1.deps_cookie import get_current_user
from app.models.user import User

router = APIRouter(prefix="/transactions", tags=["transactions"])

# ============================================================================
# PUBLIC REDIRECT - NO AUTH REQUIRED
# ============================================================================
@router.get("", include_in_schema=False)
async def redirect_transactions(request: Request):
    """
    Public redirect for transactions root path.
    Redirects /transactions to /transactions/ without authentication.
    """
    print(f"🔄 Redirecting {request.url.path} to {request.url.path}/")
    return RedirectResponse(url=f"{request.url.path}/", status_code=307)

@router.get("/summary", include_in_schema=False)
async def redirect_summary(request: Request):
    """
    Public redirect for summary endpoint.
    """
    print(f"🔄 Redirecting {request.url.path} to {request.url.path}/")
    return RedirectResponse(url=f"{request.url.path}/", status_code=307)

# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================
@router.get("/", response_model=List[TransactionOut])
async def get_transactions(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    account_id: Optional[UUID] = Query(None, description="Filter by account ID"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    is_recurring: Optional[bool] = Query(None, description="Filter by recurring status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TransactionOut]:
    """
    Retrieve paginated list of user's financial transactions.
    """
    service = TransactionService(db)
    transactions = await service.get_transactions(
        user_id=current_user.id,
        account_id=account_id,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
        transaction_type=transaction_type,
        is_recurring=is_recurring
    )
    return transactions

@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Create a new financial transaction.
    """
    service = TransactionService(db)
    transaction = await service.create_transaction(
        user_id=current_user.id,
        transaction_in=transaction_in
    )
    return transaction

@router.get("/summary/", response_model=dict)
async def get_transaction_summary(
    start_date: Optional[datetime] = Query(None, description="Start date for summary"),
    end_date: Optional[datetime] = Query(None, description="End date for summary"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get transaction summary statistics.
    """
    service = TransactionService(db)
    summary = await service.get_transaction_summary(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    return summary

@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Retrieve a specific transaction by ID.
    """
    service = TransactionService(db)
    transaction = await service.get_transaction_by_id(transaction_id, current_user.id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction

@router.put("/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Update an existing transaction.
    """
    service = TransactionService(db)
    transaction = await service.update_transaction(
        transaction_id=transaction_id,
        user_id=current_user.id,
        transaction_in=transaction_in
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a transaction.
    """
    service = TransactionService(db)
    success = await service.delete_transaction(transaction_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return None