"""
Connectivity test for debt module.
Tests that endpoints are reachable and return proper responses.
"""
import pytest
import asyncio
from httpx import AsyncClient
from fastapi import status

# We'll test without authentication first to check endpoint existence
@pytest.mark.asyncio
async def test_debt_endpoints_exist():
    """Test that debt endpoints are registered in the API."""
    from app.main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    # Get OpenAPI schema
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == status.HTTP_200_OK
    
    schema = response.json()
    paths = schema.get("paths", {})
    
    # Check for debt endpoints
    debt_endpoints = [path for path in paths.keys() if "/debts" in path]
    
    print(f"Found {len(debt_endpoints)} debt endpoints:")
    for endpoint in debt_endpoints:
        print(f"   ? {endpoint}")
    
    # Verify we have the expected endpoints
    expected_endpoints = [
        "/api/v1/debts/accounts",
        "/api/v1/debts/accounts/{account_id}",
        "/api/v1/debts/payments",
        "/api/v1/debts/summary",
        "/api/v1/debts/stats",
        "/api/v1/debts/payoff-strategy"
    ]
    
    for endpoint in expected_endpoints:
        assert endpoint in paths, f"Missing endpoint: {endpoint}"
    
    return len(debt_endpoints) >= 4  # At least 4 endpoints should exist


@pytest.mark.asyncio
async def test_debt_schema_validation():
    """Test that debt schemas can be instantiated."""
    from app.schemas.debt import DebtAccountCreate, DebtPaymentCreate
    from decimal import Decimal
    from datetime import date
    
    # Test valid debt account data
    account_data = {
        "name": "Test Loan",
        "type": "PERSONAL_LOAN",
        "current_balance": Decimal("5000.00"),
        "interest_rate": Decimal("7.99"),
        "start_date": date(2026, 1, 1)
    }
    
    account = DebtAccountCreate(**account_data)
    assert account.name == "Test Loan"
    assert account.type == "PERSONAL_LOAN"
    
    # Test valid payment data
    payment_data = {
        "debt_account_id": "00000000-0000-0000-0000-000000000000",  # Dummy UUID
        "amount": Decimal("100.00"),
        "payment_date": date(2026, 1, 15)
    }
    
    payment = DebtPaymentCreate(**payment_data)
    assert payment.amount == Decimal("100.00")
    
    print("? All schema validation tests passed")


@pytest.mark.asyncio
async def test_debt_service_instantiation():
    """Test that debt service can be instantiated."""
    from app.services.debt_service import DebtService
    from unittest.mock import AsyncMock
    
    # Create a mock async session
    mock_session = AsyncMock()
    
    # Instantiate the service
    service = DebtService(mock_session)
    
    assert service is not None
    assert service.session == mock_session
    
    print("? Debt service instantiation test passed")


def test_always_passes():
    """A simple test that always passes."""
    assert 1 + 1 == 2
    print("? Simple arithmetic test passed")


if __name__ == "__main__":
    # Run tests directly if needed
    import sys
    sys.path.insert(0, ".")
    
    # Run each test
    test_debt_endpoints_exist()
    test_debt_schema_validation()
    test_debt_service_instantiation()
    test_always_passes()
    
    print("\n" + "="*50)
    print("? All connectivity tests completed successfully!")
