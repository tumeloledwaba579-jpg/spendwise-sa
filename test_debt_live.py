"""
Quick test script for debt endpoints.
Run this in a separate terminal while server is running.
"""
import asyncio
import httpx
import json
from datetime import datetime

async def test_debt_endpoints():
    """Test all debt endpoints."""
    base_url = "http://localhost:8000/api/v1/debts"
    headers = {
        "Authorization": "Bearer YOUR_TOKEN_HERE",  # Replace with actual token
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        print("?? Testing Debt Module Endpoints...")
        print("=" * 50)
        
        # 1. List current debts (should be empty initially)
        print("\n1. Testing GET /accounts...")
        try:
            response = await client.get(f"{base_url}/accounts", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                debts = response.json()
                print(f"   Found {len(debts)} existing debt(s)")
        except Exception as e:
            print(f"   Error: {e}")
        
        # 2. Create a test debt
        print("\n2. Testing POST /accounts...")
        test_debt = {
            "name": "Test Credit Card",
            "type": "CREDIT_CARD",
            "current_balance": "1500.00",
            "interest_rate": "19.99",
            "credit_limit": "5000.00",
            "minimum_payment": "75.00",
            "due_date": 15,
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "notes": "Test debt for validation"
        }
        
        try:
            response = await client.post(
                f"{base_url}/accounts",
                json=test_debt,
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 201:
                created_debt = response.json()
                print(f"   ? Created debt: {created_debt['name']}")
                debt_id = created_debt['id']
            else:
                print(f"   Response: {response.text}")
                debt_id = None
        except Exception as e:
            print(f"   Error: {e}")
            debt_id = None
        
        # 3. Get summary
        print("\n3. Testing GET /summary...")
        try:
            response = await client.get(f"{base_url}/summary", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                summary = response.json()
                print(f"   Total Debt: ${summary.get('total_debt', 0)}")
                print(f"   Active Accounts: {summary.get('active_accounts', 0)}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # 4. Test payoff strategy
        print("\n4. Testing GET /payoff-strategy...")
        try:
            response = await client.get(
                f"{base_url}/payoff-strategy?strategy_type=SNOWBALL",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                strategy = response.json()
                print(f"   Strategy: {strategy.get('strategy_type', 'N/A')}")
                print(f"   Estimated Months: {strategy.get('estimated_total_months', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 50)
        print("? Debt module testing complete!")
        print("?? Tip: Check Swagger UI for complete API documentation")

if __name__ == "__main__":
    asyncio.run(test_debt_endpoints())
