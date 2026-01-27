"""
API endpoints for income tracking module.
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceInDB, IncomeSourceUpdate,
    IncomeHistoryCreate, IncomeHistoryInDB,
    IncomeMonthlySummaryOut, IncomeStats
)
from app.services.income_service import IncomeService


router = APIRouter(prefix="/income", tags=["income"])


# ============================================================================
# INCOME SOURCE ENDPOINTS
# ============================================================================

@router.post("/sources", response_model=IncomeSourceInDB, status_code=201)
async def create_income_source(
    income_in: IncomeSourceCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new income source.
    
    - **name**: Income source name (e.g., "Primary Salary", "Freelance Projects")
    - **type**: SALARY, FREELANCE, INVESTMENT, PASSIVE, CUSTOM, OTHER
    - **frequency**: DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
    - **amount**: Monthly/periodic amount in decimal format
    - **is_recurring**: True for ongoing sources (salary), False for one-time (bonus)
    - **is_taxable**: Whether income is subject to tax
    - **auto_tax_calculation**: If True, tax will be calculated and stored
    - **tax_rate**: Tax percentage (0-100) for automatic calculation
    """
    return await IncomeService.create_income_source(session, current_user.id, income_in)


@router.get("/sources", response_model=List[IncomeSourceInDB])
async def list_income_sources(
    active_only: bool = True,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all income sources for the current user.
    
    - **active_only**: If True, only return active (non-deleted) sources
    """
    return await IncomeService.list_income_sources(session, current_user.id, active_only)


@router.get("/sources/{source_id}", response_model=IncomeSourceInDB)
async def get_income_source(
    source_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific income source."""
    source = await IncomeService.get_income_source(session, current_user.id, source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income source not found")
    return source


@router.put("/sources/{source_id}", response_model=IncomeSourceInDB)
async def update_income_source(
    source_id: UUID,
    income_update: IncomeSourceUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an income source."""
    source = await IncomeService.update_income_source(session, current_user.id, source_id, income_update)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income source not found")
    return source


@router.delete("/sources/{source_id}", status_code=204)
async def deactivate_income_source(
    source_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate (soft delete) an income source."""
    source = await IncomeService.deactivate_income_source(session, current_user.id, source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income source not found")


# ============================================================================
# INCOME HISTORY ENDPOINTS
# ============================================================================

@router.post("/history", response_model=IncomeHistoryInDB, status_code=201)
async def record_income(
    income_in: IncomeHistoryCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record actual income received (manual entry).
    
    - **income_source_id**: ID of the income source this came from
    - **amount**: Amount received
    - **received_date**: When the income was received
    - **tax_amount**: Optional tax withheld/paid on this income
    - **is_manual_entry**: Automatically True for manual entries (you can set to False if auto-generated)
    """
    return await IncomeService.record_income(session, current_user.id, income_in)


@router.get("/history", response_model=List[IncomeHistoryInDB])
async def get_income_history(
    source_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get income history with optional filters.
    
    - **source_id**: Filter by specific income source
    - **start_date**: Filter from date (inclusive)
    - **end_date**: Filter to date (inclusive)
    """
    return await IncomeService.get_income_history(
        session, current_user.id, source_id, start_date, end_date
    )


# ============================================================================
# MONTHLY SUMMARY ENDPOINTS
# ============================================================================

@router.get("/summary/{year}/{month}", response_model=IncomeMonthlySummaryOut)
async def get_monthly_summary(
    year: int,
    month: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get income summary for a specific month.
    
    - **year**: Year (e.g., 2026)
    - **month**: Month (1-12)
    
    Returns totals, breakdown (recurring vs one-time), and counts.
    """
    if month < 1 or month > 12:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Month must be 1-12")
    
    summary = await IncomeService.get_monthly_summary(session, current_user.id, year, month)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No income data for this month"
        )
    return summary


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/predict/next-month")
async def predict_next_month(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Predict income for next month based on recurring sources.
    
    Returns the predicted amount considering:
    - All active recurring sources
    - Average one-time income from last 3 months
    """
    predicted = await IncomeService.predict_next_month_income(session, current_user.id)
    return {
        "predicted_income": predicted,
        "currency": "USD"
    }


@router.get("/stats", response_model=IncomeStats)
async def get_income_stats(
    year: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get income statistics for the year.
    
    Returns:
    - **total_annual_income**: Total income for the year
    - **average_monthly_income**: Monthly average
    - **predicted_next_month**: Forecast for next month
    - **total_tax_paid**: Total taxes for the year
    - **net_annual_income**: Income after taxes
    - **recurring_income_count**: Number of recurring sources
    - **one_time_income_count**: Number of one-time sources
    - **top_source_name**: Highest earning source
    - **top_source_amount**: Amount from highest source
    
    If year is not provided, uses current year.
    """
    return await IncomeService.get_income_stats(session, current_user.id, year)


@router.get("/health")
async def health_check():
    """Health check endpoint for income module."""
    return {"status": "healthy", "module": "income"}




