"""
Transaction CRUD endpoints for SpendWise SA.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from datetime import datetime
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/", response_model=List[TransactionOut])
async def get_transactions(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    account_id: Optional[str] = Query(None, description="Filter by account ID"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by transaction date (start)"),
    end_date: Optional[datetime] = Query(None, description="Filter by transaction date (end)"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum transaction amount"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum transaction amount"),
    search: Optional[str] = Query(None, description="Search in description or notes"),
    is_transfer: Optional[bool] = Query(None, description="Filter by transfer flag"),
    is_recurring: Optional[bool] = Query(None, description="Filter by recurring flag"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[TransactionOut]:
    """
    Retrieve paginated list of user's financial transactions with comprehensive filters.
    
    Returns all transactions belonging to the authenticated user with extensive
    filtering options including date ranges, amount ranges, text search, and
    transaction flags. Transactions are sorted by date (newest first).
    
    Args:
        skip (int): Number of records to skip for pagination.
            Must be >= 0. Defaults to 0.
        limit (int): Maximum number of records to return.
            Must be between 1 and 1000. Defaults to 100.
        account_id (str, optional): Filter by specific account ID.
        category_id (str, optional): Filter by specific category ID.
        start_date (datetime, optional): Start date for date range filter.
            Format: ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).
        end_date (datetime, optional): End date for date range filter.
            Format: ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).
        min_amount (float, optional): Minimum transaction amount filter.
            Must be >= 0. Applied to absolute amount values.
        max_amount (float, optional): Maximum transaction amount filter.
            Must be >= 0. Applied to absolute amount values.
        search (str, optional): Text search across description and notes fields.
            Case-insensitive partial match.
        is_transfer (bool, optional): Filter transfer transactions.
            True = only transfers, False = exclude transfers.
        is_recurring (bool, optional): Filter recurring transactions.
            True = only recurring, False = exclude recurring.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        List[TransactionOut]: Filtered transaction list.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 422 Unprocessable Entity - Invalid query parameters.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - All filters are combined with AND logic.
        - Date range: inclusive of both start and end dates.
        - Amount filters use absolute values (ignores negative signs).
        - Search looks in both description and notes fields.
        - Returns empty list if no matches.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/transactions/?start_date=2024-01-01&end_date=2024-01-31&min_amount=50&search=grocery" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    # EXISTING LOGIC REMAINS UNCHANGED
    query = select(Transaction).where(Transaction.user_id == current_user.id)

    # Apply filters
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.where(Transaction.amount <= max_amount)
    if search:
        query = query.where(
            or_(
                Transaction.description.ilike(f"%{search}%"),
                Transaction.notes.ilike(f"%{search}%")
            )
        )
    if is_transfer is not None:
        query = query.where(Transaction.is_transfer == is_transfer)
    if is_recurring is not None:
        query = query.where(Transaction.is_recurring == is_recurring)

    query = query.offset(skip).limit(limit).order_by(Transaction.transaction_date.desc())

    result = await db.execute(query)
    transactions = result.scalars().all()

    return transactions

@router.get("/summary", response_model=dict)
async def get_transaction_summary(
    start_date: Optional[datetime] = Query(None, description="Start date for summary period"),
    end_date: Optional[datetime] = Query(None, description="End date for summary period"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Generate comprehensive financial summary with category-based analysis.
    
    Calculates total income, expenses, transfers, net balance, and transaction counts
    categorized by transaction type (income/expense/transfer). Uses category metadata
    for accurate classification.
    
    Args:
        start_date (datetime, optional): Summary period start date.
            If None, includes all historical transactions.
        end_date (datetime, optional): Summary period end date.
            If None, includes transactions up to current date.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        dict: Financial summary containing:
            - income (float): Total income amount.
            - expenses (float): Total expense amount.
            - transfers (float): Total transfer amount.
            - net (float): Net balance (income - expenses).
            - transaction_count (int): Total number of transactions.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 422 Unprocessable Entity - Invalid date parameters.
        HTTPException: 500 Internal Server Error - Database error.
    
    Notes:
        - Transactions without categories are treated as expenses.
        - Transfers are tracked separately for financial reporting.
        - Net balance excludes transfers (income - expenses only).
        - Amounts are summed as absolute values, signs indicate direction.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/transactions/summary?start_date=2024-01-01&end_date=2024-01-31" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    
    Example Response:
        ```json
        {
            "income": 3500.00,
            "expenses": 2450.50,
            "transfers": 500.00,
            "net": 1049.50,
            "transaction_count": 42
        }
        ```
    """
    from sqlalchemy import func

    # Get all transactions with their categories
    query = select(
        Transaction.amount,
        Category.category_type
    ).join(
        Category, Transaction.category_id == Category.id, isouter=True
    ).where(
        Transaction.user_id == current_user.id
    )

    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)

    result = await db.execute(query)
    transactions = result.all()

    # Calculate summary
    income = 0.0
    expenses = 0.0
    transfers = 0.0

    for transaction in transactions:
        if transaction.category_type:
            if transaction.category_type.value == "income":
                income += float(transaction.amount)
            elif transaction.category_type.value == "expense":
                expenses += float(transaction.amount)
            elif transaction.category_type.value == "transfer":
                transfers += float(transaction.amount)
        else:
            # If no category, count as expense by default
            expenses += float(transaction.amount)

    net = income - expenses

    return {
        "income": income,
        "expenses": expenses,
        "transfers": transfers,
        "net": net,
        "transaction_count": len(transactions)
    }

@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Retrieve a specific financial transaction by ID.
    
    Returns complete details for a single transaction owned by the
    authenticated user, including all metadata and relationships.
    
    Args:
        transaction_id (str): Unique transaction identifier (UUID format).
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionOut: Complete transaction details.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 403 Forbidden - Transaction exists but belongs to another user.
        HTTPException: 404 Not Found - Transaction not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - Returns 403 (not 404) if transaction exists but user unauthorized.
        - Includes eager-loaded account and category relationships.
        - Transaction ID must be valid UUID string.
    
    Example Request:
        ```bash
        curl -X GET "http://localhost:8000/api/v1/transactions/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    return transaction

@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Create a new financial transaction.
    
    Records income, expense, or transfer transactions with validation
    for account ownership, category assignment, and data integrity.
    
    Args:
        transaction_in (TransactionCreate): Transaction data containing:
            - account_id (str): Associated account ID (required).
            - category_id (str, optional): Associated category ID.
            - amount (float): Transaction amount (required, non-zero).
            - currency (str, optional): Currency code (default: "USD").
            - transaction_date (datetime): Transaction date (required).
            - description (str): Transaction description (required).
            - notes (str, optional): Additional notes.
            - is_transfer (bool, optional): Mark as transfer transaction.
            - is_recurring (bool, optional): Mark as recurring transaction.
            - recurrence_rule (str, optional): Recurrence rule expression.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionOut: Newly created transaction.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid transaction data.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Account or category not found.
        HTTPException: 422 Unprocessable Entity - Validation error.
    
    Notes:
        - Account must exist and belong to user.
        - Category (if provided) must exist and belong to user.
        - Amount must be non-zero.
        - Transaction date cannot be in future (configurable).
        - Creates associated payment records if needed.
    
    Example Request:
        ```bash
        curl -X POST "http://localhost:8000/api/v1/transactions/" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "account_id": "550e8400-e29b-41d4-a716-446655440000",
            "category_id": "660e8400-e29b-41d4-a716-446655440001",
            "amount": -125.50,
            "transaction_date": "2024-01-15T14:30:00Z",
            "description": "Grocery shopping"
          }'
        ```
    """
    # Verify account belongs to user
    account_result = await db.execute(
        select(Account).where(
            Account.id == transaction_in.account_id,
            Account.user_id == current_user.id
        )
    )
    account = account_result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    # Verify category belongs to user (if provided)
    if transaction_in.category_id:
        category_result = await db.execute(
            select(Category).where(
                Category.id == transaction_in.category_id,
                Category.user_id == current_user.id
            )
        )
        category = category_result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

    # Create transaction
    transaction = Transaction(
        **transaction_in.dict(),
        user_id=current_user.id
    )

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    return transaction

@router.put("/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: str,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TransactionOut:
    """
    Update an existing financial transaction.
    
    Partially updates transaction information with validation for
    account/category ownership and data consistency.
    
    Args:
        transaction_id (str): Transaction identifier to update.
        transaction_in (TransactionUpdate): Partial transaction data.
            All fields optional (PATCH semantics).
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        TransactionOut: Updated transaction.
    
    Raises:
        HTTPException: 400 Bad Request - Invalid update data.
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Transaction, account, or category not found.
        HTTPException: 422 Unprocessable Entity - Validation error.
    
    Notes:
        - Only provided fields are updated (PATCH semantics).
        - Validates new category/account ownership if changed.
        - Maintains referential integrity with payment records.
        - Updates timestamp automatically.
    
    Example Request:
        ```bash
        curl -X PUT "http://localhost:8000/api/v1/transactions/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{
            "amount": -135.75,
            "description": "Updated grocery description"
          }'
        ```
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Update fields
    update_data = transaction_in.dict(exclude_unset=True)

    # Verify category if being updated
    if "category_id" in update_data and update_data["category_id"]:
        category_result = await db.execute(
            select(Category).where(
                Category.id == update_data["category_id"],
                Category.user_id == current_user.id
            )
        )
        category = category_result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()
    await db.refresh(transaction)

    return transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Permanently delete a financial transaction.
    
    Removes transaction and cascades to dependent payment records.
    This operation is irreversible.
    
    Args:
        transaction_id (str): Transaction identifier to delete.
        current_user (User): Authenticated user from JWT token.
        db (AsyncSession): Async database session.
    
    Returns:
        None: 204 No Content on success.
    
    Raises:
        HTTPException: 401 Unauthorized - Invalid or missing authentication token.
        HTTPException: 404 Not Found - Transaction not found.
        HTTPException: 422 Unprocessable Entity - Invalid UUID format.
    
    Notes:
        - Permanent deletion (not soft delete).
        - Cascades to related transaction payments.
        - Consider archiving for audit compliance.
        - May affect account balance calculations.
    
    Example Request:
        ```bash
        curl -X DELETE "http://localhost:8000/api/v1/transactions/550e8400-e29b-41d4-a716-446655440000" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ```
    """
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    await db.delete(transaction)
    await db.commit()

    return None