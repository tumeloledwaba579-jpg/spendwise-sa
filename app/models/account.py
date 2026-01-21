import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AccountType(enum.Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Account(id={self.id}, name={self.name}, balance={self.balance})>"
