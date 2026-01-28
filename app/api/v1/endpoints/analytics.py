"""Analytics endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import GoalCreate, GoalInDB, MilestoneCreate, FinancialHealthScore

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/goals", response_model=GoalInDB, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyticsService(db)
    return await service.create_goal(current_user.id, goal_in)


@router.get("/goals", response_model=List[GoalInDB])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyticsService(db)
    return await service.list_goals(current_user.id)


@router.get("/goals/{goal_id}", response_model=GoalInDB)
async def get_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyticsService(db)
    goal = await service.get_goal(current_user.id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


@router.get("/health-score", response_model=FinancialHealthScore)
async def get_health_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyticsService(db)
    return await service.calculate_health_score(current_user.id)


@router.get("/check-health")
async def health_check():
    return {"status": "healthy", "module": "analytics"}
