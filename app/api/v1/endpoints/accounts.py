"""
Account management endpoints for SpendWise API.
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.account_service import AccountService
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut
from app.api.v1.deps_cookie import get_current_user  # CRITICAL: Must match categories.py

# ============================================================================
# ROUTER CONFIGURATION - WITH PREFIX
# ============================================================================
router = APIRouter(prefix="/accounts", tags=["accounts"])

# ============================================================================
# TEST ENDPOINT - NO AUTH REQUIRED
# ============================================================================
@router.get("/ping", include_in_schema=False)
async def ping():
    """
    Simple ping endpoint to test if routing works.
    """
    print("✅ PING ENDPOINT HIT!")
    return JSONResponse(content={"message": "pong", "status": "ok"})

# ============================================================================
# PUBLIC REDIRECT - Handles /accounts (no trailing slash)
# ============================================================================
@router.get("", include_in_schema=False)
async def redirect_to_trailing_slash():
    """
    Redirect /accounts to /accounts/ without authentication.
    This prevents 307 redirects from losing cookies.
    """
    print("🔄 Redirecting /accounts to /accounts/")
    return RedirectResponse(url="/api/v1/accounts/", status_code=307)

# ============================================================================
# GET ALL ACCOUNTS (WITH TRAILING SLASH)
# ============================================================================
@router.get("/", response_model=List[AccountOut])
async def read_accounts(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> List[AccountOut]:
    """
    Retrieve paginated list of user's financial accounts.
    """
    print(f"🔍 accounts.read_accounts called by user: {current_user.id}")
    
    accounts = await AccountService.get_accounts(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    print(f"   Found {len(accounts)} accounts")
    return accounts

# ============================================================================
# CREATE ACCOUNT
# ============================================================================
@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Create a new financial account for the authenticated user.
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

# ============================================================================
# GET SINGLE ACCOUNT
# ============================================================================
@router.get("/{account_id}", response_model=AccountOut)
async def read_account(
    account_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Retrieve a specific financial account by ID.
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

# ============================================================================
# UPDATE ACCOUNT
# ============================================================================
@router.put("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: uuid.UUID,
    account_in: AccountUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> AccountOut:
    """
    Update an existing financial account.
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

# ============================================================================
# DELETE ACCOUNT
# ============================================================================
@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: uuid.UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a financial account.
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