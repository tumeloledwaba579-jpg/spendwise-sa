import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean, func, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class BudgetPeriod(enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    WEEKLY = "weekly"

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    period = Column(Enum(BudgetPeriod), nullable=False, default=BudgetPeriod.MONTHLY)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)
    notification_threshold = Column(Numeric(5, 2), default=80.00)  # Percentage
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount >= 0', name='check_budget_amount_positive'),
        CheckConstraint('notification_threshold >= 0 AND notification_threshold <= 100', name='check_notification_threshold_range'),
    )
    
    def __repr__(self):
        return f"<Budget(id={self.id}, name={self.name}, amount={self.amount})>"
