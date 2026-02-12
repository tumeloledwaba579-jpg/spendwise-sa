"""Financial analytics models."""
from sqlalchemy import Column, String, Numeric, Date, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class FinancialInsight(Base):
    __tablename__ = "financial_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    insight_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Integer, default=5, nullable=False)
    action_items = Column(Text, nullable=True)
    potential_savings = Column(Numeric(15, 2), nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="insights")


class FinancialForecast(Base):
    __tablename__ = "financial_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    forecast_type = Column(String(50), nullable=False)
    forecast_date = Column(Date, nullable=False)
    projected_value = Column(Numeric(15, 2), nullable=False)
    confidence_level = Column(Numeric(5, 2), nullable=False)
    assumptions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="forecasts")


class SpendingPattern(Base):
    __tablename__ = "spending_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    category = Column(String(255), nullable=False)
    average_spending = Column(Numeric(15, 2), nullable=False)
    total_spending = Column(Numeric(15, 2), nullable=False)
    trend = Column(String(50), nullable=False)
    percentage_of_income = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="spending_patterns")
