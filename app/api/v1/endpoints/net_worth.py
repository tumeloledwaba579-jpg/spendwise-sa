"""
API endpoints for net worth tracking.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/net-worth", tags=["net-worth"])


@router.get("/current")
async def get_current_net_worth(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current net worth for the user."""
    # TODO: Implement net worth calculation
    return {"message": "Current net worth endpoint - to be implemented"}


@router.get("/history")
async def get_net_worth_history(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get net worth history over time."""
    # TODO: Implement net worth history
    return {"message": "Net worth history endpoint - to be implemented"}


@router.get("/breakdown")
async def get_net_worth_breakdown(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get breakdown of assets and liabilities."""
    # TODO: Implement net worth breakdown
    return {"message": "Net worth breakdown endpoint - to be implemented"}
