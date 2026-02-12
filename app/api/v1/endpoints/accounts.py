import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.account_service import AccountService
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Create a new financial account for the authenticated user.
    
    Creates a new bank account, credit card, savings account, or other financial
    account type. Accounts can be checking, savings, credit_card, investment, or loan types.
    
    Args:
        account_in (AccountCreate): Account creation data containing:
            - name (str): Account nickname/identifier (e.g., "Chase Checking")
            - account_type (str): Type of account (checking, savings, credit_card, investment, loan)
            - currency (str, optional): Currency code (default: "USD")
            - is_active (bool, optional): Whether account is active (default: True)
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        AccountOut: Newly created account with system-generated fields:
            - id (uuid): Unique account identifier
            - user_id (uuid): Owner user ID
            - balance (float): Initial balance (typically 0.00)
            - created_at (datetime): Creation timestamp
            - updated_at (datetime): Last update timestamp
    
    Raises:
        HTTPException: 400 Bad Request - Invalid account data or validation error
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 500 Internal Server Error - Database error
    
    Notes:
        - Maximum of 20 active accounts per user (configurable)
        - Account names must be unique per user
        - Initial balance is typically set to 0.00
        - Currency defaults to "USD" if not specified
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/accounts/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Chase Checking",
            "account_type": "checking",
            "currency": "USD"
          }'
        ```
    
    Example Response:
        ```json
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Chase Checking",
            "account_type": "checking",
            "balance": 0.00,
            "currency": "USD",
            "is_active": true,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
        ```
    """
    try:
        account = await AccountService.create_account(
            session=session,
            user_id=current_user.id,
            account_in=account_in
        )
        return account
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[AccountOut])
async def read_accounts(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> List[AccountOut]:
    """
    Retrieve paginated list of user's financial accounts.
    
    Returns all active accounts belonging to the authenticated user,
    with optional pagination parameters. Accounts are sorted by
    creation date (newest first).
    
    Args:
        skip (int, optional): Number of records to skip for pagination.
            Defaults to 0.
        limit (int, optional): Maximum number of records to return.
            Defaults to 100, maximum 1000.
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        List[AccountOut]: List of account objects for the current user
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 500 Internal Server Error - Database error
    
    Notes:
        - Only returns active accounts by default
        - Includes account balance in the response
        - Can filter by account_type using query parameters (if implemented)
        - Returns empty list if user has no accounts
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/accounts/?skip=0&limit=10" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    
    Example Response:
        ```json
        [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Chase Checking",
                "account_type": "checking",
                "balance": 1250.50,
                "currency": "USD",
                "is_active": true,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Savings Account",
                "account_type": "savings",
                "balance": 5000.00,
                "currency": "USD",
                "is_active": true,
                "created_at": "2024-01-10T08:15:00Z",
                "updated_at": "2024-01-10T08:15:00Z"
            }
        ]
        ```
    """
    accounts = await AccountService.get_accounts(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return accounts

@router.get("/{account_id}", response_model=AccountOut)
async def read_account(
    account_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Retrieve a specific financial account by ID.
    
    Returns detailed information for a single account owned by the
    authenticated user. The account must belong to the current user.
    
    Args:
        account_id (uuid.UUID): Unique identifier of the account to retrieve
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        AccountOut: Complete account details if found and authorized
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Account exists but doesn't belong to user
        HTTPException: 404 Not Found - Account not found
        HTTPException: 422 Unprocessable Entity - Invalid UUID format
    
    Notes:
        - Returns 403 Forbidden (not 404) if account exists but belongs to another user
        - Includes full transaction history if endpoint supports it
        - Can include recent transactions if implemented
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/accounts/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    account = await AccountService.get_account(
        session=session,
        user_id=current_user.id,
        account_id=account_id
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account

@router.put("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: uuid.UUID,
    account_in: AccountUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Update an existing financial account.
    
    Partially updates account information. Only account owners can modify
    their accounts. All fields in AccountUpdate are optional.
    
    Args:
        account_id (uuid.UUID): Unique identifier of the account to update
        account_in (AccountUpdate): Partial account data for update containing:
            - name (str, optional): New account nickname
            - account_type (str, optional): New account type
            - currency (str, optional): New currency code
            - is_active (bool, optional): New active status
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        AccountOut: Updated account object with refreshed timestamps
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Account exists but doesn't belong to user
        HTTPException: 404 Not Found - Account not found
        HTTPException: 422 Unprocessable Entity - Invalid UUID format
    
    Notes:
        - Cannot deactivate account if it has pending transactions
        - Balance updates should be done via transactions, not this endpoint
        - Updated timestamp is automatically refreshed
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/accounts/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Updated Account Name",
            "is_active": false
          }'
        ```
    """
    account = await AccountService.update_account(
        session=session,
        user_id=current_user.id,
        account_id=account_id,
        account_in=account_in
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a financial account.
    
    Permanently removes an account from the user's profile. This operation
    may fail if the account has existing transactions or dependencies.
    
    Args:
        account_id (uuid.UUID): Unique identifier of the account to delete
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        None: 204 No Content on successful deletion
    
    Raises:
        HTTPException: 400 Bad Request - Account has dependencies (transactions)
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Account exists but doesn't belong to user
        HTTPException: 404 Not Found - Account not found
        HTTPException: 422 Unprocessable Entity - Invalid UUID format
    
    Notes:
        - Consider deactivating (is_active=false) instead of deleting
        - Transactions must be reassigned before account deletion
        - This operation is irreversible
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/accounts/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    success = await AccountService.delete_account(
        session=session,
        user_id=current_user.id,
        account_id=account_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or cannot be deleted"
        )
    return None
