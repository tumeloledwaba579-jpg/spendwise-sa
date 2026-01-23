import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut, CategoryType
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> CategoryOut:
    """
    Create a new transaction category for the authenticated user.
    
    Categories organize transactions by type (income, expense, transfer).
    Users can create custom categories with icons, colors, and hierarchy.
    
    Args:
        category_in (CategoryCreate): Category creation data containing:
            - name (str): Category name (e.g., "Groceries", "Salary")
            - category_type (CategoryType): Type from enum (income, expense, transfer)
            - description (str, optional): Category description
            - icon (str, optional): Icon identifier
            - color (str, optional): Hex color code (e.g., "#FF5733")
            - parent_id (uuid.UUID, optional): Parent category ID for hierarchy
            - is_active (bool, optional): Whether category is active (default: True)
            - display_order (int, optional): Display order for sorting
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        CategoryOut: Newly created category
    
    Raises:
        HTTPException: 400 Bad Request - Invalid category data or duplicate name
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 422 Unprocessable Entity - Validation error
    
    Notes:
        - Category names must be unique per user within same type
        - Parent categories must exist and belong to same user
        - System categories cannot be modified or deleted
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/categories/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Groceries",
            "category_type": "expense",
            "color": "#4CAF50",
            "icon": "shopping-cart"
          }'
        ```
    """
    try:
        category = await CategoryService.create_category(
            session=session,
            user_id=current_user.id,
            category_in=category_in
        )
        return category
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[CategoryOut])
async def read_categories(
    skip: int = 0,
    limit: int = 100,
    category_type: Optional[CategoryType] = Query(None),
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> List[CategoryOut]:
    """
    Retrieve paginated list of user's transaction categories.
    
    Returns categories belonging to the authenticated user, optionally
    filtered by type. Categories are sorted by display order.
    
    Args:
        skip (int, optional): Number of records to skip for pagination.
            Defaults to 0.
        limit (int, optional): Maximum number of records to return.
            Defaults to 100, maximum 1000.
        category_type (CategoryType, optional): Filter by category type
            (income, expense, transfer). If None, returns all types.
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        List[CategoryOut]: List of category objects
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
    
    Notes:
        - Returns hierarchical structure if parent-child relationships exist
        - Only returns active categories by default
        - System categories are included and marked as non-editable
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/categories/?category_type=expense" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    categories = await CategoryService.get_categories(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        category_type=category_type
    )
    return categories

@router.get("/{category_id}", response_model=CategoryOut)
async def read_category(
    category_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> CategoryOut:
    """
    Retrieve a specific transaction category by ID.
    
    Returns detailed information for a single category owned by the
    authenticated user, including any child categories.
    
    Args:
        category_id (uuid.UUID): Unique identifier of the category to retrieve
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        CategoryOut: Complete category details if found and authorized
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Category exists but doesn't belong to user
        HTTPException: 404 Not Found - Category not found
    
    Notes:
        - Includes parent category information if applicable
        - May include child categories count or list
        - System categories can be read but not modified
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/categories/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
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
) -> CategoryOut:
    """
    Update an existing transaction category.
    
    Partially updates category information. Only category owners can modify
    their categories. All fields in CategoryUpdate are optional.
    
    Args:
        category_id (uuid.UUID): Unique identifier of the category to update
        category_in (CategoryUpdate): Partial category data for update
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        CategoryOut: Updated category object
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Category exists but doesn't belong to user
        HTTPException: 404 Not Found - Category not found
        HTTPException: 422 Unprocessable Entity - Validation error
    
    Notes:
        - Cannot update system categories
        - Cannot create circular parent-child relationships
        - Changing category_type may require transaction reassignment
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/categories/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Updated Category Name",
            "color": "#FF5733"
          }'
        ```
    """
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

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a transaction category.
    
    Permanently removes a category from the user's profile. This operation
    may fail if the category has existing transactions or child categories.
    
    Args:
        category_id (uuid.UUID): Unique identifier of the category to delete
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        None: 204 No Content on successful deletion
    
    Raises:
        HTTPException: 400 Bad Request - Category has dependencies (transactions, children)
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Category exists but doesn't belong to user
        HTTPException: 404 Not Found - Category not found
    
    Notes:
        - Cannot delete system categories
        - Transactions must be reassigned before category deletion
        - Child categories must be reassigned or deleted first
        - Consider deactivating (is_active=false) instead of deleting
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/categories/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    success = await CategoryService.delete_category(
        session=session,
        user_id=current_user.id,
        category_id=category_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or cannot be deleted"
        )
    return None