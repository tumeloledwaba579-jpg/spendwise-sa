import sys
import os

def run_tests():
    print("=== Startup Validation Diagnostic ===")
    print(f"Python: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    
    # Check if we're in the right location
    app_path = os.path.join(os.getcwd(), 'app')
    if not os.path.exists(app_path):
        print("\n⚠️  WARNING: 'app' directory not found. Changing to parent directory...")
        # Try to find the app directory
        for i in range(5):  # Look up to 5 levels up
            parent = os.path.join(os.getcwd(), '..' * (i + 1))
            if os.path.exists(os.path.join(parent, 'app')):
                os.chdir(parent)
                print(f"Changed to: {os.getcwd()}")
                break
    
    test_passed = 0
    test_total = 0
    
    # Test 1: Check file exists
    test_total += 1
    validator_path = "app/core/schema_model_validator.py"
    print(f"\n1. Checking {validator_path}")
    if os.path.exists(validator_path):
        print("   ✅ File exists")
        
        # Read with proper encoding
        try:
            with open(validator_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                lines = content.split('\n')
                
                # Check line 112 specifically
                if len(lines) >= 112:
                    line_112 = lines[111]
                    print(f"   Line 112: {repr(line_112)}")
                    
                    if 'IncomeMonthlyS ummary' in line_112:
                        print("   ❌ FOUND: Space in 'IncomeMonthlyS ummary'")
                    elif 'IncomeMonthlySummary' in line_112:
                        print("   ✅ CORRECT: 'IncomeMonthlySummary' without space")
                        test_passed += 1
                    else:
                        print("   ⚠️  WARNING: Neither pattern found")
                else:
                    print(f"   ⚠️  File has only {len(lines)} lines")
        except Exception as e:
            print(f"   ❌ Error reading file: {e}")
    else:
        print(f"   ❌ File not found")
    
    # Test 2: Check if we can import the model
    test_total += 1
    print(f"\n2. Testing model import")
    try:
        # Add app to path if needed
        if 'app' not in sys.path:
            sys.path.insert(0, 'app')
        
        from models.income import IncomeMonthlySummary
        print(f"   ✅ Successfully imported IncomeMonthlySummary")
        print(f"   Class location: {IncomeMonthlySummary.__module__}")
        test_passed += 1
    except SyntaxError as e:
        print(f"   ❌ SyntaxError: {e}")
        print(f"   At line: {e.lineno}")
        print(f"   In file: {e.filename}")
    except ImportError as e:
        print(f"   ❌ ImportError: {e}")
    except Exception as e:
        print(f"   ❌ Error: {type(e).__name__}: {e}")
    
    # Test 3: Check Docker container status
    test_total += 1
    print(f"\n3. System Status")
    print(f"   Platform: {sys.platform}")
    print(f"   Python path: {sys.executable}")
    
    # Check if we're likely in Docker
    if os.path.exists('/.dockerenv'):
        print("   ✅ Running inside Docker container")
        test_passed += 1
    else:
        print("   ℹ️  Running outside Docker (local)")
        test_passed += 1  # This is okay, just informational
    
    print(f"\n=== Results: {test_passed}/{test_total} tests passed ===")
    return test_passed == test_total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)