import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, func
from app.models.payment_method import PaymentMethod, PaymentMethodType
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate

class PaymentMethodService:
    @staticmethod
    async def create_payment_method(
        session: AsyncSession,
        user_id: uuid.UUID,
        payment_method_in: PaymentMethodCreate
    ) -> PaymentMethod:
        """Create a new payment method for a user."""
        # If setting as default, unset any existing default for this user
        if payment_method_in.is_default:
            await PaymentMethodService._unset_default_payment_method(session, user_id)

        db_payment_method = PaymentMethod(
            user_id=user_id,
            name=payment_method_in.name,
            payment_type=payment_method_in.payment_type,
            last_four=payment_method_in.last_four,
            is_active=payment_method_in.is_active,
            is_default=payment_method_in.is_default
        )
        session.add(db_payment_method)
        await session.commit()
        await session.refresh(db_payment_method)
        return db_payment_method

    @staticmethod
    async def get_payment_methods(
        session: AsyncSession,
        user_id: uuid.UUID,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[PaymentMethod]:
        """Get all payment methods for a user."""
        query = select(PaymentMethod).where(PaymentMethod.user_id == user_id)
        
        if active_only:
            query = query.where(PaymentMethod.is_active == True)
        
        query = query.offset(skip).limit(limit).order_by(PaymentMethod.is_default.desc(), PaymentMethod.name)
        
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_payment_method(
        session: AsyncSession,
        user_id: uuid.UUID,
        payment_method_id: uuid.UUID
    ) -> Optional[PaymentMethod]:
        """Get a specific payment method by ID, ensuring ownership."""
        result = await session.execute(
            select(PaymentMethod)
            .where(and_(PaymentMethod.id == payment_method_id, PaymentMethod.user_id == user_id))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_payment_method(
        session: AsyncSession,
        user_id: uuid.UUID,
        payment_method_id: uuid.UUID,
        payment_method_in: PaymentMethodUpdate
    ) -> Optional[PaymentMethod]:
        """Update a payment method, ensuring ownership."""
        # First, verify ownership
        payment_method = await PaymentMethodService.get_payment_method(session, user_id, payment_method_id)
        if not payment_method:
            return None

        # If setting as default, unset any existing default for this user
        if payment_method_in.is_default is True:
            await PaymentMethodService._unset_default_payment_method(session, user_id, exclude_id=payment_method_id)

        # Prepare update data
        update_data = payment_method_in.dict(exclude_unset=True)
        if not update_data:
            return payment_method

        # Perform update
        stmt = (
            update(PaymentMethod)
            .where(and_(PaymentMethod.id == payment_method_id, PaymentMethod.user_id == user_id))
            .values(**update_data)
            .returning(PaymentMethod)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one()

    @staticmethod
    async def delete_payment_method(
        session: AsyncSession,
        user_id: uuid.UUID,
        payment_method_id: uuid.UUID
    ) -> bool:
        """Delete a payment method, ensuring ownership."""
        # Verify ownership
        payment_method = await PaymentMethodService.get_payment_method(session, user_id, payment_method_id)
        if not payment_method:
            return False

        # TODO: Check for dependent transaction payments
        # For now, we'll allow deletion

        # Delete the payment method
        stmt = delete(PaymentMethod).where(and_(PaymentMethod.id == payment_method_id, PaymentMethod.user_id == user_id))
        await session.execute(stmt)
        await session.commit()
        return True

    @staticmethod
    async def _unset_default_payment_method(
        session: AsyncSession,
        user_id: uuid.UUID,
        exclude_id: Optional[uuid.UUID] = None
    ) -> None:
        """Unset all default payment methods for a user (except optionally excluded one)."""
        stmt = (
            update(PaymentMethod)
            .where(PaymentMethod.user_id == user_id)
            .where(PaymentMethod.is_default == True)
        )
        
        if exclude_id:
            stmt = stmt.where(PaymentMethod.id != exclude_id)
        
        stmt = stmt.values(is_default=False)
        await session.execute(stmt)
