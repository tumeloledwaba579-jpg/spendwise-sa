import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.payment_method_service import PaymentMethodService
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodOut
from app.api.deps import get_current_user  # We'll create this later

router = APIRouter()

@router.post("/", response_model=PaymentMethodOut, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_method_in: PaymentMethodCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new payment method for the current user."""
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
):
    """Get all payment methods for the current user."""
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
):
    """Get a specific payment method by ID."""
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
):
    """Update a payment method."""
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
):
    """Delete a payment method."""
    success = await PaymentMethodService.delete_payment_method(
        session=session,
        user_id=current_user.id,
        payment_method_id=payment_method_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    return None
