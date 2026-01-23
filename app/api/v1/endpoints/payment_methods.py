import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.payment_method_service import PaymentMethodService
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=PaymentMethodOut, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_method_in: PaymentMethodCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> PaymentMethodOut:
    """
    Create a new payment method for the authenticated user.
    
    Payment methods represent how transactions are paid (credit cards,
    bank transfers, cash, digital wallets, etc.).
    
    Args:
        payment_method_in (PaymentMethodCreate): Payment method creation data containing:
            - name (str): Payment method name (e.g., "Visa ending in 1234")
            - payment_type (str): Type from enum (credit_card, debit_card, bank_transfer, cash, digital_wallet, other)
            - last_four (str, optional): Last four digits of card/account
            - is_default (bool, optional): Set as default payment method (default: False)
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        PaymentMethodOut: Newly created payment method
    
    Raises:
        HTTPException: 400 Bad Request - Invalid payment method data
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 422 Unprocessable Entity - Validation error
    
    Notes:
        - Only one payment method can be default per user
        - Payment method names should be descriptive but not include full sensitive data
        - Last four digits are optional but recommended for cards
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/payment-methods/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Chase Visa ending in 4321",
            "payment_type": "credit_card",
            "last_four": "4321",
            "is_default": true
          }'
        ```
    """
    try:
        payment_method = await PaymentMethodService.create_payment_method(
            session=session,
            user_id=current_user.id,
            payment_method_in=payment_method_in
        )
        return payment_method
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[PaymentMethodOut])
async def read_payment_methods(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> List[PaymentMethodOut]:
    """
    Retrieve paginated list of user's payment methods.
    
    Returns all active payment methods belonging to the authenticated user,
    with optional pagination parameters.
    
    Args:
        skip (int, optional): Number of records to skip for pagination.
            Defaults to 0.
        limit (int, optional): Maximum number of records to return.
            Defaults to 100, maximum 1000.
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        List[PaymentMethodOut]: List of payment method objects
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
    
    Notes:
        - Default payment method is returned first if applicable
        - Only returns active payment methods by default
        - Returns empty list if user has no payment methods
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/payment-methods/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    payment_methods = await PaymentMethodService.get_payment_methods(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return payment_methods

@router.get("/{payment_method_id}", response_model=PaymentMethodOut)
async def read_payment_method(
    payment_method_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> PaymentMethodOut:
    """
    Retrieve a specific payment method by ID.
    
    Returns detailed information for a single payment method owned by the
    authenticated user.
    
    Args:
        payment_method_id (uuid.UUID): Unique identifier of the payment method to retrieve
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        PaymentMethodOut: Complete payment method details if found and authorized
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Payment method exists but doesn't belong to user
        HTTPException: 404 Not Found - Payment method not found
    
    Notes:
        - Returns 403 Forbidden (not 404) if exists but belongs to another user
        - Includes transaction count if endpoint supports it
        - Sensitive data like full card numbers are never returned
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/payment-methods/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    payment_method = await PaymentMethodService.get_payment_method(
        session=session,
        user_id=current_user.id,
        payment_method_id=payment_method_id
    )
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    return payment_method

@router.put("/{payment_method_id}", response_model=PaymentMethodOut)
async def update_payment_method(
    payment_method_id: uuid.UUID,
    payment_method_in: PaymentMethodUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> PaymentMethodOut:
    """
    Update an existing payment method.
    
    Partially updates payment method information. Only payment method owners
    can modify their payment methods. All fields in PaymentMethodUpdate are optional.
    
    Args:
        payment_method_id (uuid.UUID): Unique identifier of the payment method to update
        payment_method_in (PaymentMethodUpdate): Partial payment method data for update
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        PaymentMethodOut: Updated payment method object
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Payment method exists but doesn't belong to user
        HTTPException: 404 Not Found - Payment method not found
        HTTPException: 422 Unprocessable Entity - Validation error
    
    Notes:
        - Setting is_default=True will update other payment methods to is_default=False
        - Cannot deactivate default payment method without setting new default
        - Updated timestamp is automatically refreshed
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/payment-methods/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Updated Payment Method Name",
            "is_default": true
          }'
        ```
    """
    payment_method = await PaymentMethodService.update_payment_method(
        session=session,
        user_id=current_user.id,
        payment_method_id=payment_method_id,
        payment_method_in=payment_method_in
    )
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    return payment_method

@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    payment_method_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a payment method.
    
    Permanently removes a payment method from the user's profile. This operation
    may fail if the payment method has existing transactions or is the default.
    
    Args:
        payment_method_id (uuid.UUID): Unique identifier of the payment method to delete
        current_user: Authenticated user object from JWT token
        session (AsyncSession): Async database session
    
    Returns:
        None: 204 No Content on successful deletion
    
    Raises:
        HTTPException: 400 Bad Request - Payment method has dependencies (transactions) or is default
        HTTPException: 401 Unauthorized - Invalid or missing authentication token
        HTTPException: 403 Forbidden - Payment method exists but doesn't belong to user
        HTTPException: 404 Not Found - Payment method not found
    
    Notes:
        - Cannot delete default payment method without setting new default
        - Transactions must be reassigned before payment method deletion
        - Consider deactivating (is_active=false) instead of deleting
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/payment-methods/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    success = await PaymentMethodService.delete_payment_method(
        session=session,
        user_id=current_user.id,
        payment_method_id=payment_method_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found or cannot be deleted"
        )
    return None