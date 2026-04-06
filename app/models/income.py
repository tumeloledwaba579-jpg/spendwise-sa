"""
SQLAlchemy models for income tracking module.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Numeric, ForeignKey, func, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


# ============================================================================
# ENUMS
# ============================================================================

class IncomeType(str, Enum):
    """Income source types"""
    SALARY = "SALARY"
    FREELANCE = "FREELANCE"
    INVESTMENT = "INVESTMENT"
    PASSIVE = "PASSIVE"
    CUSTOM = "CUSTOM"
    OTHER = "OTHER"


class IncomeFrequency(str, Enum):
    """Income frequency types"""
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class TaxCategory(str, Enum):
    """Tax classification types"""
    INCOME_TAX = "INCOME_TAX"
    CAPITAL_GAINS_SHORT = "CAPITAL_GAINS_SHORT"
    CAPITAL_GAINS_LONG = "CAPITAL_GAINS_LONG"
    DIVIDEND = "DIVIDEND"
    SELF_EMPLOYMENT = "SELF_EMPLOYMENT"


# ============================================================================
# MODELS
# ============================================================================

class IncomeSource(Base):
    """
    Income source definition model.
    """
    __tablename__ = "income_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic info
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    frequency = Column(String(50), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="ZAR")

    # Date range
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Recurrence
    is_recurring = Column(Boolean, nullable=False, default=True)

    # Tax info
    is_taxable = Column(Boolean, nullable=False, default=True)
    tax_category = Column(String(50), nullable=True)
    auto_tax_calculation = Column(Boolean, nullable=False, default=False)
    tax_rate = Column(Numeric(5, 2), nullable=True)

    # ✅ Auto-generation controls
    auto_generate_entries = Column(Boolean, nullable=False, default=True)
    generate_if_manual_exists = Column(Boolean, nullable=False, default=False)
    generate_on_weekends = Column(Boolean, nullable=False, default=True)
    next_generation_date = Column(Date, nullable=True)
    last_generated_date = Column(Date, nullable=True)

    # Metadata
    notes = Column(String(1000), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    user = relationship("User", back_populates="income_sources")
    income_history = relationship(
        "IncomeHistory",
        back_populates="income_source",
        cascade="all, delete-orphan",
        foreign_keys="IncomeHistory.income_source_id"
    )

    __table_args__ = (
        CheckConstraint('amount > 0', name='chk_income_amount'),
        CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_income_dates'),
        CheckConstraint('tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 100)', name='chk_tax_rate'),
    )

    def __repr__(self):
        return f"<IncomeSource(id={self.id}, name={self.name}, amount={self.amount})>"


class IncomeHistory(Base):
    """
    Income history model.
    """
    __tablename__ = "income_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    income_source_id = Column(UUID(as_uuid=True), ForeignKey("income_sources.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="ZAR")
    received_date = Column(Date, nullable=False, index=True)
    tax_amount = Column(Numeric(12, 2), nullable=True)
    net_amount = Column(Numeric(12, 2), nullable=True)
    
    # ✅ Skip auto-generation flag
    skip_auto_generation = Column(Boolean, nullable=False, default=False)

    notes = Column(String(1000), nullable=True)
    is_manual_entry = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="income_history")
    income_source = relationship("IncomeSource", back_populates="income_history", foreign_keys=[income_source_id])

    __table_args__ = (
        CheckConstraint('amount > 0', name='chk_history_amount'),
        CheckConstraint('tax_amount IS NULL OR tax_amount >= 0', name='chk_tax_amount'),
    )

    def __repr__(self):
        return f"<IncomeHistory(id={self.id}, amount={self.amount}, received_date={self.received_date})>"


class IncomeMonthlySummary(Base):
    """Monthly income summary model."""
    __tablename__ = "income_monthly_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)

    total_income = Column(Numeric(12, 2), nullable=False)
    total_tax = Column(Numeric(12, 2), nullable=False, default=0)
    net_income = Column(Numeric(12, 2), nullable=False)

    recurring_income = Column(Numeric(12, 2), nullable=False)
    one_time_income = Column(Numeric(12, 2), nullable=False)

    source_count = Column(Integer, nullable=False)
    record_count = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="income_monthly_summary")

    __table_args__ = (
        UniqueConstraint('user_id', 'year', 'month', name='uq_user_month'),
    )