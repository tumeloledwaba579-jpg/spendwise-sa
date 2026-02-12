"""
Net worth and asset management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.net_worth_service import NetWorthService
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetInDB,
    AssetValuationCreate, AssetValuationInDB
)

router = APIRouter(prefix="/net-worth", tags=["net-worth"])


@router.post("/assets", response_model=AssetInDB, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_in: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new asset."""
    service = NetWorthService(db)
    return await service.create_asset(current_user.id, asset_in)


@router.get("/assets", response_model=List[AssetInDB])
async def list_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all assets for current user."""
    service = NetWorthService(db)
    return await service.list_assets(current_user.id)


@router.get("/assets/{asset_id}", response_model=AssetInDB)
async def get_asset(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific asset."""
    service = NetWorthService(db)
    asset = await service.get_asset(current_user.id, asset_id)
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return asset


@router.put("/assets/{asset_id}", response_model=AssetInDB)
async def update_asset(
    asset_id: UUID,
    asset_in: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an asset."""
    service = NetWorthService(db)
    asset = await service.update_asset(current_user.id, asset_id, asset_in)
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return asset


@router.post("/valuations", response_model=AssetValuationInDB, status_code=status.HTTP_201_CREATED)
async def record_valuation(
    valuation_in: AssetValuationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record asset valuation."""
    service = NetWorthService(db)
    return await service.record_valuation(current_user.id, valuation_in)


@router.get("/dashboard")
async def get_net_worth_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current net worth dashboard."""
    service = NetWorthService(db)
    return await service.calculate_net_worth(current_user.id)


@router.get("/history")
async def get_net_worth_history(
    months: int = 12,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get historical net worth data."""
    service = NetWorthService(db)
    return await service.get_net_worth_history(current_user.id, months)


@router.get("/health")
async def health_check():
    """Health check for net worth module."""
    return {"status": "healthy", "module": "net-worth"}
