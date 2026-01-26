print("=== Final Validation Test ===")

# Test 1: Import the validator
try:
    from app.core.schema_model_validator import run_all_checks
    print("✅ Validator imports successfully")
except Exception as e:
    print(f"❌ Validator import failed: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Check the specific line
import os
with open("app/core/schema_model_validator.py", "r") as f:
    lines = f.readlines()
    if len(lines) >= 112:
        line = lines[111].rstrip()
        print(f"\nLine 112: {repr(line)}")
        if 'IncomeMonthlySummary' in line and 'IncomeMonthlyS ummary' not in line:
            print("✅ Line 112 is correct")
        else:
            print("❌ Line 112 has issues")

# Test 3: Try to run the checks
print("\nTrying to run checks...")
try:
    run_all_checks()
    print("✅ All checks passed!")
except Exception as e:
    print(f"❌ Checks failed: {e}")