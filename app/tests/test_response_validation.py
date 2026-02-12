"""
Test that POST endpoints return valid responses without 500 errors.
Ensures the fix doesn't regress.
"""

import pytest
import httpx
from app.main import app

@pytest.mark.asyncio
async def test_account_creation_response_validation():
    """POST /accounts should return 201 with valid response"""
    # Setup: Create user, get token
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Register
        resp = await client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "Test1234!",
            "full_name": "Test User"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test account creation
        resp = await client.post("/api/v1/accounts/", 
            json={
                "name": "Test",
                "account_type": "CHECKING",
                "currency": "USD",
                "balance": "100.00",
                "is_active": True
            },
            headers=headers
        )
        
        # CRITICAL: Should not be 500
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        
        # CRITICAL: Response should be valid JSON with required fields
        data = resp.json()
        required_fields = ['id', 'user_id', 'name', 'account_type', 'balance', 'currency', 'is_active', 'created_at']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # CRITICAL: Enum should be serialized as string
        assert isinstance(data['account_type'], str)
        assert data['account_type'] == 'CHECKING'

@pytest.mark.asyncio
async def test_category_creation_response_validation():
    """POST /categories should return 201 with valid response"""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Setup
        resp = await client.post("/api/v1/auth/register", json={
            "email": "test2@example.com",
            "password": "Test1234!",
            "full_name": "Test User"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test category creation
        resp = await client.post("/api/v1/categories/",
            json={
                "name": "Groceries",
                "category_type": "EXPENSE",
                "is_active": True,
                "display_order": 0
            },
            headers=headers
        )
        
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        required_fields = ['id', 'user_id', 'name', 'category_type', 'is_active', 'display_order', 'is_system', 'created_at']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert isinstance(data['category_type'], str)
        assert data['category_type'] == 'EXPENSE'
        assert isinstance(data['is_system'], bool)

@pytest.mark.asyncio
async def test_payment_method_creation_response_validation():
    """POST /payment-methods should return 201 with valid response"""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Setup
        resp = await client.post("/api/v1/auth/register", json={
            "email": "test3@example.com",
            "password": "Test1234!",
            "full_name": "Test User"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test payment method creation
        resp = await client.post("/api/v1/payment-methods/",
            json={
                "name": "Chase Card",
                "payment_type": "CREDIT_CARD",
                "last_four": "1234",
                "is_active": True,
                "is_default": False
            },
            headers=headers
        )
        
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        required_fields = ['id', 'user_id', 'name', 'payment_type', 'last_four', 'is_active', 'is_default', 'created_at']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert isinstance(data['payment_type'], str)
        assert data['payment_type'] == 'CREDIT_CARD'
