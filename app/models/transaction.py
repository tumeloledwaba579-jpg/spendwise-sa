import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="ZAR", nullable=False)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    
    # ✅ ADD THIS LINE
    transaction_type = Column(String(50), nullable=False, default="expense")  # 'income' or 'expense'
    
    is_transfer = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    transaction_payments = relationship("TransactionPayment", back_populates="transaction", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, date={self.transaction_date})>"