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

from app.core.database import Base


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
    Represents an income stream (salary, freelance project, investment, etc.)
    """
    __tablename__ = "income_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic info
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # IncomeType enum value
    frequency = Column(String(50), nullable=False)  # IncomeFrequency enum value
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    
    # Date range
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    # Recurrence
    is_recurring = Column(Boolean, nullable=False, default=True)
    
    # Tax info
    is_taxable = Column(Boolean, nullable=False, default=True)
    tax_category = Column(String(50), nullable=True)  # TaxCategory enum value
    auto_tax_calculation = Column(Boolean, nullable=False, default=False)
    tax_rate = Column(Numeric(5, 2), nullable=True)  # Percentage (e.g., 15.50)
    
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
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount > 0', name='chk_income_amount'),
        CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_income_dates'),
        CheckConstraint('tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 100)', name='chk_tax_rate'),
    )
    
    def __repr__(self):
        return f"<IncomeSource(id={self.id}, user_id={self.user_id}, name={self.name}, type={self.type}, amount={self.amount})>"


class IncomeHistory(Base):
    """
    Income history model.
    Stores actual received income records (manually entered or auto-generated).
    Used for analytics, trends, and historical tracking.
    """
    __tablename__ = "income_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    income_source_id = Column(UUID(as_uuid=True), ForeignKey("income_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Income amount
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    
    # When received
    received_date = Column(Date, nullable=False, index=True)
    
    # Tax info
    tax_amount = Column(Numeric(12, 2), nullable=True)  # Calculated or manual tax
    net_amount = Column(Numeric(12, 2), nullable=True)  # amount - tax_amount
    
    # Metadata
    notes = Column(String(1000), nullable=True)
    is_manual_entry = Column(Boolean, nullable=False, default=False)  # True if user entered, False if auto-generated
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="income_history")
    income_source = relationship("IncomeSource", back_populates="income_history", foreign_keys=[income_source_id])
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount > 0', name='chk_history_amount'),
        CheckConstraint('tax_amount IS NULL OR tax_amount >= 0', name='chk_tax_amount'),
    )
    
    def __repr__(self):
        return f"<IncomeHistory(id={self.id}, amount={self.amount}, received_date={self.received_date}, source_id={self.income_source_id})>"


class IncomeMonthlySummary(Base):
    """
    Monthly income summary model.
    Denormalized aggregated data for fast monthly/yearly queries.
    Updated after income records are added/modified.
    """
    __tablename__ = "income_monthly_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Period
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    
    # Totals
    total_income = Column(Numeric(12, 2), nullable=False)  # Sum of all income
    total_tax = Column(Numeric(12, 2), nullable=False, default=0)  # Sum of taxes
    net_income = Column(Numeric(12, 2), nullable=False)  # total_income - total_tax
    
    # Breakdown
    recurring_income = Column(Numeric(12, 2), nullable=False)  # Sum from recurring sources
    one_time_income = Column(Numeric(12, 2), nullable=False)  # Sum from one-time sources
    
    # Counts
    source_count = Column(Integer, nullable=False)  # Number of unique sources
    record_count = Column(Integer, nullable=False)  # Number of history records
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="income_monthly_summary")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'year', 'month', name='uq_user_month'),
    )
    
    def __repr__(self):
        return f"<IncomeMonthlySummary(user_id={self.user_id}, period={self.year}-{self.month:02d}, total_income={self.total_income})>"
