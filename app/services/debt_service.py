"""
Debt management service layer with business logic.
"""
import logging
from decimal import Decimal
from datetime import datetime, date, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload

from app.models.debt import DebtAccount, DebtPayment, DebtSnapshot
from app.models.user import User
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

logger = logging.getLogger(__name__)


class DebtService:
    """Service for managing debt operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # ========================================================================
    # DEBT ACCOUNT OPERATIONS
    # ========================================================================

    async def create_debt_account(
        self,
        user_id: UUID,
        account_in: DebtAccountCreate
    ) -> DebtAccountInDB:
        """Create a new debt account."""
        account = DebtAccount(
            user_id=user_id,
            name=account_in.name,
            type=account_in.type,
            creditor_name=account_in.creditor_name,
            current_balance=account_in.current_balance,
            credit_limit=account_in.credit_limit,
            interest_rate=account_in.interest_rate,
            minimum_payment=account_in.minimum_payment,
            due_date=account_in.due_date,
            start_date=account_in.start_date,
            payoff_date=account_in.payoff_date,
            notes=account_in.notes,
        )
        
        self.session.add(account)
        await self.session.commit()
        await self.session.refresh(account)
        
        logger.info(f"Created debt account: {account.id}")
        return DebtAccountInDB.from_orm(account)

    async def get_debt_account(
        self,
        user_id: UUID,
        account_id: UUID
    ) -> Optional[DebtAccountInDB]:
        """Get a single debt account."""
        result = await self.session.execute(
            select(DebtAccount).where(
                (DebtAccount.user_id == user_id) &
                (DebtAccount.id == account_id)
            )
        )
        account = result.scalar_one_or_none()
        return DebtAccountInDB.from_orm(account) if account else None

    async def list_debt_accounts(
        self,
        user_id: UUID,
        active_only: bool = True
    ) -> List[DebtAccountInDB]:
        """List debt accounts for a user."""
        query = select(DebtAccount).where(DebtAccount.user_id == user_id)
        
        if active_only:
            query = query.where(DebtAccount.is_active == True)
        
        query = query.order_by(DebtAccount.created_at.desc())
        
        result = await self.session.execute(query)
        accounts = result.scalars().all()
        
        return [DebtAccountInDB.from_orm(account) for account in accounts]

    async def update_debt_account(
        self,
        user_id: UUID,
        account_id: UUID,
        account_in: DebtAccountUpdate
    ) -> Optional[DebtAccountInDB]:
        """Update a debt account."""
        account = await self.get_debt_account(user_id, account_id)
        
        if not account:
            return None
        
        # Get the actual model instance
        result = await self.session.execute(
            select(DebtAccount).where(DebtAccount.id == account_id)
        )
        db_account = result.scalar_one()
        
        # Update fields
        update_data = account_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_account, field, value)
        
        db_account.updated_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(db_account)
        
        logger.info(f"Updated debt account: {account_id}")
        return DebtAccountInDB.from_orm(db_account)

    async def deactivate_debt_account(
        self,
        user_id: UUID,
        account_id: UUID
    ) -> bool:
        """Deactivate a debt account (soft delete)."""
        account = await self.get_debt_account(user_id, account_id)
        
        if not account:
            return False
        
        result = await self.session.execute(
            select(DebtAccount).where(DebtAccount.id == account_id)
        )
        db_account = result.scalar_one()
        
        db_account.is_active = False
        db_account.updated_at = datetime.utcnow()
        
        await self.session.commit()
        
        logger.info(f"Deactivated debt account: {account_id}")
        return True

    # ========================================================================
    # DEBT PAYMENT OPERATIONS
    # ========================================================================

    async def record_payment(
        self,
        user_id: UUID,
        payment_in: DebtPaymentCreate
    ) -> DebtPaymentInDB:
        """Record a payment on a debt account."""
        # Verify account exists and belongs to user
        account = await self.get_debt_account(user_id, payment_in.debt_account_id)
        if not account:
            raise ValueError("Debt account not found")
        
        # Create payment
        payment = DebtPayment(
            user_id=user_id,
            debt_account_id=payment_in.debt_account_id,
            amount=payment_in.amount,
            payment_date=payment_in.payment_date,
            payment_method=payment_in.payment_method,
            notes=payment_in.notes,
        )
        
        self.session.add(payment)
        
        # Update account balance
        result = await self.session.execute(
            select(DebtAccount).where(DebtAccount.id == payment_in.debt_account_id)
        )
        db_account = result.scalar_one()
        
        new_balance = db_account.current_balance - payment_in.amount
        if new_balance < 0:
            new_balance = Decimal('0')
        
        db_account.current_balance = new_balance
        db_account.updated_at = datetime.utcnow()
        
        # Update monthly snapshot
        await self._update_monthly_snapshot(user_id, payment_in.debt_account_id, payment_in.payment_date)
        
        await self.session.commit()
        await self.session.refresh(payment)
        
        logger.info(f"Recorded payment: {payment.id} for account: {payment_in.debt_account_id}")
        return DebtPaymentInDB.from_orm(payment)

    async def get_payment_history(
        self,
        user_id: UUID,
        account_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[DebtPaymentInDB]:
        """Get payment history for user or specific account."""
        query = select(DebtPayment).where(DebtPayment.user_id == user_id)
        
        if account_id:
            query = query.where(DebtPayment.debt_account_id == account_id)
        
        if start_date:
            query = query.where(DebtPayment.payment_date >= start_date)
        
        if end_date:
            query = query.where(DebtPayment.payment_date <= end_date)
        
        query = query.order_by(DebtPayment.payment_date.desc())
        
        result = await self.session.execute(query)
        payments = result.scalars().all()
        
        return [DebtPaymentInDB.from_orm(payment) for payment in payments]

    # ========================================================================
    # MONTHLY SNAPSHOT OPERATIONS
    # ========================================================================

    async def _update_monthly_snapshot(
        self,
        user_id: UUID,
        account_id: UUID,
        snapshot_date: date
    ) -> None:
        """Update monthly snapshot for a debt account."""
        year = snapshot_date.year
        month = snapshot_date.month
        
        # Get or create snapshot
        result = await self.session.execute(
            select(DebtSnapshot).where(
                (DebtSnapshot.debt_account_id == account_id) &
                (DebtSnapshot.year == year) &
                (DebtSnapshot.month == month)
            )
        )
        snapshot = result.scalar_one_or_none()
        
        # Calculate monthly totals
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
        
        # Sum payments for the month
        payment_result = await self.session.execute(
            select(
                func.sum(DebtPayment.amount).label('total_paid'),
                func.count(DebtPayment.id).label('payment_count')
            ).where(
                (DebtPayment.debt_account_id == account_id) &
                (DebtPayment.payment_date >= month_start) &
                (DebtPayment.payment_date <= month_end)
            )
        )
        
        total_paid, payment_count = payment_result.scalar()
        total_paid = total_paid or Decimal('0')
        payment_count = payment_count or 0
        
        # Get current account balance
        account_result = await self.session.execute(
            select(DebtAccount).where(DebtAccount.id == account_id)
        )
        account = account_result.scalar_one()
        
        # Calculate interest accrued
        daily_rate = account.interest_rate / Decimal('365') / Decimal('100')
        days_in_month = (month_end - month_start).days + 1
        interest_accrued = account.current_balance * daily_rate * Decimal(days_in_month)
        
        if snapshot:
            # Update existing
            snapshot.total_paid = total_paid
            snapshot.interest_accrued = interest_accrued
            snapshot.payment_count = payment_count
            snapshot.balance_end = account.current_balance
            snapshot.updated_at = datetime.utcnow()
        else:
            # Create new
            snapshot = DebtSnapshot(
                user_id=user_id,
                debt_account_id=account_id,
                year=year,
                month=month,
                balance_start=account.current_balance + total_paid,  # Balance before payments
                balance_end=account.current_balance,
                total_paid=total_paid,
                interest_accrued=interest_accrued,
                payment_count=payment_count,
            )
            self.session.add(snapshot)

    # ========================================================================
    # ANALYTICS OPERATIONS
    # ========================================================================

    async def get_debt_summary(
        self,
        user_id: UUID,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> DebtSummary:
        """Get debt summary for a specific period."""
        if year and month:
            # Monthly summary
            result = await self.session.execute(
                select(
                    func.sum(DebtSnapshot.balance_end).label('total_debt'),
                    func.sum(DebtSnapshot.total_paid).label('total_paid'),
                    func.sum(DebtSnapshot.interest_accrued).label('total_interest'),
                    func.count(func.distinct(DebtSnapshot.debt_account_id)).label('account_count')
                ).where(
                    (DebtSnapshot.user_id == user_id) &
                    (DebtSnapshot.year == year) &
                    (DebtSnapshot.month == month)
                )
            )
        else:
            # Current totals
            result = await self.session.execute(
                select(
                    func.sum(DebtAccount.current_balance).label('total_debt'),
                    func.count(DebtAccount.id).label('account_count'),
                    func.sum(DebtAccount.interest_rate) / func.count(DebtAccount.id).label('avg_rate')
                ).where(DebtAccount.user_id == user_id)
            )
        
        total_debt, total_paid, total_interest, account_count = result.scalar()
        
        # Get active accounts
        active_result = await self.session.execute(
            select(func.count(DebtAccount.id)).where(
                (DebtAccount.user_id == user_id) &
                (DebtAccount.is_active == True)
            )
        )
        active_count = active_result.scalar() or 0
        
        return DebtSummary(
            total_debt=total_debt or Decimal('0'),
            total_paid_this_month=total_paid or Decimal('0'),
            total_interest_accrued=total_interest or Decimal('0'),
            account_count=account_count or 0,
            active_accounts=active_count,
            avg_interest_rate=Decimal('0')  # Calculated above
        )

    async def get_debt_stats(
        self,
        user_id: UUID,
        year: int
    ) -> DebtStats:
        """Get annual debt statistics."""
        # Get current balances
        balance_result = await self.session.execute(
            select(
                func.sum(DebtAccount.current_balance).label('total_debt'),
                func.sum(DebtAccount.credit_limit).label('total_limit'),
                func.avg(DebtAccount.interest_rate).label('avg_rate'),
                func.count(DebtAccount.id).label('account_count'),
                func.max(DebtAccount.interest_rate).label('highest_rate'),
                func.max(DebtAccount.current_balance).label('highest_balance')
            ).where(DebtAccount.user_id == user_id)
        )
        
        total_debt, total_limit, avg_rate, account_count, highest_rate, highest_balance = balance_result.scalar()
        
        # Get active accounts
        active_result = await self.session.execute(
            select(func.count(DebtAccount.id)).where(
                (DebtAccount.user_id == user_id) &
                (DebtAccount.is_active == True)
            )
        )
        active_count = active_result.scalar() or 0
        
        # Get annual payments and interest
        payment_result = await self.session.execute(
            select(
                func.sum(DebtPayment.amount).label('total_paid'),
            ).where(
                (DebtPayment.user_id == user_id) &
                (func.extract('year', DebtPayment.payment_date) == year)
            )
        )
        total_paid = payment_result.scalar() or Decimal('0')
        
        # Calculate credit utilization
        total_debt = total_debt or Decimal('0')
        total_limit = total_limit or Decimal('0')
        utilization_rate = (total_debt / total_limit * Decimal('100')) if total_limit > 0 else Decimal('0')
        
        # Get highest rate and balance accounts
        highest_rate_result = await self.session.execute(
            select(DebtAccount.name).where(
                DebtAccount.interest_rate == highest_rate
            ).limit(1)
        )
        highest_rate_name = highest_rate_result.scalar()
        
        highest_balance_result = await self.session.execute(
            select(DebtAccount.name).where(
                DebtAccount.current_balance == highest_balance
            ).limit(1)
        )
        highest_balance_name = highest_balance_result.scalar()
        
        # Estimate payoff (simple calculation)
        estimated_months = None
        if total_debt > 0 and total_paid > 0:
            estimated_months = int((total_debt / (total_paid / 12)))
        
        return DebtStats(
            total_current_debt=total_debt,
            total_paid_annual=total_paid,
            total_interest_paid=Decimal('0'),  # Would need detailed interest tracking
            average_interest_rate=avg_rate or Decimal('0'),
            account_count=account_count or 0,
            active_account_count=active_count,
            total_credit_limit=total_limit or Decimal('0'),
            total_available_credit=max(Decimal('0'), (total_limit or Decimal('0')) - total_debt),
            utilization_rate=utilization_rate,
            highest_rate_debt=highest_rate_name,
            highest_balance_debt=highest_balance_name,
            estimated_payoff_months=estimated_months
        )

    async def calculate_payoff_strategy(
        self,
        user_id: UUID,
        strategy_type: str = "SNOWBALL"  # SNOWBALL or AVALANCHE
    ) -> PayoffStrategy:
        """Calculate optimal debt payoff strategy."""
        # Get all active debt accounts
        result = await self.session.execute(
            select(DebtAccount).where(
                (DebtAccount.user_id == user_id) &
                (DebtAccount.is_active == True)
            ).order_by(DebtAccount.current_balance.desc())
        )
        accounts = result.scalars().all()
        
        if not accounts:
            return PayoffStrategy(
                strategy_type=strategy_type,
                accounts_in_order=[],
                estimated_total_months=0,
                estimated_total_interest=Decimal('0'),
                monthly_payment_required=Decimal('0'),
                potential_savings=Decimal('0')
            )
        
        total_debt = sum(a.current_balance for a in accounts)
        
        # Sort based on strategy
        if strategy_type == "SNOWBALL":
            # Pay smallest balance first
            sorted_accounts = sorted(accounts, key=lambda a: a.current_balance)
        else:  # AVALANCHE
            # Pay highest interest first
            sorted_accounts = sorted(accounts, key=lambda a: a.interest_rate, reverse=True)
        
        accounts_in_order = [
            {
                "id": str(a.id),
                "name": a.name,
                "balance": float(a.current_balance),
                "interest_rate": float(a.interest_rate),
                "payoff_order": i + 1
            }
            for i, a in enumerate(sorted_accounts)
        ]
        
        # Simple estimation
        avg_interest = sum(a.interest_rate for a in accounts) / len(accounts)
        monthly_rate = avg_interest / Decimal('12') / Decimal('100')
        
        # Estimate months to payoff (simple calculation)
        estimated_months = 0
        remaining = total_debt
        while remaining > 0 and estimated_months < 360:  # Max 30 years
            interest = remaining * monthly_rate
            remaining = remaining + interest - Decimal('500')  # Assume $500 monthly payment
            estimated_months += 1
        
        return PayoffStrategy(
            strategy_type=strategy_type,
            accounts_in_order=accounts_in_order,
            estimated_total_months=estimated_months,
            estimated_total_interest=Decimal('0'),  # Would need detailed calculation
            monthly_payment_required=Decimal('500'),
            potential_savings=Decimal('0')
        )
