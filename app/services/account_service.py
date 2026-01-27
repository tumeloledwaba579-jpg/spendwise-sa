import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload
from app.models.account import Account, AccountType
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate
from app.core.database import get_db

class AccountService:
    @staticmethod
    async def create_account(
        session: AsyncSession, 
        user_id: uuid.UUID, 
        account_in: AccountCreate
    ) -> Account:
        """Create a new account for a user."""
        db_account = Account(
            user_id=user_id,
            name=account_in.name,
            account_type=account_in.account_type,
            currency=account_in.currency,
            is_active=account_in.is_active,
            balance=0.00  # New accounts start with zero balance
        )
        session.add(db_account)
        await session.commit()
        await session.refresh(db_account)
        return db_account

    @staticmethod
    async def get_accounts(
        session: AsyncSession, 
        user_id: uuid.UUID,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Account]:
        """Get all accounts for a user."""
        result = await session.execute(
            select(Account)
            .where(Account.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_account(
        session: AsyncSession, 
        user_id: uuid.UUID, 
        account_id: uuid.UUID
    ) -> Optional[Account]:
        """Get a specific account by ID, ensuring ownership."""
        result = await session.execute(
            select(Account)
            .where(and_(Account.id == account_id, Account.user_id == user_id))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_account(
        session: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        account_in: AccountUpdate
    ) -> Optional[Account]:
        """Update an account, ensuring ownership."""
        # First, verify ownership and get the account
        account = await AccountService.get_account(session, user_id, account_id)
        if not account:
            return None

        # Prepare update data (exclude unset values)
        update_data = account_in.dict(exclude_unset=True)
        if not update_data:
            return account

        # Perform update
        stmt = (
            update(Account)
            .where(and_(Account.id == account_id, Account.user_id == user_id))
            .values(**update_data)
            .returning(Account)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one()

    @staticmethod
    async def delete_account(
        session: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID
    ) -> bool:
        """Delete an account, ensuring ownership."""
        # Verify ownership
        account = await AccountService.get_account(session, user_id, account_id)
        if not account:
            return False

        # Delete the account
        stmt = delete(Account).where(and_(Account.id == account_id, Account.user_id == user_id))
        await session.execute(stmt)
        await session.commit()
        return True

    @staticmethod
    async def update_account_balance(
        session: AsyncSession,
        account_id: uuid.UUID,
        amount: float
    ) -> Optional[Account]:
        """Update account balance (internal use, no ownership check)."""
        stmt = (
            update(Account)
            .where(Account.id == account_id)
            .values(balance=Account.balance + amount)
            .returning(Account)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one_or_none()

