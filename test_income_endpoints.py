import requests 
import json

print("🔍 Testing Income Endpoints")
print("=" * 40)

base_url = "http://localhost:8000"
session = requests.Session()

# 1. Login
print("\n📝 Step 1: Logging in...")
login_data = {"email": "tumeloledwaba579@gmail.com", "password": "Tumelogeorge@579"}
login_resp = session.post(f"{base_url}/api/v1/auth/login", json=login_data)

if login_resp.status_code != 200:
    print(f"❌ Login failed: {login_resp.text}")
    exit(1)

print("✅ Login successful")
print(f"   Cookies: {session.cookies.get_dict()}")

# 2. Test /auth/me to verify auth works
print("\n📝 Step 2: Testing /auth/me...")
me_resp = session.get(f"{base_url}/api/v1/auth/me")
print(f"   Status: {me_resp.status_code}")
if me_resp.status_code == 200:
    print(f"   User: {me_resp.json()}")
else:
    print(f"❌ Auth failed: {me_resp.text}")

# 3. Test income stats
print("\n📝 Step 3: Testing /income/stats...")
stats_resp = session.get(f"{base_url}/api/v1/income/stats?year=2026")
print(f"   Status: {stats_resp.status_code}")
if stats_resp.status_code == 200:
    print(f"   Response: {json.dumps(stats_resp.json(), indent=2)}")
else:
    print(f"❌ Error: {stats_resp.text}")

# 4. Test income summary
print("\n📝 Step 4: Testing /income/summary/2026/3...")
summary_resp = session.get(f"{base_url}/api/v1/income/summary/2026/3")
print(f"   Status: {summary_resp.status_code}")
if summary_resp.status_code == 200:
    print(f"   Response: {json.dumps(summary_resp.json(), indent=2)}")
else:
    print(f"❌ Error: {summary_resp.text}")

print("\n" + "=" * 40)