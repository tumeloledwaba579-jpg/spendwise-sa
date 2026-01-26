import sys
import os

print("=== Verification Script ===")
print(f"Python: {sys.version}")
print(f"Current dir: {os.getcwd()}")

# Test 1: Check the validator file
validator_path = "app/core/schema_model_validator.py"
print(f"\n1. Checking validator file: {validator_path}")
print(f"   Exists: {os.path.exists(validator_path)}")

with open(validator_path, 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[110:116], 111):  # Check around line 112
        print(f"   Line {i}: {line.rstrip()}")
        if 'IncomeMonthlyS ummary' in line:
            print(f"   ❌ ERROR: Found space in 'IncomeMonthlyS ummary' at line {i}")

# Test 2: Check main.py
main_path = "app/main.py"
print(f"\n2. Checking main.py startup_validation function")
with open(main_path, 'r') as f:
    content = f.read()
    if 'CLEAR PYTHON CACHE' in content:
        print("   ✅ Cache clearing code found")
    else:
        print("   ❌ Cache clearing code NOT found")

# Test 3: Try importing
print(f"\n3. Testing imports...")
try:
    exec("from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary")
    print("   ✅ Direct import works")
except SyntaxError as e:
    print(f"   ❌ SyntaxError: {e}")

try:
    from app.core.schema_model_validator import check_schema_model_alignment
    print("   ✅ Validator import works")
except Exception as e:
    print(f"   ❌ Validator import failed: {type(e).__name__}: {e}")

print("\n=== Verification Complete ===")
