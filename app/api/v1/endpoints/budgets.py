"""
Budget CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from app.core.database import get_db
from app.models.budget import Budget, BudgetPeriod
from app.models.user import User
from app.models.category import Category
from app.api.deps import get_current_user
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=List[BudgetOut])
async def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category_id: Optional[str] = None,
    period: Optional[BudgetPeriod] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all budgets for the current user with optional filters.
    """
    query = select(Budget).where(Budget.user_id == current_user.id)
    
    # Apply filters
    if category_id:
        query = query.where(Budget.category_id == category_id)
    if period:
        query = query.where(Budget.period == period)
    if is_active is not None:
        query = query.where(Budget.is_active == is_active)
    
    query = query.offset(skip).limit(limit).order_by(Budget.created_at.desc())
    
    result = await db.execute(query)
    budgets = result.scalars().all()
    
    return budgets


@router.get("/{budget_id}", response_model=BudgetOut)
async def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific budget by ID.
    """
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget


@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new budget.
    """
    # Verify category belongs to user
    category_result = await db.execute(
        select(Category).where(
            Category.id == budget_in.category_id,
            Category.user_id == current_user.id
        )
    )
    category = category_result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check for duplicate budget for same category and period
    existing_budget_result = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category_id == budget_in.category_id,
            Budget.period == budget_in.period,
            Budget.is_active == True
        )
    )
    existing_budget = existing_budget_result.scalar_one_or_none()
    
    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active budget already exists for this category and period"
        )
    
    # Create budget
    budget = Budget(
        **budget_in.dict(),
        user_id=current_user.id
    )
    
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    
    return budget


@router.put("/{budget_id}", response_model=BudgetOut)
async def update_budget(
    budget_id: str,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a budget.
    """
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Update fields
    update_data = budget_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    await db.commit()
    await db.refresh(budget)
    
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a budget (soft delete by setting is_active=False).
    """
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Soft delete by marking as inactive
    budget.is_active = False
    await db.commit()
    
    return None


@router.get("/current/summary", response_model=dict)
async def get_budget_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a summary of current active budgets.
    """
    # Get all active budgets
    result = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.is_active == True
        )
    )
    budgets = result.scalars().all()
    
    total_budget = sum(budget.amount for budget in budgets)
    active_budgets = len(budgets)
    
    return {
        "total_budget": total_budget,
        "active_budgets": active_budgets,
        "budgets": budgets
    }
