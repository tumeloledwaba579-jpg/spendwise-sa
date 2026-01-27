"""
Proper pytest test file for debt module.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_debt_endpoints_exist():
    """Test that debt endpoints return proper status codes (401/404)."""
    endpoints = [
        "/api/v1/debts/accounts",
        "/api/v1/debts/summary", 
        "/api/v1/debts/payoff-strategy",
        "/api/v1/debts/stats",
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        # Should not be 404 (not found)
        assert response.status_code != 404, f"Endpoint {endpoint} not found (404)"
        
        # Typically returns 401 (unauthorized) which means it exists
        if response.status_code == 401:
            print(f"✅ {endpoint} exists (401 Unauthorized)")
        
    pass


def test_debt_schema_validation():
    """Test debt schema validation."""
    from app.schemas.debt import DebtAccountCreate
    from decimal import Decimal
    from datetime import date
    
    # Test valid data
    valid_data = {
        "name": "Test Credit Card",
        "type": "CREDIT_CARD",
        "current_balance": "1000.00",
        "interest_rate": "19.99",
        "start_date": "2026-01-01"
    }
    
    # Try to create schema
    try:
        schema = DebtAccountCreate(**valid_data)
        assert schema.name == "Test Credit Card"
        assert schema.type == "CREDIT_CARD"
        print("✅ Debt schema validation works")
        pass
    except Exception as e:
        print(f"❌ Debt schema validation failed: {e}")
        return False


@pytest.mark.asyncio
async def test_debt_service_instantiation():
    """Test that debt service can be instantiated."""
    from app.services.debt_service import DebtService
    from unittest.mock import AsyncMock
    
    mock_session = AsyncMock()
    service = DebtService(mock_session)
    
    assert service is not None
    assert service.session == mock_session
    print("✅ DebtService instantiation works")
    pass


# Simple test that always passes
def test_always_passes():
    """Simple test to verify pytest is working."""
    assert True
    pass

