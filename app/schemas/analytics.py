"""Analytics and goal schemas."""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str
    description: Optional[str] = None
    target_amount: Decimal = Field(..., gt=0)
    target_date: date
    priority: int = Field(default=5, ge=1, le=10)
    notes: Optional[str] = None


class GoalInDB(BaseModel):
    id: UUID
    name: str
    type: str
    target_amount: Decimal
    current_amount: Decimal
    target_date: date
    status: str
    progress_percentage: Decimal
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True


class MilestoneCreate(BaseModel):
    goal_id: UUID
    name: str = Field(..., min_length=1)
    target_amount: Decimal = Field(..., gt=0)
    target_date: date


class MilestoneInDB(BaseModel):
    id: UUID
    goal_id: UUID
    name: str
    target_amount: Decimal
    target_date: date
    is_completed: bool
    completed_date: Optional[date]

    class Config:
        from_attributes = True


class FinancialHealthScore(BaseModel):
    overall_score: Decimal
    net_worth_score: Decimal
    debt_health_score: Decimal
    savings_score: Decimal
    goal_achievement_score: Decimal
    spending_score: Decimal
    recommendations: List[str]

