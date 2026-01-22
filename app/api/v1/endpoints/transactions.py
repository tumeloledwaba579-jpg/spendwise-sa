"""
Transaction CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from datetime import datetime
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=List[TransactionOut])
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[float] = Query(None, ge=0),
    max_amount: Optional[float] = Query(None, ge=0),
    search: Optional[str] = None,
    is_transfer: Optional[bool] = None,
    is_recurring: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all transactions for the current user with optional filters.
    """
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    
    # Apply filters
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.where(Transaction.amount <= max_amount)
    if search:
        query = query.where(
            or_(
                Transaction.description.ilike(f"%{search}%"),
                Transaction.notes.ilike(f"%{search}%")
            )
        )
    if is_transfer is not None:
        query = query.where(Transaction.is_transfer == is_transfer)
    if is_recurring is not None:
        query = query.where(Transaction.is_recurring == is_recurring)
    
    query = query.offset(skip).limit(limit).order_by(Transaction.transaction_date.desc())
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return transactions


@router.get("/summary", response_model=dict)
async def get_transaction_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get transaction summary (total income, expenses, etc.).
    """
    from sqlalchemy import func
    
    # Get all transactions with their categories
    query = select(
        Transaction.amount,
        Category.category_type
    ).join(
        Category, Transaction.category_id == Category.id, isouter=True
    ).where(
        Transaction.user_id == current_user.id
    )
    
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    
    result = await db.execute(query)
    transactions = result.all()
    
    # Calculate summary
    income = 0.0
    expenses = 0.0
    transfers = 0.0
    
    for transaction in transactions:
        if transaction.category_type:
            if transaction.category_type.value == "income":
                income += float(transaction.amount)
            elif transaction.category_type.value == "expense":
                expenses += float(transaction.amount)
            elif transaction.category_type.value == "transfer":
                transfers += float(transaction.amount)
        else:
            # If no category, count as expense by default
            expenses += float(transaction.amount)
    
    net = income - expenses
    
    return {
        "income": income,
        "expenses": expenses,
        "transfers": transfers,
        "net": net,
        "transaction_count": len(transactions)
    }


@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific transaction by ID.
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new transaction.
    """
    # Verify account belongs to user
    account_result = await db.execute(
        select(Account).where(
            Account.id == transaction_in.account_id,
            Account.user_id == current_user.id
        )
    )
    account = account_result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Verify category belongs to user (if provided)
    if transaction_in.category_id:
        category_result = await db.execute(
            select(Category).where(
                Category.id == transaction_in.category_id,
                Category.user_id == current_user.id
            )
        )
        category = category_result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Create transaction
    transaction = Transaction(
        **transaction_in.dict(),
        user_id=current_user.id
    )
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    return transaction


@router.put("/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: str,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a transaction.
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update fields
    update_data = transaction_in.dict(exclude_unset=True)
    
    # Verify category if being updated
    if "category_id" in update_data and update_data["category_id"]:
        category_result = await db.execute(
            select(Category).where(
                Category.id == update_data["category_id"],
                Category.user_id == current_user.id
            )
        )
        category = category_result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    await db.commit()
    await db.refresh(transaction)
    
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a transaction.
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    await db.delete(transaction)
    await db.commit()
    
    return None
