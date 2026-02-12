"""Analytics service."""
import logging
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.goal import Goal
from app.models.analytics import FinancialInsight
from app.models.debt import DebtAccount
from app.models.income import IncomeHistory
from app.models.asset import Asset
from app.schemas.analytics import GoalCreate, GoalInDB, FinancialHealthScore

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_goal(self, user_id: UUID, goal_in: GoalCreate) -> GoalInDB:
        goal = Goal(
            user_id=user_id,
            name=goal_in.name,
            type=goal_in.type,
            description=goal_in.description,
            target_amount=goal_in.target_amount,
            target_date=goal_in.target_date,
            start_date=date.today(),
            priority=goal_in.priority,
            notes=goal_in.notes,
            status="NOT_STARTED",
        )
        self.session.add(goal)
        await self.session.commit()
        await self.session.refresh(goal)
        return GoalInDB.from_orm(goal)

    async def list_goals(self, user_id: UUID) -> List[GoalInDB]:
        result = await self.session.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.priority.desc())
        )
        goals = result.scalars().all()
        return [GoalInDB.from_orm(goal) for goal in goals]

    async def get_goal(self, user_id: UUID, goal_id: UUID) -> Optional[GoalInDB]:
        result = await self.session.execute(
            select(Goal).where((Goal.user_id == user_id) & (Goal.id == goal_id))
        )
        goal = result.scalar_one_or_none()
        return GoalInDB.from_orm(goal) if goal else None

    async def calculate_health_score(self, user_id: UUID) -> FinancialHealthScore:
        assets_result = await self.session.execute(
            select(func.sum(Asset.current_value)).where(Asset.user_id == user_id)
        )
        total_assets = assets_result.scalar() or Decimal('0')

        debt_result = await self.session.execute(
            select(func.sum(DebtAccount.current_balance)).where(DebtAccount.user_id == user_id)
        )
        total_debt = debt_result.scalar() or Decimal('0')

        net_worth = total_assets - total_debt
        net_worth_score = min(Decimal('100'), (net_worth / Decimal('100000')) * Decimal('100')) if net_worth > 0 else Decimal('0')
        debt_health_score = max(Decimal('0'), Decimal('100') - (total_debt / total_assets * Decimal('100'))) if total_assets > 0 else Decimal('100')

        overall_score = (net_worth_score + debt_health_score + Decimal('70')) / Decimal('3')
        recommendations = []
        if debt_health_score < 50:
            recommendations.append("Focus on reducing debt")

        return FinancialHealthScore(
            overall_score=overall_score,
            net_worth_score=net_worth_score,
            debt_health_score=debt_health_score,
            savings_score=Decimal('70'),
            goal_achievement_score=Decimal('65'),
            spending_score=Decimal('72'),
            recommendations=recommendations
        )
