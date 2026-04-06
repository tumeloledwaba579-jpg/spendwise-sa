"""
Optimized transaction service with batched operations and connection pooling.
"""
from uuid import UUID
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func, desc
import logging

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate

logger = logging.getLogger(__name__)

class TransactionService:
    """Service for transaction operations with optimized queries."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_transactions(
        self,
        user_id: UUID,
        account_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
        transaction_type: Optional[str] = None,
        is_recurring: Optional[bool] = None
    ) -> List[Transaction]:
        """
        Get paginated list of transactions with optional filters.
        Uses optimized queries with proper indexes.
        """
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        # Apply filters
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        if transaction_type:
            query = query.where(Transaction.transaction_type == transaction_type)
        if is_recurring is not None:
            query = query.where(Transaction.is_recurring == is_recurring)
        
        # Order by date descending (most recent first)
        query = query.order_by(desc(Transaction.transaction_date))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_transaction_by_id(
        self,
        transaction_id: UUID,
        user_id: UUID
    ) -> Optional[Transaction]:
        """Get a specific transaction by ID with user validation."""
        query = select(Transaction).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def create_transaction(
        self,
        user_id: UUID,
        transaction_in: TransactionCreate
    ) -> Transaction:
        """Create a new transaction with account balance update."""
        # Verify account belongs to user
        account = await self.db.get(Account, transaction_in.account_id)
        if not account or account.user_id != user_id:
            raise ValueError("Account not found or does not belong to user")
        
        # Verify category belongs to user (if provided)
        if transaction_in.category_id:
            category = await self.db.get(Category, transaction_in.category_id)
            if not category or category.user_id != user_id:
                raise ValueError("Category not found or does not belong to user")
        
        # ✅ Convert amount to Decimal to avoid type errors
        amount_decimal = Decimal(str(abs(transaction_in.amount)))
        is_income = transaction_in.amount > 0
        
        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            account_id=transaction_in.account_id,
            category_id=transaction_in.category_id,
            amount=amount_decimal,  # ✅ Store as Decimal
            description=transaction_in.description,
            transaction_date=transaction_in.transaction_date or datetime.now(),
            transaction_type="income" if is_income else "expense",
            notes=transaction_in.notes,
            is_recurring=transaction_in.is_recurring or False,
        )
        
        self.db.add(transaction)
        
        # ✅ Update account balance using Decimal
        if is_income:
            account.balance += amount_decimal
        else:
            account.balance -= amount_decimal
        
        await self.db.commit()
        await self.db.refresh(transaction)
        
        logger.info(f"✅ Created transaction {transaction.id} for user {user_id}")
        return transaction
    
    async def update_transaction(
        self,
        transaction_id: UUID,
        user_id: UUID,
        transaction_in: TransactionUpdate
    ) -> Optional[Transaction]:
        """Update an existing transaction."""
        transaction = await self.get_transaction_by_id(transaction_id, user_id)
        if not transaction:
            return None
        
        # Get old amount and type for balance adjustment
        old_amount = transaction.amount
        old_type = transaction.transaction_type
        
        # Update fields if provided
        update_data = transaction_in.model_dump(exclude_unset=True)
        
        # ✅ Handle amount specially - convert to Decimal
        if 'amount' in update_data:
            amount_float = update_data['amount']
            amount_decimal = Decimal(str(abs(amount_float)))
            update_data['amount'] = amount_decimal
            is_income = amount_float > 0
            update_data['transaction_type'] = "income" if is_income else "expense"
        
        # Apply updates
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        # ✅ Update account balance if amount or type changed
        if 'amount' in update_data or 'transaction_type' in update_data:
            account = await self.db.get(Account, transaction.account_id)
            if account:
                # Revert old transaction effect
                if old_type == "income":
                    account.balance -= old_amount
                else:
                    account.balance += old_amount
                
                # Apply new transaction effect
                if transaction.transaction_type == "income":
                    account.balance += transaction.amount
                else:
                    account.balance -= transaction.amount
        
        await self.db.commit()
        await self.db.refresh(transaction)
        
        logger.info(f"✅ Updated transaction {transaction_id}")
        return transaction
    
    async def delete_transaction(
        self,
        transaction_id: UUID,
        user_id: UUID
    ) -> bool:
        """Delete a transaction and revert account balance."""
        transaction = await self.get_transaction_by_id(transaction_id, user_id)
        if not transaction:
            return False
        
        # Revert account balance based on stored type
        account = await self.db.get(Account, transaction.account_id)
        if account:
            if transaction.transaction_type == "income":
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount
        
        await self.db.delete(transaction)
        await self.db.commit()
        
        logger.info(f"✅ Deleted transaction {transaction_id}")
        return True
    
    async def get_transaction_summary(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get summary statistics for transactions."""
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        result = await self.db.execute(query)
        transactions = result.scalars().all()
        
        # Calculate using stored transaction_type
        total_income = sum(float(t.amount) for t in transactions if t.transaction_type == "income")
        total_expenses = sum(float(t.amount) for t in transactions if t.transaction_type == "expense")
        
        return {
            "total_transactions": len(transactions),
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_income": float(total_income - total_expenses),
            "average_transaction": float((total_income + total_expenses) / len(transactions)) if transactions else 0,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None
        }