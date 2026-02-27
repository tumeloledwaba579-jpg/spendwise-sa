# diagnose.py
import sys
import os
import importlib

print("="*60)
print("🔍 SPENDWISE DIAGNOSTIC TOOL")
print("="*60)

# Check Python
print(f"\n📌 Python: {sys.version}")
print(f"📌 Path: {sys.executable}")

# Check working directory
print(f"\n📌 Working dir: {os.getcwd()}")

# Check if we can import app
try:
    import app
    print(f"✅ app module found at: {app.__file__}")
except ImportError as e:
    print(f"❌ Cannot import app: {e}")

# Check all endpoint modules
endpoints = [
    'app.api.v1.endpoints.accounts',
    'app.api.v1.endpoints.auth',
    'app.api.v1.endpoints.budgets',
    'app.api.v1.endpoints.categories',
    'app.api.v1.endpoints.payment_methods',
    'app.api.v1.endpoints.transactions',
    'app.api.v1.endpoints.transaction_payments',
    'app.api.v1.endpoints.income',
    'app.api.v1.endpoints.debt'
]

print("\n📌 Checking endpoint modules:")
for endpoint in endpoints:
    try:
        module = importlib.import_module(endpoint)
        if hasattr(module, 'router'):
            routes = getattr(module.router, 'routes', [])
            print(f"✅ {endpoint}: router with {len(routes)} routes")
        else:
            print(f"⚠️ {endpoint}: no router attribute")
    except Exception as e:
        print(f"❌ {endpoint}: {e}")

# Check FastAPI version
try:
    import fastapi
    print(f"\n✅ FastAPI version: {fastapi.__version__}")
except ImportError:
    print("\n❌ FastAPI not installed")

# Check Pydantic version
try:
    import pydantic
    print(f"✅ Pydantic version: {pydantic.__version__}")
except ImportError:
    print("❌ Pydantic not installed")

print("\n" + "="*60)