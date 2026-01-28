"""
Net worth tracking models.
"""
from sqlalchemy import Column, Numeric, Date, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class NetWorthSnapshot(Base):
    """Monthly net worth snapshot for tracking financial progress."""
    __tablename__ = "net_worth_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    
    # Asset totals
    total_assets = Column(Numeric(15, 2), nullable=False)
    liquid_assets = Column(Numeric(15, 2), nullable=False)
    non_liquid_assets = Column(Numeric(15, 2), nullable=False)
    
    # Liability totals
    total_liabilities = Column(Numeric(15, 2), nullable=False)
    
    # Income totals
    total_income = Column(Numeric(15, 2), nullable=False)
    
    # Net worth calculation
    net_worth = Column(Numeric(15, 2), nullable=False)
    
    # Ratios
    debt_to_assets_ratio = Column(Numeric(5, 2), nullable=False)
    debt_to_income_ratio = Column(Numeric(5, 2), nullable=False)
    
    # Asset breakdown
    cash_value = Column(Numeric(15, 2), nullable=False)
    investments_value = Column(Numeric(15, 2), nullable=False)
    real_estate_value = Column(Numeric(15, 2), nullable=False)
    retirement_value = Column(Numeric(15, 2), nullable=False)
    other_assets_value = Column(Numeric(15, 2), nullable=False)
    
    # Debt breakdown
    credit_card_debt = Column(Numeric(15, 2), nullable=False)
    personal_loan_debt = Column(Numeric(15, 2), nullable=False)
    mortgage_debt = Column(Numeric(15, 2), nullable=False)
    student_loan_debt = Column(Numeric(15, 2), nullable=False)
    other_debt = Column(Numeric(15, 2), nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="net_worth_snapshots")
