"""
Tests for debt API endpoints.
"""
import pytest
from httpx import AsyncClient
from decimal import Decimal
from datetime import date
import uuid


class TestDebtAPI:
    """Test suite for debt endpoints."""

    @pytest.mark.asyncio
    async def test_create_debt_account(self, async_client: AsyncClient, test_user_token: dict):
        """Test creating a new debt account."""
        headers = {"Authorization": f"Bearer {test_user_token['access_token']}"}
        data = {
            "name": "Chase Credit Card",
            "type": "CREDIT_CARD",
            "current_balance": "5000.00",
            "interest_rate": "19.99",
            "credit_limit": "10000.00",
            "minimum_payment": "150.00",
            "due_date": 15,
            "start_date": "2026-01-01",
            "notes": "Primary credit card"
        }
        
        response = await async_client.post("/api/v1/debts/accounts", json=data, headers=headers)
        assert response.status_code == 201
        result = response.json()
        assert result["name"] == data["name"]
        assert result["current_balance"] == data["current_balance"]
        assert result["is_active"] is True

    @pytest.mark.asyncio
    async def test_list_debt_accounts(self, async_client: AsyncClient, test_user_token: dict):
        """Test listing debt accounts."""
        headers = {"Authorization": f"Bearer {test_user_token['access_token']}"}
        response = await async_client.get("/api/v1/debts/accounts", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_debt_summary(self, async_client: AsyncClient, test_user_token: dict):
        """Test getting debt summary."""
        headers = {"Authorization": f"Bearer {test_user_token['access_token']}"}
        response = await async_client.get("/api/v1/debts/summary", headers=headers)
        assert response.status_code == 200
        result = response.json()
        assert "total_debt" in result
        assert "account_count" in result

    @pytest.mark.asyncio
    async def test_get_payoff_strategy(self, async_client: AsyncClient, test_user_token: dict):
        """Test getting payoff strategy."""
        headers = {"Authorization": f"Bearer {test_user_token['access_token']}"}
        response = await async_client.get(
            "/api/v1/debts/payoff-strategy?strategy_type=SNOWBALL",
            headers=headers
        )
        assert response.status_code == 200
        result = response.json()
        assert "strategy_type" in result
        assert "accounts_in_order" in result
