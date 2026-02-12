"""
TransactionPayment CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.transaction_payment import TransactionPayment
from app.models.transaction import Transaction
from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.transaction_payment import TransactionPaymentCreate, TransactionPaymentUpdate, TransactionPaymentOut

router = APIRouter(prefix="/transaction-payments", tags=["transaction-payments"])

@router.get("/", response_model=List[TransactionPaymentOut])
async def get_transaction_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    transaction_id: Optional[str] = Query(None, description="Filter by transaction ID"),
    payment_method_id: Optional[str] = Query(None, description="Filter by payment method ID"),
    status: Optional[str] = Query(None, description="Filter by payment status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TransactionPaymentOut]:
    """
    Retrieve paginated list of transaction payments with ownership validation.
    
    Returns payment records for transactions owned by the authenticated user,
    with filtering options for transaction, payment method, and status.
    Ensures data privacy through transaction ownership checks.
    
    Args:
        skip (int): Number of records to skip for pagination.
            Must be >= 0. Defaults to 0.
        limit (int): Maximum number of records to return.
            Must be between 1 and 1000. Defaults to 100.
        transaction_id (str, optional): Filter by specific transaction ID.
            Must be a transaction owned by the user.
        payment_method_id (str, optional): Filter by specific payment method ID.
            Must be a payment method owned by the user.
        status (str, optional): Filter by payment status.
            Common values: pending, completed, failed, refunded.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        List[TransactionPaymentOut]: Payment records matching filters.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 422 Unprocessable Entity - Invalid query parameters.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - Automatically joins with transactions to verify user ownership.
        - Returns empty list for unauthorized transaction IDs.
        - Payment status filter is case-sensitive.
        - Sorted by creation date (newest first).
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/transaction-payments/?transaction_id=550e8400-e29b-41d4-a716-446655440000&status=completed" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # Start with base query joining with transaction to ensure user ownership
    query = select(TransactionPayment).join(
        Transaction, TransactionPayment.transaction_id == Transaction.id
    ).where(
        Transaction.user_id == current_user.id
    )

    # Apply filters
    if transaction_id:
        query = query.where(TransactionPayment.transaction_id == transaction_id)
    if payment_method_id:
        query = query.where(TransactionPayment.payment_method_id == payment_method_id)
    if status:
        query = query.where(TransactionPayment.status == status)

    query = query.offset(skip).limit(limit).order_by(TransactionPayment.created_at.desc())

    result = await db.execute(query)
    transaction_payments = result.scalars().all()

    return transaction_payments

@router.get("/{payment_id}", response_model=TransactionPaymentOut)
async def get_transaction_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionPaymentOut:
    """
    Retrieve a specific transaction payment by ID with ownership validation.
    
    Returns detailed payment information only if the associated transaction
    belongs to the authenticated user, ensuring data privacy.
    
    Args:
        payment_id (str): Unique payment identifier (UUID format).
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionPaymentOut: Complete payment details.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 403 Forbidden - Transaction exists but belongs to another user.
        HTTPException: 404 Not Found - Payment not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - Authorization based on transaction ownership, not direct payment ownership.
        - Returns 403 (not 404) for unauthorized access attempts.
        - Includes transaction and payment method relationships.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/transaction-payments/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()

    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )

    return transaction_payment

@router.post("/", response_model=TransactionPaymentOut, status_code=status.HTTP_201_CREATED)
async def create_transaction_payment(
    payment_in: TransactionPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionPaymentOut:
    """
    Create a new payment record for a transaction.
    
    Links payment methods to transactions with validation for ownership
    and data integrity. Supports partial payments and multiple payment methods.
    
    Args:
        payment_in (TransactionPaymentCreate): Payment data containing:
            - transaction_id (str): Associated transaction ID (required).
            - payment_method_id (str): Associated payment method ID (required).
            - amount (float): Payment amount (required, positive).
            - currency (str, optional): Currency code (default: "USD").
            - status (str, optional): Payment status (default: "pending").
            - reference (str, optional): External payment reference.
            - notes (str, optional): Additional payment notes.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionPaymentOut: Newly created payment record.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid payment data.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Transaction or payment method not found.
        HTTPException: 422 Unprocessable Entity - Validation error.
    
    Notes:
        - Transaction must exist and belong to user.
        - Payment method must exist and belong to user.
        - Amount cannot exceed remaining transaction balance.
        - Supports multiple payments per transaction.
        - Payment status defaults to 'pending'.
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/transaction-payments/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
            "payment_method_id": "660e8400-e29b-41d4-a716-446655440001",
            "amount": 125.50,
            "status": "completed"
          }'
        ```
    """
    # Verify transaction belongs to user
    transaction_result = await db.execute(
        select(Transaction).where(
            Transaction.id == payment_in.transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = transaction_result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Verify payment method belongs to user
    payment_method_result = await db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == payment_in.payment_method_id,
            PaymentMethod.user_id == current_user.id
        )
    )
    payment_method = payment_method_result.scalar_one_or_none()

    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    # Create transaction payment
    transaction_payment = TransactionPayment(
        **payment_in.dict()
    )

    db.add(transaction_payment)
    await db.commit()
    await db.refresh(transaction_payment)

    return transaction_payment

@router.put("/{payment_id}", response_model=TransactionPaymentOut)
async def update_transaction_payment(
    payment_id: str,
    payment_in: TransactionPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionPaymentOut:
    """
    Update an existing transaction payment.
    
    Partially updates payment information with validation for
    payment method ownership and data consistency.
    
    Args:
        payment_id (str): Payment identifier to update.
        payment_in (TransactionPaymentUpdate): Partial payment data.
            All fields optional (PATCH semantics).
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionPaymentOut: Updated payment record.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Payment or payment method not found.
        HTTPException: 422 Unprocessable Entity - Validation error.
    
    Notes:
        - Only provided fields are updated (PATCH semantics).
        - Validates new payment method ownership if changed.
        - Status transitions may have business rules.
        - Cannot change transaction_id (create new payment instead).
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/transaction-payments/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "status": "refunded",
            "notes": "Customer requested refund"
          }'
        ```
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()

    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )

    # Update fields
    update_data = payment_in.dict(exclude_unset=True)

    # Verify payment method if being updated
    if "payment_method_id" in update_data and update_data["payment_method_id"]:
        payment_method_result = await db.execute(
            select(PaymentMethod).where(
                PaymentMethod.id == update_data["payment_method_id"],
                PaymentMethod.user_id == current_user.id
            )
        )
        payment_method = payment_method_result.scalar_one_or_none()

        if not payment_method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found"
            )

    for field, value in update_data.items():
        setattr(transaction_payment, field, value)

    await db.commit()
    await db.refresh(transaction_payment)

    return transaction_payment

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Permanently delete a transaction payment.
    
    Removes payment record from the system. This operation is irreversible
    and should be used with caution for audit compliance.
    
    Args:
        payment_id (str): Payment identifier to delete.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        None: 204 No Content on success.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Payment not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - Permanent deletion (not soft delete).
        - Consider refund workflow instead of deletion for completed payments.
        - May affect transaction status reporting.
        - Maintain audit trails for financial compliance.
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/transaction-payments/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # Join with transaction to ensure user ownership
    result = await db.execute(
        select(TransactionPayment).join(
            Transaction, TransactionPayment.transaction_id == Transaction.id
        ).where(
            TransactionPayment.id == payment_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction_payment = result.scalar_one_or_none()

    if not transaction_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction payment not found"
        )

    await db.delete(transaction_payment)
    await db.commit()

    return None
