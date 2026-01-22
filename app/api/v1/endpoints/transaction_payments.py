"""
TransactionPayment CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.transaction_payment import TransactionPayment
from app.models.transaction import Transaction
from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.transaction_payment import TransactionPaymentCreate, TransactionPaymentUpdate, TransactionPaymentOut

router = APIRouter(prefix="/transaction-payments", tags=["transaction-payments"])


@router.get("/", response_model=List[TransactionPaymentOut])
async def get_transaction_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    transaction_id: Optional[str] = None,
    payment_method_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all transaction payments for the current user with optional filters.
    """
    # Start with base query joining with transaction to ensure user ownership
    query = select(TransactionPayment).join(
        Transaction, TransactionPayment.transaction_id == Transaction.id
    ).where(
        Transaction.user_id == current_user.id
    )
    
    # Apply filters
    if transaction_id:
        query = query.where(TransactionPayment.transaction_id == transaction_id)
    if payment_method_id:
        query = query.where(TransactionPayment.payment_method_id == payment_method_id)
    if status:
        query = query.where(TransactionPayment.status == status)
    
    query = query.offset(skip).limit(limit).order_by(TransactionPayment.created_at.desc())
    
    result = await db.execute(query)
    transaction_payments = result.scalars().all()
    
    return transaction_payments


@router.get("/{payment_id}", response_model=TransactionPaymentOut)
async def get_transaction_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific transaction payment by ID.
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()
    
    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )
    
    return transaction_payment


@router.post("/", response_model=TransactionPaymentOut, status_code=status.HTTP_201_CREATED)
async def create_transaction_payment(
    payment_in: TransactionPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new transaction payment.
    """
    # Verify transaction belongs to user
    transaction_result = await db.execute(
        select(Transaction).where(
            Transaction.id == payment_in.transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = transaction_result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Verify payment method belongs to user
    payment_method_result = await db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == payment_in.payment_method_id,
            PaymentMethod.user_id == current_user.id
        )
    )
    payment_method = payment_method_result.scalar_one_or_none()
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Create transaction payment
    transaction_payment = TransactionPayment(
        **payment_in.dict()
    )
    
    db.add(transaction_payment)
    await db.commit()
    await db.refresh(transaction_payment)
    
    return transaction_payment


@router.put("/{payment_id}", response_model=TransactionPaymentOut)
async def update_transaction_payment(
    payment_id: str,
    payment_in: TransactionPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a transaction payment.
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()
    
    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )
    
    # Update fields
    update_data = payment_in.dict(exclude_unset=True)
    
    # Verify payment method if being updated
    if "payment_method_id" in update_data and update_data["payment_method_id"]:
        payment_method_result = await db.execute(
            select(PaymentMethod).where(
                PaymentMethod.id == update_data["payment_method_id"],
                PaymentMethod.user_id == current_user.id
            )
        )
        payment_method = payment_method_result.scalar_one_or_none()
        
        if not payment_method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found"
            )
    
    for field, value in update_data.items():
        setattr(transaction_payment, field, value)
    
    await db.commit()
    await db.refresh(transaction_payment)
    
    return transaction_payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a transaction payment.
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()
    
    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )
    
    await db.delete(transaction_payment)
    await db.commit()
    
    return None
