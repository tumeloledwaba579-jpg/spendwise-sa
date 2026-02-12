"""
Asset management models for net worth tracking.
"""
from sqlalchemy import Column, String, Numeric, Date, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
import uuid

from app.models.base import Base


class AssetType(str, Enum):
    """Types of assets."""
    CASH = "CASH"
    SAVINGS_ACCOUNT = "SAVINGS_ACCOUNT"
    CHECKING_ACCOUNT = "CHECKING_ACCOUNT"
    INVESTMENT_ACCOUNT = "INVESTMENT_ACCOUNT"
    RETIREMENT_ACCOUNT = "RETIREMENT_ACCOUNT"
    REAL_ESTATE = "REAL_ESTATE"
    VEHICLE = "VEHICLE"
    CRYPTOCURRENCY = "CRYPTOCURRENCY"
    PRECIOUS_METALS = "PRECIOUS_METALS"
    COLLECTIBLES = "COLLECTIBLES"
    BUSINESS = "BUSINESS"
    OTHER = "OTHER"


class Asset(Base):
    """User asset (investments, real estate, vehicles, etc)."""
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    current_value = Column(Numeric(15, 2), nullable=False)
    purchase_price = Column(Numeric(15, 2), nullable=True)
    purchase_date = Column(Date, nullable=True)
    last_valued_date = Column(Date, nullable=False)
    quantity = Column(Numeric(12, 4), nullable=True)
    unit_value = Column(Numeric(15, 2), nullable=True)
    is_liquid = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="assets")
    valuations = relationship("AssetValuation", back_populates="asset", cascade="all, delete-orphan")


class AssetValuation(Base):
    """Historical asset valuations for tracking appreciation/depreciation."""
    __tablename__ = "asset_valuations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    valuation_date = Column(Date, nullable=False)
    value = Column(Numeric(15, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="asset_valuations")
    asset = relationship("Asset", back_populates="valuations")
