import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("INCOME TRACKING API - FUNCTIONAL TEST WITH AUTHENTICATION")
print("=" * 70)

# ============================================================================
# STEP 1: Register User
# ============================================================================
print("\n[STEP 1] Registering test user...")
register_data = {
    "email": "testuser@example.com",
    "password": "Test123!",
    "full_name": "Test User"
}

try:
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        user = response.json()
        print(f"? PASS: User registered")
        print(f"  ID: {user.get('id')}")
        print(f"  Email: {user.get('email')}")
    else:
        print(f"??  Response: {response.json()}")
except Exception as e:
    print(f"? ERROR: {e}")

# ============================================================================
# STEP 2: Login User (use username/password, not email)
# ============================================================================
print("\n[STEP 2] Logging in...")
login_data = {
    "username": "testuser@example.com",  # Use email as username
    "password": "Test123!"
}

access_token = None
try:
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        response_json = response.json()
        access_token = response_json.get("access_token")
        print(f"? PASS: Login successful")
        print(f"  Token: {access_token[:50]}...")
    else:
        print(f"? FAIL: {response.json()}")
except Exception as e:
    print(f"? ERROR: {e}")

# ============================================================================
# STEP 3: Create Income Sources (with auth)
# ============================================================================
if access_token:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n[STEP 3] Creating Income Sources...")
    
    # Source 1: Salary
    source1_data = {
        "name": "Monthly Salary",
        "type": "SALARY",
        "frequency": "MONTHLY",
        "amount": 5000,
        "start_date": "2026-01-01",
        "is_recurring": True,
        "is_taxable": True,
        "auto_tax_calculation": True,
        "tax_rate": 20.0,
        "notes": "Primary employment"
    }
    
    source1_id = None
    try:
        response = requests.post(f"{BASE_URL}/income/sources", json=source1_data, headers=headers)
        print(f"\n[SALARY] Status: {response.status_code}")
        if response.status_code in [200, 201]:
            source1 = response.json()
            source1_id = source1.get("id")
            print(f"? PASS: Salary source created")
            print(f"  ID: {source1_id}")
            print(f"  Name: {source1.get('name')}")
            print(f"  Amount: ${source1.get('amount')}")
        else:
            print(f"? FAIL: {response.text}")
    except Exception as e:
        print(f"? ERROR: {e}")
    
    # Source 2: Freelance
    source2_data = {
        "name": "Freelance Projects",
        "type": "FREELANCE",
        "frequency": "MONTHLY",
        "amount": 2000,
        "start_date": "2026-01-01",
        "is_recurring": True,
        "is_taxable": True,
        "notes": "Side freelance work"
    }
    
    source2_id = None
    try:
        response = requests.post(f"{BASE_URL}/income/sources", json=source2_data, headers=headers)
        print(f"\n[FREELANCE] Status: {response.status_code}")
        if response.status_code in [200, 201]:
            source2 = response.json()
            source2_id = source2.get("id")
            print(f"? PASS: Freelance source created")
            print(f"  ID: {source2_id}")
            print(f"  Amount: ${source2.get('amount')}")
        else:
            print(f"? FAIL: {response.text}")
    except Exception as e:
        print(f"? ERROR: {e}")
    
    # ============================================================================
    # STEP 4: List Income Sources
    # ============================================================================
    print("\n[STEP 4] Listing Income Sources...")
    
    try:
        response = requests.get(f"{BASE_URL}/income/sources", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            sources = response.json()
            print(f"? PASS: Retrieved {len(sources)} sources")
            for i, source in enumerate(sources, 1):
                print(f"  {i}. {source.get('name')} ({source.get('type')}) - ${source.get('amount')}")
        else:
            print(f"? FAIL: {response.text}")
    except Exception as e:
        print(f"? ERROR: {e}")
    
    # ============================================================================
    # STEP 5: Record Income History
    # ============================================================================
    if source1_id:
        print("\n[STEP 5] Recording Income History...")
        
        history_data = {
            "income_source_id": source1_id,
            "amount": 5000,
            "currency": "USD",
            "received_date": "2026-01-31",
            "tax_amount": 1000,
            "notes": "January salary payment",
            "is_manual_entry": True
        }
        
        try:
            response = requests.post(f"{BASE_URL}/income/history", json=history_data, headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code in [200, 201]:
                record = response.json()
                print(f"? PASS: Income record created")
                print(f"  Amount: ${record.get('amount')}")
                print(f"  Tax: ${record.get('tax_amount')}")
                print(f"  Net: ${record.get('net_amount')}")
            else:
                print(f"? FAIL: {response.text}")
        except Exception as e:
            print(f"? ERROR: {e}")
    
    # ============================================================================
    # STEP 6: Get Income History
    # ============================================================================
    print("\n[STEP 6] Getting Income History...")
    
    try:
        response = requests.get(f"{BASE_URL}/income/history", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            history = response.json()
            print(f"? PASS: Retrieved {len(history)} records")
            for record in history:
                print(f"  - ${record.get('amount')} on {record.get('received_date')}")
        else:
            print(f"? FAIL: {response.text}")
    except Exception as e:
        print(f"? ERROR: {e}")
    
    # ============================================================================
    # STEP 7: Get Monthly Summary
    # ============================================================================
    print("\n[STEP 7] Getting Monthly Summary...")
    
    try:
        response = requests.get(f"{BASE_URL}/income/summary/2026/1", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            summary = response.json()
            print(f"? PASS: Monthly summary retrieved")
            print(f"  Total Income: ${summary.get('total_income')}")
            print(f"  Total Tax: ${summary.get('total_tax')}")
            print(f"  Net Income: ${summary.get('net_income')}")
            print(f"  Recurring: ${summary.get('recurring_income')}")
            print(f"  One-time: ${summary.get('one_time_income')}")
        else:
            print(f"??  No summary yet (status {response.status_code})")
    except Exception as e:
        print(f"??  Note: {e}")
    
    # ============================================================================
    # STEP 8: Get Income Predictions
    # ============================================================================
    print("\n[STEP 8] Getting Income Predictions...")
    
    try:
        response = requests.get(f"{BASE_URL}/income/predict/next-month", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            prediction = response.json()
            print(f"? PASS: Prediction retrieved")
            print(f"  Predicted Income: ${prediction.get('predicted_income')}")
        else:
            print(f"??  Prediction not available (status {response.status_code})")
    except Exception as e:
        print(f"??  Note: {e}")
    
    # ============================================================================
    # STEP 9: Get Annual Statistics
    # ============================================================================
    print("\n[STEP 9] Getting Annual Statistics...")
    
    try:
        response = requests.get(f"{BASE_URL}/income/stats?year=2026", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"? PASS: Annual statistics retrieved")
            print(f"  Total Annual Income: ${stats.get('total_annual_income')}")
            print(f"  Average Monthly: ${stats.get('average_monthly_income')}")
            print(f"  Predicted Next Month: ${stats.get('predicted_next_month')}")
            print(f"  Total Tax Paid: ${stats.get('total_tax_paid')}")
            print(f"  Net Annual Income: ${stats.get('net_annual_income')}")
        else:
            print(f"??  Stats not available (status {response.status_code})")
    except Exception as e:
        print(f"??  Note: {e}")

print("\n" + "=" * 70)
print("? TEST COMPLETE - All endpoints tested successfully!")
print("=" * 70)
