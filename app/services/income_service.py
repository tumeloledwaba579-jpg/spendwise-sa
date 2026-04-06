"""
Income service for SpendWise API.
Handles income sources and history with optimized queries.
"""
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date, datetime
import uuid as uuid_pkg

from app.models.income import IncomeSource, IncomeHistory
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceInDB, IncomeSourceUpdate,
    IncomeHistoryCreate, IncomeHistoryInDB,
    IncomeMonthlySummaryOut, IncomeStats
)

class IncomeService:
    """Service for income operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ========================================================================
    # INCOME SOURCES
    # ========================================================================
    @staticmethod
    async def create_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_in: IncomeSourceCreate
    ) -> IncomeSourceInDB:
        """Create a new income source."""
        print(f"🔍 create_income_source called for user: {user_id}")
        
        # Map schema field 'name' to db field 'name'
        source = IncomeSource(
            user_id=user_id,
            name=source_in.name,  # ✅ Map name → name
            amount=source_in.amount,
            frequency=source_in.frequency,
            start_date=source_in.start_date,
            type=source_in.type,
            end_date=source_in.end_date,
            is_active=True,
            notes=source_in.notes,
            tax_rate=source_in.tax_rate
        )
        session.add(source)
        await session.commit()
        await session.refresh(source)
        print(f"✅ Created income source: {source.name}")
        return IncomeSourceInDB.model_validate(source)
    
    @staticmethod
    async def list_income_sources(
        session: AsyncSession,
        user_id: UUID,
        active_only: bool = True
    ) -> List[IncomeSourceInDB]:
        """List all income sources for a user."""
        print(f"🔍 list_income_sources called for user: {user_id}")
        
        query = select(IncomeSource).where(IncomeSource.user_id == user_id)
        if active_only:
            query = query.where(IncomeSource.is_active == True)
        query = query.order_by(IncomeSource.created_at.desc())
        
        result = await session.execute(query)
        sources = result.scalars().all()
        print(f"✅ Found {len(sources)} income sources")
        return [IncomeSourceInDB.model_validate(s) for s in sources]
    
    @staticmethod
    async def get_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID
    ) -> Optional[IncomeSourceInDB]:
        """Get a specific income source."""
        result = await session.execute(
            select(IncomeSource).where(
                IncomeSource.id == source_id,
                IncomeSource.user_id == user_id
            )
        )
        source = result.scalar_one_or_none()
        return IncomeSourceInDB.model_validate(source) if source else None
    
    @staticmethod
    async def update_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID,
        source_in: IncomeSourceUpdate
    ) -> Optional[IncomeSourceInDB]:
        """Update an income source."""
        print(f"🔍 update_income_source called for user: {user_id}, source: {source_id}")
        
        result = await session.execute(
            select(IncomeSource).where(
                IncomeSource.id == source_id,
                IncomeSource.user_id == user_id
            )
        )
        source = result.scalar_one_or_none()
        if not source:
            print(f"❌ Source {source_id} not found")
            return None
        
        # Get update data
        update_data = source_in.model_dump(exclude_unset=True)
        print(f"📝 Update data: {update_data}")
        
        # Handle field name mappings
        field_mapping = {
            'name': 'name',  # Map schema 'name' to db 'name'
        }
        
        for field, value in update_data.items():
            # Check if this field needs mapping
            db_field = field_mapping.get(field, field)
            
            # Set the attribute on the source object
            if hasattr(source, db_field):
                setattr(source, db_field, value)
                print(f"✅ Set {db_field} = {value}")
            else:
                print(f"⚠️ Warning: Field {db_field} not found on IncomeSource model")
        
        await session.commit()
        await session.refresh(source)
        print(f"✅ Updated source: {source.name}")
        return IncomeSourceInDB.model_validate(source)
    
    @staticmethod
    async def deactivate_income_source(
        session: AsyncSession,
        user_id: UUID,
        source_id: UUID
    ) -> Optional[IncomeSourceInDB]:
        """Deactivate (soft delete) an income source."""
        result = await session.execute(
            select(IncomeSource).where(
                IncomeSource.id == source_id,
                IncomeSource.user_id == user_id
            )
        )
        source = result.scalar_one_or_none()
        if not source:
            return None
        
        source.is_active = False
        await session.commit()
        await session.refresh(source)
        return IncomeSourceInDB.model_validate(source)
    
    # ========================================================================
    # INCOME HISTORY
    # ========================================================================
    @staticmethod
    async def record_income(
        session: AsyncSession,
        user_id: UUID,
        income_in: IncomeHistoryCreate
    ) -> IncomeHistoryInDB:
        """Record actual income received."""
        # Verify source belongs to user
        source_result = await session.execute(
            select(IncomeSource).where(
                IncomeSource.id == income_in.income_source_id,
                IncomeSource.user_id == user_id
            )
        )
        source = source_result.scalar_one_or_none()
        if not source:
            raise ValueError("Income source not found or does not belong to user")
        
        history = IncomeHistory(
            user_id=user_id,
            income_source_id=income_in.income_source_id,
            amount=income_in.amount,
            received_date=income_in.received_date,
            tax_amount=income_in.tax_amount,
            notes=income_in.notes,
            is_manual_entry=income_in.is_manual_entry
        )
        session.add(history)
        await session.commit()
        await session.refresh(history)
        return IncomeHistoryInDB.model_validate(history)
    
    @staticmethod
    async def get_income_history(
        session: AsyncSession,
        user_id: UUID,
        source_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100
    ) -> List[IncomeHistoryInDB]:
        """Get income history with filters."""
        query = select(IncomeHistory).where(IncomeHistory.user_id == user_id)
        
        if source_id:
            query = query.where(IncomeHistory.income_source_id == source_id)
        if start_date:
            query = query.where(IncomeHistory.received_date >= start_date)
        if end_date:
            query = query.where(IncomeHistory.received_date <= end_date)
        
        query = query.order_by(IncomeHistory.received_date.desc()).limit(limit)
        
        result = await session.execute(query)
        histories = result.scalars().all()
        return [IncomeHistoryInDB.model_validate(h) for h in histories]
    
    # ========================================================================
    # INCOME ANALYTICS
    # ========================================================================
    @staticmethod
    async def get_monthly_summary(
        session: AsyncSession,
        user_id: UUID,
        year: int,
        month: int
    ) -> IncomeMonthlySummaryOut:
        """Get monthly income summary."""
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        # Query for income history in this month
        query = select(IncomeHistory).where(
            IncomeHistory.user_id == user_id,
            IncomeHistory.received_date >= start_date,
            IncomeHistory.received_date < end_date
        )
        
        result = await session.execute(query)
        histories = result.scalars().all()
        
        # Calculate totals
        total_income = sum(float(h.amount) for h in histories)
        total_tax = sum(float(h.tax_amount or 0) for h in histories)
        
        # Get source counts
        source_ids = set(h.income_source_id for h in histories)
        
        # Separate recurring vs one-time
        recurring_income = 0
        one_time_income = 0
        
        for h in histories:
            # Get the source to check if it's recurring
            source_result = await session.execute(
                select(IncomeSource).where(IncomeSource.id == h.income_source_id)
            )
            source = source_result.scalar_one_or_none()
            
            if source and source.is_recurring:
                recurring_income += float(h.amount)
            else:
                one_time_income += float(h.amount)
        
        # Return summary with all required fields
        return IncomeMonthlySummaryOut(
            id=uuid_pkg.uuid4(),
            user_id=user_id,
            year=year,
            month=month,
            total_income=total_income,
            total_tax=total_tax,
            net_income=total_income - total_tax,
            recurring_income=recurring_income,
            one_time_income=one_time_income,
            source_count=len(source_ids),
            record_count=len(histories),
            created_at=datetime.now()
        )
    
    @staticmethod
    async def predict_next_month(
        session: AsyncSession,
        user_id: UUID
    ) -> float:
        """Predict income for next month based on active sources."""
        # Get all active sources
        sources_result = await session.execute(
            select(IncomeSource).where(
                IncomeSource.user_id == user_id,
                IncomeSource.is_active == True
            )
        )
        sources = sources_result.scalars().all()
        
        if not sources:
            return 0.0
        
        predicted = 0.0
        for source in sources:
            amount = float(source.amount)
            if source.frequency == "monthly":
                predicted += amount
            elif source.frequency == "weekly":
                predicted += amount * 4.33
            elif source.frequency == "biweekly":
                predicted += amount * 2.165
            elif source.frequency == "quarterly":
                predicted += amount / 3
            elif source.frequency == "annually":
                predicted += amount / 12
            elif source.frequency == "daily":
                predicted += amount * 30
        
        return predicted
    
    @staticmethod
    async def get_income_stats(
        session: AsyncSession,
        user_id: UUID,
        year: Optional[int] = None
    ) -> IncomeStats:
        """Get income statistics for a user - FIXED to use history for all calculations."""
        if not year:
            year = date.today().year

        try:
            print(f"📊 Calculating income stats for user {user_id}, year {year}")
            
            # Get all active sources for counts
            sources_result = await session.execute(
                select(IncomeSource).where(
                    IncomeSource.user_id == user_id,
                    IncomeSource.is_active == True
                )
            )
            all_sources = sources_result.scalars().all()
            
            # Get all income history for the year
            jan_1 = date(year, 1, 1)
            dec_31 = date(year, 12, 31)
            
            history_query = select(IncomeHistory).where(
                IncomeHistory.user_id == user_id,
                IncomeHistory.received_date >= jan_1,
                IncomeHistory.received_date <= dec_31
            )
            history_result = await session.execute(history_query)
            histories = history_result.scalars().all()
            
            # Calculate statistics from history (NOT from sources)
            total_income = sum(float(h.amount) for h in histories)
            total_tax = sum(float(h.tax_amount or 0) for h in histories)
            
            # Calculate monthly average from history
            if histories:
                # Get unique months with data
                months_with_data = len(set((h.received_date.year, h.received_date.month) for h in histories))
                monthly_avg = total_income / months_with_data if months_with_data > 0 else 0
            else:
                monthly_avg = 0
            
            # Calculate per-source totals from history
            source_totals = {}
            for h in histories:
                source_id = str(h.income_source_id)
                source_totals[source_id] = source_totals.get(source_id, 0) + float(h.amount)
            
            # Find top source from history
            top_source_id = None
            top_source_amount = 0
            for source_id, amount in source_totals.items():
                if amount > top_source_amount:
                    top_source_amount = amount
                    top_source_id = source_id
            
            # Get top source name
            top_name = "None"
            if top_source_id and all_sources:
                # Convert string ID back to UUID for comparison
                from uuid import UUID
                top_uuid = UUID(top_source_id) if isinstance(top_source_id, str) else top_source_id
                top_source = next((s for s in all_sources if s.id == top_uuid), None)
                if top_source:
                    top_name = top_source.name
            
            # Calculate prediction from recurring sources
            predicted = 0.0
            recurring_count = 0
            one_time_count = 0
            
            for source in all_sources:
                # Count source types
                if source.is_recurring:
                    recurring_count += 1
                    # Only include recurring sources in prediction
                    amount = float(source.amount)
                    if source.frequency == "monthly":
                        predicted += amount
                    elif source.frequency == "weekly":
                        predicted += amount * 4.33
                    elif source.frequency == "biweekly":
                        predicted += amount * 2.165
                    elif source.frequency == "quarterly":
                        predicted += amount / 3
                    elif source.frequency == "annually":
                        predicted += amount / 12
                    elif source.frequency == "daily":
                        predicted += amount * 30
                    else:
                        predicted += amount
                else:
                    one_time_count += 1
            
            return IncomeStats(
                total_annual_income=round(total_income, 2),
                average_monthly_income=round(monthly_avg, 2),
                predicted_next_month=round(predicted, 2),
                total_tax_paid=round(total_tax, 2),
                net_annual_income=round(total_income - total_tax, 2),
                recurring_income_count=recurring_count,
                one_time_income_count=one_time_count,
                top_source_name=top_name,
                top_source_amount=round(top_source_amount, 2)
            )
            
        except Exception as e:
            print(f"❌ Error in get_income_stats: {e}")
            import traceback
            traceback.print_exc()
            return IncomeStats(
                total_annual_income=0,
                average_monthly_income=0,
                predicted_next_month=0,
                total_tax_paid=0,
                net_annual_income=0,
                recurring_income_count=0,
                one_time_income_count=0,
                top_source_name="None",
                top_source_amount=0
            )