"""
Debt management models.
"""
from sqlalchemy import Column, String, Numeric, Date, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
import uuid

from app.models.base import Base


class DebtType(str, Enum):
    """Types of debt accounts."""
    CREDIT_CARD = "CREDIT_CARD"
    PERSONAL_LOAN = "PERSONAL_LOAN"
    AUTO_LOAN = "AUTO_LOAN"
    MORTGAGE = "MORTGAGE"
    STUDENT_LOAN = "STUDENT_LOAN"
    OTHER = "OTHER"


class PaymentMethod(str, Enum):
    """Payment methods for debt payments."""
    BANK_TRANSFER = "BANK_TRANSFER"
    CHECK = "CHECK"
    CREDIT_CARD = "CREDIT_CARD"
    AUTO_PAY = "AUTO_PAY"
    OTHER = "OTHER"


class DebtAccount(Base):
    """Debt account (credit card, loan, etc)."""
    __tablename__ = "debt_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    creditor_name = Column(String(255), nullable=True)
    current_balance = Column(Numeric(12, 2), nullable=False)
    credit_limit = Column(Numeric(12, 2), nullable=True)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    minimum_payment = Column(Numeric(12, 2), nullable=True)
    due_date = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=False)
    payoff_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="debt_accounts")
    payments = relationship("DebtPayment", back_populates="debt_account", cascade="all, delete-orphan")
    snapshots = relationship("DebtSnapshot", back_populates="debt_account", cascade="all, delete-orphan")


class DebtPayment(Base):
    """Payment made on a debt account."""
    __tablename__ = "debt_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    debt_account_id = Column(UUID(as_uuid=True), ForeignKey("debt_accounts.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="debt_payments")
    debt_account = relationship("DebtAccount", back_populates="payments")


class DebtSnapshot(Base):
    """Monthly debt snapshot for tracking progress."""
    __tablename__ = "debt_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    debt_account_id = Column(UUID(as_uuid=True), ForeignKey("debt_accounts.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    balance_start = Column(Numeric(12, 2), nullable=False)
    balance_end = Column(Numeric(12, 2), nullable=False)
    total_paid = Column(Numeric(12, 2), nullable=False)
    interest_accrued = Column(Numeric(12, 2), nullable=False)
    payment_count = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="debt_snapshots")
    debt_account = relationship("DebtAccount", back_populates="snapshots")
