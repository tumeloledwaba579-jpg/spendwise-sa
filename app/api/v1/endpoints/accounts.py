import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.account_service import AccountService
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut
from app.api.deps import get_current_user  # We'll create this later

router = APIRouter()

@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new account for the current user."""
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
):
    """Get all accounts for the current user."""
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
):
    """Get a specific account by ID."""
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
):
    """Update an account."""
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
):
    """Delete an account."""
    success = await AccountService.delete_account(
        session=session,
        user_id=current_user.id,
        account_id=account_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    return None
