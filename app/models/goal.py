"""Goal and milestone models."""
from sqlalchemy import Column, String, Numeric, Date, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
import uuid

from app.models.base import Base


class GoalType(str, Enum):
    DEBT_PAYOFF = "DEBT_PAYOFF"
    SAVINGS = "SAVINGS"
    INVESTMENT = "INVESTMENT"
    RETIREMENT = "RETIREMENT"
    HOME_PURCHASE = "HOME_PURCHASE"
    EDUCATION = "EDUCATION"
    EMERGENCY_FUND = "EMERGENCY_FUND"
    VACATION = "VACATION"
    VEHICLE = "VEHICLE"
    OTHER = "OTHER"


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Numeric(15, 2), nullable=False)
    current_amount = Column(Numeric(15, 2), default=0, nullable=False)
    target_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(String(50), default="NOT_STARTED", nullable=False)
    priority = Column(Integer, default=5, nullable=False)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    target_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_date = Column(Date, nullable=True)
    actual_amount = Column(Numeric(15, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="milestones")
    goal = relationship("Goal", back_populates="milestones")
