"""
Background job to automatically create recurring income records.
"""
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import asyncio
import logging

from app.models.income import IncomeSource, IncomeHistory
from app.core.database import async_session
from app.services.income_service import IncomeService

logger = logging.getLogger(__name__)

class RecurringIncomeJob:
    """Job to process recurring income sources and create history records."""
    
    def __init__(self):
        self.running = False
    
    async def process_recurring_income(self):
        """Process all recurring income sources and create records for the current month."""
        logger.info("🔄 Starting recurring income processing...")
        
        async with async_session() as session:
            # Get all active recurring income sources
            result = await session.execute(
                select(IncomeSource).where(
                    and_(
                        IncomeSource.is_active == True,
                        IncomeSource.is_recurring == True
                    )
                )
            )
            sources = result.scalars().all()
            
            logger.info(f"📊 Found {len(sources)} recurring income sources")
            
            now = datetime.now()
            current_month = now.month
            current_year = now.year
            
            for source in sources:
                await self._process_source(session, source, current_year, current_month)
            
            await session.commit()
            logger.info("✅ Recurring income processing complete")
    
    async def _process_source(self, session: AsyncSession, source: IncomeSource, year: int, month: int):
        """Process a single income source."""
        try:
            # Check if we already have a record for this month
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month + 1, 1)
            
            existing = await session.execute(
                select(IncomeHistory).where(
                    and_(
                        IncomeHistory.income_source_id == source.id,
                        IncomeHistory.received_date >= start_date,
                        IncomeHistory.received_date < end_date,
                        IncomeHistory.is_manual_entry == False
                    )
                )
            )
            
            if existing.first():
                logger.debug(f"⏭️ Source {source.source_name} already has record for {year}-{month}")
                return
            
            # Calculate amount based on frequency
            amount = self._calculate_monthly_amount(source)
            
            # Create income record
            history = IncomeHistory(
                user_id=source.user_id,
                income_source_id=source.id,
                amount=amount,
                received_date=date(year, month, 1),
                tax_amount=source.tax_rate * amount / 100 if source.tax_rate else None,
                is_manual_entry=False,
                notes=f"Auto-generated recurring income for {year}-{month}"
            )
            
            session.add(history)
            logger.info(f"✅ Created recurring record for {source.source_name}: R{amount}")
            
        except Exception as e:
            logger.error(f"❌ Error processing source {source.id}: {e}")
    
    def _calculate_monthly_amount(self, source: IncomeSource) -> float:
        """Calculate the monthly amount based on frequency."""
        amount = float(source.amount)
        
        if source.frequency == "weekly":
            return amount * 4  # 4 weeks per month
        elif source.frequency == "biweekly":
            return amount * 2  # 2 times per month
        elif source.frequency == "quarterly":
            return amount / 3  # Spread over 3 months
        elif source.frequency == "annually":
            return amount / 12  # Spread over 12 months
        else:  # monthly and others
            return amount
    
    async def run_daily(self):
        """Run the recurring income job daily."""
        self.running = True
        logger.info("🚀 Starting recurring income scheduler...")
        
        while self.running:
            try:
                # Run at the beginning of each month
                now = datetime.now()
                if now.day == 1:  # First day of month
                    await self.process_recurring_income()
                
                # Check every 6 hours
                await asyncio.sleep(6 * 60 * 60)
                
            except Exception as e:
                logger.error(f"❌ Error in recurring income scheduler: {e}")
                await asyncio.sleep(60)  # Wait a minute before retrying
    
    def stop(self):
        """Stop the recurring income job."""
        self.running = False
        logger.info("🛑 Stopping recurring income scheduler")

# Create a singleton instance
recurring_income_job = RecurringIncomeJob()