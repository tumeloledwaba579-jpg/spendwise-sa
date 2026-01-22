import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut, CategoryType
from app.api.deps import get_current_user  # We'll create this later

router = APIRouter()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new category for the current user."""
    try:
        category = await CategoryService.create_category(
            session=session,
            user_id=current_user.id,
            category_in=category_in
        )
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the category"
        )

@router.get("/", response_model=List[CategoryOut])
async def read_categories(
    category_type: Optional[CategoryType] = None,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get all categories for the current user, optionally filtered by type."""
    categories = await CategoryService.get_categories(
        session=session,
        user_id=current_user.id,
        category_type=category_type,
        skip=skip,
        limit=limit
    )
    return categories

@router.get("/{category_id}", response_model=CategoryOut)
async def read_category(
    category_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get a specific category by ID."""
    category = await CategoryService.get_category(
        session=session,
        user_id=current_user.id,
        category_id=category_id
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Update a category."""
    try:
        category = await CategoryService.update_category(
            session=session,
            user_id=current_user.id,
            category_id=category_id,
            category_in=category_in
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Delete a category."""
    try:
        success = await CategoryService.delete_category(
            session=session,
            user_id=current_user.id,
            category_id=category_id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
