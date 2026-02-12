import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum

class PaymentMethodType(enum.Enum):
    CREDIT_CARD = "CREDIT_CARD"
    DEBIT_CARD = "DEBIT_CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    DIGITAL_WALLET = "DIGITAL_WALLET"
    OTHER = "OTHER"

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    payment_type = Column(Enum(PaymentMethodType, create_constraint=True, values_callable=lambda x: [e.value for e in PaymentMethodType]), nullable=False)
    last_four = Column(String(4), nullable=True)  # For cards: last 4 digits
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    transaction_payments = relationship("TransactionPayment", back_populates="payment_method", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PaymentMethod(id={self.id}, name={self.name}, type={self.payment_type})>"



