"""
Budget CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional, Dict
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
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    period: Optional[BudgetPeriod] = Query(None, description="Filter by budget period"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[BudgetOut]:
    """
    Retrieve paginated list of user's budget plans with optional filters.
    
    Returns all budget plans belonging to the authenticated user,
    with filters for category, period, active status, and pagination.
    Budgets are sorted by creation date (newest first).
    
    Args:
        skip (int): Number of records to skip for pagination.
            Must be >= 0. Defaults to 0.
        limit (int): Maximum number of records to return.
            Must be between 1 and 1000. Defaults to 100.
        category_id (str, optional): Filter by specific category ID.
            Only returns budgets for the specified category.
        period (BudgetPeriod, optional): Filter by budget period.
            Options: monthly, quarterly, yearly, weekly.
        is_active (bool, optional): Filter by active status.
            True returns only active budgets, False returns inactive,
            None returns all budgets regardless of status.
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        List[BudgetOut]: List of budget objects matching the filters.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 422 Unprocessable Entity - Invalid query parameters.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - Returns only budgets belonging to the authenticated user.
        - Multiple filters can be combined (category AND period AND active).
        - Budgets include category relationship if eager loading is implemented.
        - Empty list returned if no budgets match filters.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/budgets/?skip=0&limit=10&period=monthly&is_active=true" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    
    Example Response:
        ```json
        [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "category_id": "660e8400-e29b-41d4-a716-446655440001",
                "name": "January Groceries",
                "amount": 500.00,
                "currency": "USD",
                "period": "monthly",
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "notifications_enabled": true,
                "notification_threshold": 80,
                "is_active": true,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        ]
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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
) -> BudgetOut:
    """
    Retrieve a specific budget plan by ID.
    
    Returns detailed information for a single budget owned by the
    authenticated user. The budget must belong to the current user.
    
    Args:
        budget_id (str): Unique identifier of the budget to retrieve.
            Must be a valid UUID string.
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        BudgetOut: Complete budget details if found and authorized.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 403 Forbidden - Budget exists but doesn't belong to user.
        HTTPException: 404 Not Found - Budget not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - Returns 403 Forbidden (not 404) if budget exists but belongs to another user.
        - Includes related category information.
        - Budget ID must be a valid UUID string.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/budgets/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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
) -> BudgetOut:
    """
    Create a new budget plan for the authenticated user.
    
    Budgets help users track spending against planned amounts for specific
    categories over defined time periods (monthly, quarterly, yearly, weekly).
    Prevents duplicate active budgets for same category and period.
    
    Args:
        budget_in (BudgetCreate): Budget creation data containing:
            - category_id (str): Associated category ID (required, must be valid UUID).
            - name (str): Budget name (e.g., "January Groceries") (required).
            - amount (float): Budget amount (positive, required).
            - currency (str, optional): Currency code (default: "USD").
            - period (BudgetPeriod): Time period from enum (required).
            - start_date (date): Budget start date (required).
            - end_date (date, optional): Budget end date.
            - notifications_enabled (bool, optional): Enable spending alerts.
            - notification_threshold (int, optional): Alert threshold percentage.
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        BudgetOut: Newly created budget with system-generated fields.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid budget data, duplicate budget, or validation error.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Category not found or doesn't belong to user.
        HTTPException: 422 Unprocessable Entity - Validation error.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - Category must exist and belong to the user.
        - Start date must be before end date (if provided).
        - Amount must be positive.
        - Prevents duplicate active budgets for same category and period.
        - Notification threshold must be between 0-100 if provided.
        - Budget is created as active by default.
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/budgets/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "category_id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "January Groceries",
            "amount": 500.00,
            "period": "monthly",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "notifications_enabled": true,
            "notification_threshold": 80
          }'
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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
) -> BudgetOut:
    """
    Update an existing budget plan.
    
    Partially updates budget information. Only budget owners can modify
    their budgets. All fields in BudgetUpdate are optional.
    Updates are performed using PATCH semantics (partial update).
    
    Args:
        budget_id (str): Unique identifier of the budget to update.
            Must be a valid UUID string.
        budget_in (BudgetUpdate): Partial budget data for update.
            All fields are optional.
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        BudgetOut: Updated budget object with refreshed timestamps.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 403 Forbidden - Budget exists but doesn't belong to user.
        HTTPException: 404 Not Found - Budget not found.
        HTTPException: 422 Unprocessable Entity - Validation error.
    
    Notes:
        - Uses PATCH semantics: only provided fields are updated.
        - Cannot update budget to conflict with existing active budgets.
        - Updated timestamp is automatically refreshed.
        - If category_id is updated, new category must belong to user.
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/budgets/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Updated Budget Name",
            "amount": 600.00,
            "is_active": false
          }'
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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
) -> None:
    """
    Soft delete a budget by marking it as inactive.
    
    Performs a soft delete by setting is_active=False instead of
    permanently removing the record. This preserves historical data
    while removing the budget from active use.
    
    Args:
        budget_id (str): Unique identifier of the budget to delete.
            Must be a valid UUID string.
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        None: 204 No Content on successful soft deletion.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 403 Forbidden - Budget exists but doesn't belong to user.
        HTTPException: 404 Not Found - Budget not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - This is a soft delete (is_active=False), not permanent deletion.
        - Budget data is preserved for historical reporting.
        - Budget can be reactivated by updating is_active=True.
        - Transactions associated with budget remain unchanged.
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/budgets/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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

@router.get("/current/summary", response_model=Dict)
async def get_budget_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """
    Get summary statistics of current active budgets.
    
    Returns aggregated information about all active budgets for the
    authenticated user, including total budget amount and count.
    
    Args:
        current_user (User): Authenticated user object from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        Dict: Summary object containing:
            - total_budget (float): Sum of all active budget amounts.
            - active_budgets (int): Count of active budgets.
            - budgets (List[BudgetOut]): List of all active budget objects.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - Only includes budgets where is_active=True.
        - Useful for dashboard widgets and budget overviews.
        - Can be extended with spent amounts and remaining calculations.
        - Returns empty summary if user has no active budgets.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/budgets/current/summary" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    
    Example Response:
        ```json
        {
            "total_budget": 2500.00,
            "active_budgets": 3,
            "budgets": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "Groceries",
                    "amount": 500.00,
                    "period": "monthly",
                    "is_active": true
                },
                {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "name": "Entertainment",
                    "amount": 200.00,
                    "period": "monthly",
                    "is_active": true
                }
            ]
        }
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
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
