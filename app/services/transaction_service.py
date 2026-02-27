"""
Optimized transaction service with batched operations and connection pooling.
"""
from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func
import logging

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate

logger = logging.getLogger(__name__)

class TransactionService:
    """Optimized service for transaction operations."""
    
    @staticmethod
    async def create_transaction(
        session: AsyncSession,
        user_id: UUID,
        transaction_in: TransactionCreate
    ) -> Transaction:
        """
        Create a new transaction with optimized database operations.
        
        Performance optimizations:
        - Single transaction for all operations
        - Batched account balance update
        - Prepared statements via SQLAlchemy
        - Connection pooling
        """
        try:
            # Start transaction (implicitly handled by session)
            
            # 1. Verify account belongs to user (uses index)
            account_result = await session.execute(
                select(Account).where(
                    Account.id == transaction_in.account_id,
                    Account.user_id == user_id
                )
            )
            account = account_result.scalar_one_or_none()
            
            if not account:
                raise ValueError("Account not found")
            
            # 2. Verify category if provided (uses index)
            if transaction_in.category_id:
                category_result = await session.execute(
                    select(Category).where(
                        Category.id == transaction_in.category_id,
                        Category.user_id == user_id
                    )
                )
                category = category_result.scalar_one_or_none()
                
                if not category:
                    raise ValueError("Category not found")
            
            # 3. Create transaction (uses composite index for future lookups)
            transaction = Transaction(
                **transaction_in.dict(),
                user_id=user_id
            )
            session.add(transaction)
            
            # 4. Update account balance in same transaction
            balance_update = (
                update(Account)
                .where(Account.id == account.id)
                .values(
                    balance=Account.balance + transaction_in.amount,
                    updated_at=func.now()
                )
            )
            await session.execute(balance_update)
            
            # 5. Commit once for all operations
            await session.commit()
            await session.refresh(transaction)
            
            logger.info(f"✅ Transaction created: {transaction.id} in {account.currency}")
            return transaction
            
        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Transaction failed: {str(e)}")
            raise
    
    @staticmethod
    async def get_transactions(
        session: AsyncSession,
        user_id: UUID,
        account_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Transaction]:
        """
        Get transactions with optimized filtering using composite indexes.
        """
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        # Use composite index when filtering by account
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        
        # Use category_date index
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        
        # Date range filtering
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        # Order by date for latest first (uses composite index)
        query = query.order_by(Transaction.transaction_date.desc())
        
        # Pagination
        query = query.limit(limit).offset(offset)
        
        result = await session.execute(query)
        return result.scalars().all()