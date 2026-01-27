import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class TransactionPayment(Base):
    __tablename__ = "transaction_payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("payment_methods.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transaction = relationship("Transaction", back_populates="transaction_payments")
    payment_method = relationship("PaymentMethod", back_populates="transaction_payments")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount > 0', name='check_transaction_payment_amount_positive'),
    )
    
    def __repr__(self):
        return f"<TransactionPayment(id={self.id}, amount={self.amount})>"

