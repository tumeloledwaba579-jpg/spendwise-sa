import requests
import sys

print("🔍 DEBUGGING ACCOUNTS ENDPOINT")
print("="*50)

session = requests.Session()
base_url = "http://127.0.0.1:8000"

# 1. Login
print("\n📝 Step 1: Logging in...")
login_data = {"email": "tumeloledwaba579@gmail.com", "password": "Tumelogeorge@579"}
login_resp = session.post(f"{base_url}/api/v1/auth/login", json=login_data)
print(f"   Login status: {login_resp.status_code}")

if login_resp.status_code != 200:
    print("❌ Login failed!")
    sys.exit(1)

print("✅ Login successful")

# 2. Check cookies
print("\n🍪 Cookies after login:")
for cookie in session.cookies:
    print(f"   {cookie.name}: {cookie.value[:30]}...")

# 3. Try categories (which works)
print("\n📝 Step 2: Testing /categories...")
cat_resp = session.get(f"{base_url}/api/v1/categories")
print(f"   Categories status: {cat_resp.status_code}")
if cat_resp.status_code == 200:
    print(f"   Found {len(cat_resp.json())} categories")

# 4. Try accounts with various URL patterns
print("\n📝 Step 3: Testing /accounts (no trailing slash)...")
acc_resp1 = session.get(f"{base_url}/api/v1/accounts")
print(f"   Status: {acc_resp1.status_code}")
if acc_resp1.status_code != 200:
    print(f"   Response: {acc_resp1.text}")

print("\n📝 Step 4: Testing /accounts/ (with trailing slash)...")
acc_resp2 = session.get(f"{base_url}/api/v1/accounts/")
print(f"   Status: {acc_resp2.status_code}")
if acc_resp2.status_code != 200:
    print(f"   Response: {acc_resp2.text}")

# 5. Check if the session is still valid
print("\n📝 Step 5: Testing /auth/me again...")
me_resp = session.get(f"{base_url}/api/v1/auth/me")
print(f"   /me status: {me_resp.status_code}")
if me_resp.status_code == 200:
    print(f"   User: {me_resp.json()['email']}")

print("\n" + "="*50)