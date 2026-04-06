"""
Enhanced recurring income background job with user controls.
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.database import AsyncSessionLocal
from app.models.income import IncomeSource, IncomeHistory

logger = logging.getLogger(__name__)


class RecurringIncomeJob:
    """Enhanced recurring income job with user controls."""
    
    def __init__(self):
        self.running = False
    
    async def process_recurring_income(self):
        """Process all recurring income sources and create entries."""
        logger.info("🔄 Starting recurring income job...")
        
        async with AsyncSessionLocal() as session:
            try:
                sources_query = select(IncomeSource).where(
                    IncomeSource.is_active == True,
                    IncomeSource.is_recurring == True,
                    IncomeSource.auto_generate_entries == True
                )
                sources_result = await session.execute(sources_query)
                sources = sources_result.scalars().all()
                
                logger.info(f"📊 Found {len(sources)} recurring sources")
                
                today = date.today()
                entries_created = 0
                entries_skipped = 0
                
                for source in sources:
                    try:
                        created, skipped = await self._check_and_create_entry(
                            session, source, today
                        )
                        if created:
                            entries_created += 1
                        if skipped:
                            entries_skipped += 1
                    except Exception as e:
                        logger.error(f"❌ Error processing source {source.id}: {e}")
                        continue
                
                await session.commit()
                logger.info(f"✅ Created {entries_created} entries, skipped {entries_skipped}")
                
            except Exception as e:
                logger.error(f"❌ Fatal error: {e}")
                await session.rollback()
    
    async def _check_and_create_entry(
        self, 
        session: AsyncSession, 
        source: IncomeSource, 
        today: date
    ) -> tuple[bool, bool]:
        """Check and create entry if needed."""
        
        # Get next expected date
        if source.next_generation_date:
            next_date = source.next_generation_date
        elif source.last_generated_date:
            next_date = self._calculate_next_date(source.last_generated_date, source.frequency)
        else:
            next_date = source.start_date
        
        if not next_date or next_date > today:
            return False, False
        
        # Check for manual entry
        if not source.generate_if_manual_exists:
            manual_exists = await self._check_manual_entry_exists(session, source, next_date)
            if manual_exists:
                logger.info(f"⏭️ Skipping {source.name} - manual entry exists")
                source.last_generated_date = next_date
                source.next_generation_date = self._calculate_next_date(next_date, source.frequency)
                await session.flush()
                return False, True
        
        # Weekend adjustment
        if not source.generate_on_weekends and next_date.weekday() >= 5:
            days_to_add = 7 - next_date.weekday()
            next_date = next_date + timedelta(days=days_to_add)
        
        # Calculate tax
        tax_amount = None
        if source.is_taxable and source.tax_rate:
            tax_amount = source.amount * (source.tax_rate / 100)
        
        # Create entry
        new_entry = IncomeHistory(
            user_id=source.user_id,
            income_source_id=source.id,
            amount=source.amount,
            received_date=next_date,
            tax_amount=tax_amount,
            net_amount=source.amount - (tax_amount or 0),
            notes=f"Auto-generated ({source.frequency})",
            is_manual_entry=False,
            skip_auto_generation=False
        )
        
        session.add(new_entry)
        
        # Update source
        source.last_generated_date = next_date
        source.next_generation_date = self._calculate_next_date(next_date, source.frequency)
        
        logger.info(f"✅ Created entry for {source.name}: R{source.amount:.2f}")
        return True, False
    
    async def _check_manual_entry_exists(
        self, 
        session: AsyncSession, 
        source: IncomeSource, 
        check_date: date
    ) -> bool:
        """Check if manual entry exists for this period."""
        if source.frequency == "MONTHLY":
            start_date = date(check_date.year, check_date.month, 1)
            if check_date.month == 12:
                end_date = date(check_date.year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(check_date.year, check_date.month + 1, 1) - timedelta(days=1)
        else:
            start_date = check_date - timedelta(days=30)
            end_date = check_date + timedelta(days=30)

        query = select(IncomeHistory.id).where(
            IncomeHistory.income_source_id == source.id,
            IncomeHistory.user_id == source.user_id,
            IncomeHistory.is_manual_entry == True,
            IncomeHistory.received_date >= start_date,
            IncomeHistory.received_date <= end_date
        ).limit(1)

        result = await session.execute(query)
        return result.scalar() is not None
    
    def _calculate_next_date(self, last_date: date, frequency: str) -> date:
        """Calculate next date based on frequency."""
        if frequency == "DAILY":
            return last_date + timedelta(days=1)
        elif frequency == "WEEKLY":
            return last_date + timedelta(weeks=1)
        elif frequency == "BIWEEKLY":
            return last_date + timedelta(weeks=2)
        elif frequency == "MONTHLY":
            year = last_date.year
            month = last_date.month + 1
            if month > 12:
                year += 1
                month = 1
            day = min(last_date.day, self._days_in_month(year, month))
            return date(year, month, day)
        elif frequency == "QUARTERLY":
            return last_date + timedelta(days=91)
        elif frequency == "YEARLY":
            return date(last_date.year + 1, last_date.month, last_date.day)
        return None
    
    def _days_in_month(self, year: int, month: int) -> int:
        """Get days in month."""
        if month == 2:
            if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
                return 29
            return 28
        elif month in [4, 6, 9, 11]:
            return 30
        else:
            return 31
    
    async def preview_upcoming_entries(self, source_id: str, months: int = 6) -> list[dict]:
        """Preview upcoming auto-generated entries."""
        async with AsyncSessionLocal() as session:
            source = await session.get(IncomeSource, uuid.UUID(source_id))
            if not source:
                return []
            
            upcoming = []
            today = date.today()
            
            if source.next_generation_date:
                next_date = source.next_generation_date
            elif source.last_generated_date:
                next_date = self._calculate_next_date(source.last_generated_date, source.frequency)
            else:
                next_date = source.start_date
            
            for _ in range(months * 4):
                if next_date <= today:
                    next_date = self._calculate_next_date(next_date, source.frequency)
                    continue
                
                if next_date > today + timedelta(days=months * 31):
                    break
                
                display_date = next_date
                if not source.generate_on_weekends and display_date.weekday() >= 5:
                    days_to_add = 7 - display_date.weekday()
                    display_date = display_date + timedelta(days=days_to_add)
                
                tax_amount = None
                if source.is_taxable and source.tax_rate:
                    tax_amount = float(source.amount) * (float(source.tax_rate) / 100)
                
                upcoming.append({
                    "date": display_date.isoformat(),
                    "amount": float(source.amount),
                    "tax": tax_amount,
                    "net": float(source.amount) - (tax_amount or 0)
                })
                
                next_date = self._calculate_next_date(next_date, source.frequency)
            
            return upcoming
    
    async def run_daily(self):
        """Run the job daily."""
        self.running = True
        logger.info("🚀 Recurring income job started")
        
        while self.running:
            try:
                await self.process_recurring_income()
                await asyncio.sleep(24 * 60 * 60)
            except Exception as e:
                logger.error(f"❌ Error in job loop: {e}")
                await asyncio.sleep(60)
    
    def stop(self):
        self.running = False
        logger.info("🛑 Recurring income job stopped")


recurring_income_job = RecurringIncomeJob()