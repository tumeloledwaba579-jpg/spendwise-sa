"""
Income management endpoints for SpendWise API.
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime

from app.core.database import get_db
from app.services.income_service import IncomeService
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceInDB, IncomeSourceUpdate,
    IncomeHistoryCreate, IncomeHistoryInDB,
    IncomeMonthlySummaryOut, IncomeStats
)
from app.api.v1.deps_cookie import get_current_user
from app.models.user import User

from app.jobs.recurring_income_job import recurring_income_job
from fastapi import Query

router = APIRouter(prefix="/income", tags=["income"])

# ============================================================================
# PUBLIC REDIRECTS - NO AUTH REQUIRED (redirect to trailing slash versions)
# ============================================================================

@router.get("/sources/{source_id}/preview", response_model=dict)
async def preview_upcoming_entries(
    source_id: UUID,
    months: int = Query(6, ge=1, le=12, description="Number of months to preview"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Preview upcoming auto-generated income entries for a source.
    """
    try:
        source = await IncomeService.get_income_source(session, current_user.id, source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Income source not found")
        
        upcoming = await recurring_income_job.preview_upcoming_entries(str(source_id), months)
        
        return {
            "source": source.name,
            "frequency": source.frequency,
            "auto_generate": source.auto_generate_entries,
            "upcoming_entries": upcoming,
            "total_upcoming": len(upcoming),
            "estimated_total": sum(e["amount"] for e in upcoming)
        }
        
    except Exception as e:
        logger.error(f"Error previewing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/stats", include_in_schema=False)
async def redirect_stats():
    """Redirect /stats to /stats/ to maintain consistency."""
    return RedirectResponse(url="/api/v1/income/stats/", status_code=307)

@router.get("/sources", include_in_schema=False)
async def redirect_sources():
    """Redirect /sources to /sources/ to maintain consistency."""
    return RedirectResponse(url="/api/v1/income/sources/", status_code=307)

@router.get("/history", include_in_schema=False)
async def redirect_history():
    """Redirect /history to /history/ to maintain consistency."""
    return RedirectResponse(url="/api/v1/income/history/", status_code=307)

@router.get("/predict/next-month", include_in_schema=False)
async def redirect_predict():
    """Redirect /predict/next-month to /predict/next-month/ to maintain consistency."""
    return RedirectResponse(url="/api/v1/income/predict/next-month/", status_code=307)

# ============================================================================
# REDIRECT FOR SUMMARY (no trailing slash)
# ============================================================================
@router.get("/summary/{year}/{month}", include_in_schema=False)
async def redirect_monthly_summary(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Redirect /summary/2026/3 to /summary/2026/3/ to maintain consistency."""
    print(f"🔄 Redirecting /summary/{year}/{month} to /summary/{year}/{month}/")
    return RedirectResponse(url=f"/api/v1/income/summary/{year}/{month}/", status_code=307)

# ============================================================================
# INCOME SOURCES (with trailing slash)
# ============================================================================
@router.post("/sources/", response_model=IncomeSourceInDB, status_code=201)
async def create_income_source(
    income_in: IncomeSourceCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new income source."""
    try:
        print(f"🔍 create_income_source called for user: {current_user.id}")
        source = await IncomeService.create_income_source(
            session, current_user.id, income_in
        )
        print(f"✅ Income source created: {source.id}")
        return source
    except Exception as e:
        print(f"❌ Error creating income source: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create income source: {str(e)}"
        )

@router.get("/sources/", response_model=List[IncomeSourceInDB])
async def list_income_sources(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """List all income sources for the current user."""
    try:
        print(f"🔍 list_income_sources called for user: {current_user.id}")
        sources = await IncomeService.list_income_sources(
            session, current_user.id, active_only
        )
        print(f"✅ Found {len(sources)} income sources")
        return sources
    except Exception as e:
        print(f"❌ Error listing income sources: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list income sources: {str(e)}"
        )

@router.get("/sources/{source_id}", response_model=IncomeSourceInDB)
async def get_income_source(
    source_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get details of a specific income source."""
    try:
        print(f"🔍 get_income_source called for user: {current_user.id}, source_id: {source_id}")
        source = await IncomeService.get_income_source(session, current_user.id, source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Income source not found")
        return source
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting income source: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get income source: {str(e)}"
        )

@router.put("/sources/{source_id}", response_model=IncomeSourceInDB)
async def update_income_source(
    source_id: UUID,
    income_update: IncomeSourceUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Update an income source."""
    try:
        print(f"🔍 update_income_source called for user: {current_user.id}, source_id: {source_id}")
        source = await IncomeService.update_income_source(
            session, current_user.id, source_id, income_update
        )
        if not source:
            raise HTTPException(status_code=404, detail="Income source not found")
        print(f"✅ Income source updated: {source_id}")
        return source
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating income source: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update income source: {str(e)}"
        )

@router.delete("/sources/{source_id}", status_code=204)
async def deactivate_income_source(
    source_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Deactivate (soft delete) an income source."""
    try:
        print(f"🔍 deactivate_income_source called for user: {current_user.id}, source_id: {source_id}")
        source = await IncomeService.deactivate_income_source(
            session, current_user.id, source_id
        )
        if not source:
            raise HTTPException(status_code=404, detail="Income source not found")
        print(f"✅ Income source deactivated: {source_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deactivating income source: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate income source: {str(e)}"
        )

# ============================================================================
# INCOME HISTORY (with trailing slash)
# ============================================================================
@router.post("/history/", response_model=IncomeHistoryInDB, status_code=201)
async def record_income(
    income_in: IncomeHistoryCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Record actual income received (manual entry)."""
    try:
        print(f"🔍 record_income called for user: {current_user.id}")
        history = await IncomeService.record_income(
            session, current_user.id, income_in
        )
        print(f"✅ Income recorded: {history.id}")
        return history
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"❌ Error recording income: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record income: {str(e)}"
        )

@router.get("/history/", response_model=List[IncomeHistoryInDB])
async def get_income_history(
    source_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get income history with optional filters."""
    try:
        print(f"🔍 get_income_history called for user: {current_user.id}")
        history = await IncomeService.get_income_history(
            session, current_user.id, source_id, start_date, end_date, limit
        )
        print(f"✅ Found {len(history)} income history records")
        return history
    except Exception as e:
        print(f"❌ Error getting income history: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get income history: {str(e)}"
        )

# ============================================================================
# INCOME ANALYTICS (with trailing slash)
# ============================================================================
@router.get("/summary/{year}/{month}/", response_model=IncomeMonthlySummaryOut)
async def get_monthly_summary(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get monthly income summary."""
    try:
        print(f"🔍 get_monthly_summary called for user: {current_user.id}, year: {year}, month: {month}")
        
        summary = await IncomeService.get_monthly_summary(
            session, current_user.id, year, month
        )
        
        # The service now returns a proper object with all fields
        return summary
        
    except Exception as e:
        print(f"❌ Error in get_monthly_summary: {e}")
        import traceback
        traceback.print_exc()
        # Return empty summary with all required fields
        from datetime import datetime
        import uuid
        
        return IncomeMonthlySummaryOut(
            id=uuid.uuid4(),
            user_id=current_user.id,
            year=year,
            month=month,
            total_income=0,
            total_tax=0,
            net_income=0,
            recurring_income=0,
            one_time_income=0,
            source_count=0,
            record_count=0,
            created_at=datetime.now()
        )

@router.get("/predict/next-month/", response_model=dict)
async def predict_next_month(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Predict income for next month based on recurring sources."""
    try:
        print(f"🔍 predict_next_month called for user: {current_user.id}")
        prediction = await IncomeService.predict_next_month(
            session, current_user.id
        )
        print(f"✅ Predicted next month: {prediction}")
        return {"predicted_amount": prediction}
    except Exception as e:
        print(f"❌ Error predicting next month: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"predicted_amount": 0}

# ============================================================================
# INCOME STATS ENDPOINT - FIXED SINGLE VERSION
# ============================================================================
@router.get("/stats/", response_model=IncomeStats)
async def get_income_stats(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> IncomeStats:
    """
    Get income statistics for the year.
    Stats are calculated from income history, not from source amounts.
    """
    try:
        print(f"🔍 get_income_stats called for user: {current_user.id}, year: {year}")
        
        if not year:
            from datetime import datetime
            year = datetime.now().year
            print(f"   Using current year: {year}")
        
        # Get all sources for counts
        sources = await IncomeService.list_income_sources(session, current_user.id, active_only=True)
        
        # Get history for the year
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        history = await IncomeService.get_income_history(
            session, 
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Calculate totals from history
        total_income = sum(h.amount for h in history)
        total_tax = sum(h.tax_amount or 0 for h in history)
        net_income = total_income - total_tax
        
        # Calculate per-source totals from history
        source_totals = {}
        for h in history:
            source_totals[h.income_source_id] = source_totals.get(h.income_source_id, 0) + h.amount
        
        # Find top source from history
        top_source_id = None
        top_source_amount = 0
        for source_id, amount in source_totals.items():
            if amount > top_source_amount:
                top_source_amount = amount
                top_source_id = source_id
        
        # Get top source name
        top_source_name = "None"
        if top_source_id:
            top_source = next((s for s in sources if s.id == top_source_id), None)
            if top_source:
                top_source_name = top_source.name
        
        # Calculate prediction from recurring sources
        recurring_sources = [s for s in sources if s.is_recurring]
        prediction = sum(s.amount for s in recurring_sources)
        
        # Calculate monthly average
        avg_monthly = total_income / 12 if total_income > 0 else 0
        
        stats = IncomeStats(
            total_annual_income=round(total_income, 2),
            average_monthly_income=round(avg_monthly, 2),
            predicted_next_month=round(prediction, 2),
            total_tax_paid=round(total_tax, 2),
            net_annual_income=round(net_income, 2),
            recurring_income_count=len([s for s in sources if s.is_recurring]),
            one_time_income_count=len([s for s in sources if not s.is_recurring]),
            top_source_name=top_source_name,
            top_source_amount=round(top_source_amount, 2)
        )
        
        print(f"✅ Stats calculated from history: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ ERROR in get_income_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return safe defaults
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

# ============================================================================
# HEALTH CHECK
# ============================================================================
@router.get("/health")
async def health_check():
    """Health check endpoint for income module."""
    return {"status": "healthy", "module": "income"}

# ============================================================================
# RECURRING INCOME JOB ENDPOINTS
# ============================================================================
@router.post("/jobs/run-recurring", status_code=200)
async def run_recurring_income_job(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Manually trigger the recurring income job.
    This will create income entries for all recurring sources that are due.
    """
    try:
        print(f"🔍 Manual recurring job triggered by user: {current_user.id}")
        
        from app.jobs.recurring_income_job import recurring_income_job
        
        # Run the job
        await recurring_income_job.run_once()
        
        return {
            "message": "Recurring income job completed successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Error running recurring job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run recurring job: {str(e)}"
        )

@router.get("/jobs/status", response_model=dict)
async def get_recurring_job_status(
    current_user: User = Depends(get_current_user)
):
    """Get the status of the recurring income job."""
    from app.jobs.recurring_income_job import recurring_income_job
    
    return {
        "running": recurring_income_job.running,
        "status": "active" if recurring_income_job.running else "idle"
    }