import sys
import os

def test_imports():
    """Test all critical imports."""
    print("Testing imports...")
    
    # Test 1: Minimal validator
    try:
        from app.core.minimal_validator import run_all_checks
        print("✅ Minimal validator imports")
    except Exception as e:
        print(f"❌ Minimal validator: {e}")
        return False
    
    # Test 2: Basic models
    try:
        from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary
        print("✅ Income models import")
    except Exception as e:
        print(f"❌ Income models: {e}")
        return False
    
    # Test 3: Check for syntax errors in validator
    validator_path = "app/core/minimal_validator.py"
    if os.path.exists(validator_path):
        with open(validator_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'IncomeMonthlyS ummary' in content:
                print("❌ Found space in 'IncomeMonthlyS ummary'")
                return False
            else:
                print("✅ No syntax errors in validator")
    
    return True

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    if test_imports():
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)