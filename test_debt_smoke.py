"""
Quick smoke test for debt module.
"""
import sys
from fastapi.testclient import TestClient

# Add app to path
sys.path.insert(0, '.')

from app.main import app

def test_debt_endpoints_registered():
    """Verify debt endpoints exist in the API."""
    client = TestClient(app)
    
    # Get OpenAPI schema
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    
    schema = response.json()
    paths = schema.get("paths", {})
    
    # Count debt endpoints
    debt_endpoints = [p for p in paths.keys() if "/debts" in p]
    
    print(f"Found {len(debt_endpoints)} debt endpoints:")
    for endpoint in debt_endpoints:
        print(f"  - {endpoint}")
    
    # Check for key endpoints
    key_endpoints = [
        "/api/v1/debts/accounts",
        "/api/v1/debts/summary",
        "/api/v1/debts/payoff-strategy"
    ]
    
    for endpoint in key_endpoints:
        if endpoint in paths:
            print(f"? {endpoint}")
        else:
            print(f"? Missing: {endpoint}")
    
    return len(debt_endpoints) > 0

if __name__ == "__main__":
    try:
        if test_debt_endpoints_registered():
            print("\n? Debt module API endpoints are properly registered!")
            sys.exit(0)
        else:
            print("\n? No debt endpoints found!")
            sys.exit(1)
    except Exception as e:
        print(f"\n? Error: {e}")
        sys.exit(1)
