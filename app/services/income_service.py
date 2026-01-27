"""
Income tracking service layer.
Contains business logic for income sources, history, and analytics.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary, IncomeType, IncomeFrequency
from app.models.user import User
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceInDB, IncomeSourceUpdate,
    IncomeHistoryCreate, IncomeHistoryInDB,
    IncomeMonthlySummaryOut, IncomeSummary, IncomeStats
)


class IncomeService:
    """Service for income tracking operations."""

    # =========================================================================
    # INCOME SOURCE OPERATIONS
    # =========================================================================

    @staticmethod
    async def create_income_source(
        session: AsyncSession,
        user_id: UUID,
        income_in: IncomeSourceCreate
    ) -> IncomeSourceInDB:
        """
        Create a new income source.
        
        Args:
            session: Database session
            user_id: User ID
            income_in: Income source data
            
        Returns:
            Created income source
        """
        db_source = IncomeSource(
            id=__import__('uuid').uuid4(),
            user_id=user_id,
            name=income_in.name,
            type=income_in.type,
            frequency=income_in.frequency,
            amount=income_in.amount,
            currency=income_in.currency,
            start_date=income_in.start_date,
            end_date=income_in.end_date,
            is_recurring=income_in.is_recurring,
            is_taxable=income_in.is_taxable,
            tax_category=income_in.tax_category,
            auto_tax_calculation=income_in.auto_tax_calculation,
            tax_rate=income_in.tax_rate,
            notes=income_in.notes,
            is_active=True
        )
        session.add(db_source)
        await session.commit()
        await session.refresh(db_source)
        return IncomeSourceInDB.from_orm(db_source)

    @staticmethod
    async def get_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID
    ) -> Optional[IncomeSourceInDB]:
        """Get a single income source."""
        result = await session.execute(
            select(IncomeSource).where(
                and_(
                    IncomeSource.id == source_id,
                    IncomeSource.user_id == user_id
                )
            )
        )
        db_source = result.scalars().first()
        return IncomeSourceInDB.from_orm(db_source) if db_source else None

    @staticmethod
    async def list_income_sources(
        session: AsyncSession,
        user_id: UUID,
        active_only: bool = True
    ) -> List[IncomeSourceInDB]:
        """List all income sources for a user."""
        query = select(IncomeSource).where(IncomeSource.user_id == user_id)
        
        if active_only:
            query = query.where(IncomeSource.is_active == True)
        
        query = query.order_by(IncomeSource.created_at.desc())
        result = await session.execute(query)
        sources = result.scalars().all()
        return [IncomeSourceInDB.from_orm(s) for s in sources]

    @staticmethod
    async def update_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID,
        income_update: IncomeSourceUpdate
    ) -> Optional[IncomeSourceInDB]:
        """Update an income source."""
        result = await session.execute(
            select(IncomeSource).where(
                and_(
                    IncomeSource.id == source_id,
                    IncomeSource.user_id == user_id
                )
            )
        )
        db_source = result.scalars().first()
        
        if not db_source:
            return None
        
        # Update only provided fields
        update_data = income_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_source, field, value)
        
        db_source.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(db_source)
        return IncomeSourceInDB.from_orm(db_source)

    @staticmethod
    async def deactivate_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID
    ) -> Optional[IncomeSourceInDB]:
        """Deactivate (soft delete) an income source."""
        result = await session.execute(
            select(IncomeSource).where(
                and_(
                    IncomeSource.id == source_id,
                    IncomeSource.user_id == user_id
                )
            )
        )
        db_source = result.scalars().first()
        
        if not db_source:
            return None
        
        db_source.is_active = False
        db_source.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(db_source)
        return IncomeSourceInDB.from_orm(db_source)

    # =========================================================================
    # INCOME HISTORY OPERATIONS
    # =========================================================================

    @staticmethod
    async def record_income(
        session: AsyncSession,
        user_id: UUID,
        income_in: IncomeHistoryCreate
    ) -> IncomeHistoryInDB:
        """
        Record actual income (manual entry or auto-generated).
        
        Args:
            session: Database session
            user_id: User ID
            income_in: Income history data
            
        Returns:
            Created income history record
        """
        # Calculate net amount if tax is provided
        net_amount = income_in.amount
        if income_in.tax_amount:
            net_amount = income_in.amount - income_in.tax_amount
        
        db_history = IncomeHistory(
            id=__import__('uuid').uuid4(),
            user_id=user_id,
            income_source_id=income_in.income_source_id,
            amount=income_in.amount,
            currency=income_in.currency,
            received_date=income_in.received_date,
            tax_amount=income_in.tax_amount,
            net_amount=net_amount,
            notes=income_in.notes,
            is_manual_entry=income_in.is_manual_entry
        )
        session.add(db_history)
        await session.commit()
        await session.refresh(db_history)
        
        # Update monthly summary
        await IncomeService._update_monthly_summary(session, user_id, income_in.received_date)
        
        return IncomeHistoryInDB.from_orm(db_history)

    @staticmethod
    async def get_income_history(
        session: AsyncSession,
        user_id: UUID,
        source_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[IncomeHistoryInDB]:
        """Get income history with optional filters."""
        query = select(IncomeHistory).where(IncomeHistory.user_id == user_id)
        
        if source_id:
            query = query.where(IncomeHistory.income_source_id == source_id)
        
        if start_date:
            query = query.where(IncomeHistory.received_date >= start_date)
        
        if end_date:
            query = query.where(IncomeHistory.received_date <= end_date)
        
        query = query.order_by(IncomeHistory.received_date.desc())
        result = await session.execute(query)
        records = result.scalars().all()
        return [IncomeHistoryInDB.from_orm(r) for r in records]

    # =========================================================================
    # MONTHLY SUMMARY OPERATIONS
    # =========================================================================

    @staticmethod
    async def _update_monthly_summary(
        session: AsyncSession,
        user_id: UUID,
        income_date: date
    ) -> None:
        """
        Update monthly summary for a given date.
        Called after income record is added/modified.
        """
        year = income_date.year
        month = income_date.month
        
        # Get all income history for this month
        result = await session.execute(
            select(IncomeHistory).where(
                and_(
                    IncomeHistory.user_id == user_id,
                    func.extract('year', IncomeHistory.received_date) == year,
                    func.extract('month', IncomeHistory.received_date) == month
                )
            )
        )
        records = result.scalars().all()
        
        # Calculate totals
        total_income = sum(r.amount for r in records) if records else Decimal('0')
        total_tax = sum(r.tax_amount or Decimal('0') for r in records) if records else Decimal('0')
        net_income = total_income - total_tax
        
        # Count recurring vs one-time
        source_ids = {r.income_source_id for r in records}
        sources_result = await session.execute(
            select(IncomeSource).where(
                and_(
                    IncomeSource.id.in_(source_ids),
                    IncomeSource.user_id == user_id
                )
            )
        )
        sources = sources_result.scalars().all()
        
        recurring_income = sum(
            r.amount for r in records
            if any(s.id == r.income_source_id and s.is_recurring for s in sources)
        )
        one_time_income = total_income - recurring_income
        
        # Find or create summary
        summary_result = await session.execute(
            select(IncomeMonthlySummary).where(
                and_(
                    IncomeMonthlySummary.user_id == user_id,
                    IncomeMonthlySummary.year == year,
                    IncomeMonthlySummary.month == month
                )
            )
        )
        summary = summary_result.scalars().first()
        
        if summary:
            # Update existing
            summary.total_income = total_income
            summary.total_tax = total_tax
            summary.net_income = net_income
            summary.recurring_income = recurring_income
            summary.one_time_income = one_time_income
            summary.source_count = len(source_ids)
            summary.record_count = len(records)
            summary.updated_at = datetime.utcnow()
        else:
            # Create new
            summary = IncomeMonthlySummary(
                id=__import__('uuid').uuid4(),
                user_id=user_id,
                year=year,
                month=month,
                total_income=total_income,
                total_tax=total_tax,
                net_income=net_income,
                recurring_income=recurring_income,
                one_time_income=one_time_income,
                source_count=len(source_ids),
                record_count=len(records)
            )
            session.add(summary)
        
        await session.commit()

    @staticmethod
    async def get_monthly_summary(
        session: AsyncSession,
        user_id: UUID,
        year: int,
        month: int
    ) -> Optional[IncomeMonthlySummaryOut]:
        """Get monthly income summary."""
        result = await session.execute(
            select(IncomeMonthlySummary).where(
                and_(
                    IncomeMonthlySummary.user_id == user_id,
                    IncomeMonthlySummary.year == year,
                    IncomeMonthlySummary.month == month
                )
            )
        )
        summary = result.scalars().first()
        return IncomeMonthlySummaryOut.from_orm(summary) if summary else None

    # =========================================================================
    # ANALYTICS & PREDICTIONS
    # =========================================================================

    @staticmethod
    async def predict_next_month_income(
        session: AsyncSession,
        user_id: UUID
    ) -> Decimal:
        """
        Predict income for next month based on recurring sources.
        """
        # Get all active recurring sources
        result = await session.execute(
            select(IncomeSource).where(
                and_(
                    IncomeSource.user_id == user_id,
                    IncomeSource.is_recurring == True,
                    IncomeSource.is_active == True,
                    IncomeSource.start_date <= date.today()
                )
            )
        )
        sources = result.scalars().all()
        
        # Sum recurring amounts
        predicted = sum(s.amount for s in sources) if sources else Decimal('0')
        
        # Add average of one-time income from last 3 months
        three_months_ago = date.today() - timedelta(days=90)
        history_result = await session.execute(
            select(IncomeHistory).where(
                and_(
                    IncomeHistory.user_id == user_id,
                    IncomeHistory.received_date >= three_months_ago,
                    IncomeHistory.is_manual_entry == False  # Only auto-generated
                )
            )
        )
        history = history_result.scalars().all()
        
        if history:
            avg_one_time = sum(h.amount for h in history) / len(history) / 3
            predicted += avg_one_time
        
        return predicted

    @staticmethod
    async def get_income_stats(
        session: AsyncSession,
        user_id: UUID,
        year: Optional[int] = None
    ) -> IncomeStats:
        """Get income statistics for a user."""
        if not year:
            year = date.today().year
        
        # Get all income for the year
        jan_1 = date(year, 1, 1)
        dec_31 = date(year, 12, 31)
        
        history_result = await session.execute(
            select(IncomeHistory).where(
                and_(
                    IncomeHistory.user_id == user_id,
                    IncomeHistory.received_date >= jan_1,
                    IncomeHistory.received_date <= dec_31
                )
            )
        )
        history = history_result.scalars().all()
        
        total_annual = sum(h.amount for h in history) if history else Decimal('0')
        total_tax = sum(h.tax_amount or Decimal('0') for h in history) if history else Decimal('0')
        net_annual = total_annual - total_tax
        avg_monthly = total_annual / 12 if total_annual > 0 else Decimal('0')
        
        # Get sources breakdown
        source_ids = {h.income_source_id for h in history}
        if source_ids:
            sources_result = await session.execute(
                select(IncomeSource).where(IncomeSource.id.in_(source_ids))
            )
            sources = sources_result.scalars().all()
            
            recurring_count = sum(1 for s in sources if s.is_recurring)
            one_time_count = len(sources) - recurring_count
            
            # Find top source
            top_source = max(
                [(s, sum(h.amount for h in history if h.income_source_id == s.id)) for s in sources],
                key=lambda x: x[1],
                default=(None, Decimal('0'))
            )
        else:
            recurring_count = 0
            one_time_count = 0
            top_source = (None, Decimal('0'))
        
        # Predict next month
        next_month = await IncomeService.predict_next_month_income(session, user_id)
        
        return IncomeStats(
            total_annual_income=total_annual,
            average_monthly_income=avg_monthly,
            predicted_next_month=next_month,
            total_tax_paid=total_tax,
            net_annual_income=net_annual,
            recurring_income_count=recurring_count,
            one_time_income_count=one_time_count,
            top_source_name=top_source[0].name if top_source[0] else None,
            top_source_amount=top_source[1]
        )



