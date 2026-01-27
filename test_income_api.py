import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("INCOME TRACKING API - CLEAN TEST")
print("=" * 70)

# Use unique email for each test run
import time
unique_id = int(time.time())
email = f"testuser{unique_id}@example.com"

print(f"\n[STEP 1] Registering test user: {email}")
register_data = {
    "email": email,
    "password": "Test123!",
    "full_name": "Test User"
}

try:
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        user = response.json()
        print(f"? PASS: User registered")
    else:
        print(f"Response: {response.json()}")
except Exception as e:
    print(f"ERROR: {e}")

print(f"\n[STEP 2] Logging in...")
login_data = {
    "username": email,
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
    else:
        print(f"ERROR: {response.json()}")
except Exception as e:
    print(f"ERROR: {e}")

if access_token:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("\n[STEP 3] Creating Income Sources...")
    
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
            print(f"? PASS: Salary source created (ID: {source1_id})")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
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
            print(f"? PASS: Freelance source created (ID: {source2_id})")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("\n[STEP 4] Listing Income Sources...")
    try:
        response = requests.get(f"{BASE_URL}/income/sources", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            sources = response.json()
            print(f"? PASS: Retrieved {len(sources)} sources")
            if len(sources) == 2:
                print(f"? CORRECT COUNT: Expected 2, got {len(sources)}")
            else:
                print(f"? WRONG COUNT: Expected 2, got {len(sources)}")
            for i, source in enumerate(sources, 1):
                print(f"  {i}. {source.get('name')} ({source.get('type')}) - ${source.get('amount')}")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
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
                print(f"ERROR: {response.text}")
        except Exception as e:
            print(f"ERROR: {e}")
    
    print("\n[STEP 6] Getting Income History...")
    try:
        response = requests.get(f"{BASE_URL}/income/history", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            history = response.json()
            print(f"? PASS: Retrieved {len(history)} records")
            if len(history) == 1:
                print(f"? CORRECT COUNT: Expected 1, got {len(history)}")
            else:
                print(f"??  EXPECTED 1, got {len(history)}")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("\n[STEP 7] Getting Monthly Summary...")
    try:
        response = requests.get(f"{BASE_URL}/income/summary/2026/1", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            summary = response.json()
            print(f"? PASS: Monthly summary retrieved")
            print(f"  Total Income: ${summary.get('total_income')}")
            if summary.get('total_income') == 5000:
                print(f"  ? CORRECT: Total is $5000")
            else:
                print(f"  ??  Expected $5000, got ${summary.get('total_income')}")
            print(f"  Total Tax: ${summary.get('total_tax')}")
            print(f"  Net Income: ${summary.get('net_income')}")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("\n[STEP 8] Getting Income Predictions...")
    try:
        response = requests.get(f"{BASE_URL}/income/predict/next-month", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            prediction = response.json()
            print(f"? PASS: Prediction retrieved")
            print(f"  Predicted Income: ${prediction.get('predicted_income')}")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("\n[STEP 9] Getting Annual Statistics...")
    try:
        response = requests.get(f"{BASE_URL}/income/stats?year=2026", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"? PASS: Annual statistics retrieved")
            print(f"  Total Annual Income: ${stats.get('total_annual_income')}")
            if stats.get('total_annual_income') == 5000:
                print(f"  ? CORRECT: Total is $5000")
            else:
                print(f"  ??  Expected $5000, got ${stats.get('total_annual_income')}")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

print("\n" + "=" * 70)
print("? TEST COMPLETE")
print("=" * 70)
