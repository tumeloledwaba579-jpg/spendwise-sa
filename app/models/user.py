"""
User model for authentication and data ownership.
"""
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # =========================================================================
    # Phase 1 Relationships
    # =========================================================================
    accounts = relationship("Account", back_populates="owner", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")

    # =========================================================================
    # Phase 2: Income Tracking Relationships
    # =========================================================================
    income_sources = relationship("IncomeSource", back_populates="user", cascade="all, delete-orphan")
    income_history = relationship("IncomeHistory", back_populates="user", cascade="all, delete-orphan")
    income_monthly_summary = relationship("IncomeMonthlySummary", back_populates="user", cascade="all, delete-orphan")

    # =========================================================================
    # Phase 2b: Debt Management Relationships
    # =========================================================================
    debt_accounts = relationship("DebtAccount", back_populates="user", cascade="all, delete-orphan")
    debt_payments = relationship("DebtPayment", back_populates="user", cascade="all, delete-orphan")
    debt_snapshots = relationship("DebtSnapshot", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
