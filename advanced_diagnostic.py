import sys
import os

print("=== Python Import Diagnostics ===")
print(f"Python: {sys.version}")
print(f"Current dir: {os.getcwd()}")

# Check if the problematic file exists
validator_path = "/app/app/core/schema_model_validator.py"
print(f"\nChecking file: {validator_path}")
print(f"File exists: {os.path.exists(validator_path)}")
print(f"File size: {os.path.getsize(validator_path)} bytes")

# Read and display line 112
with open(validator_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    if len(lines) >= 112:
        line_112 = lines[111]  # 0-indexed
        print(f"\nLine 112 from direct file read:")
        print(f"Content: {repr(line_112)}")
        print(f"Length: {len(line_112)}")
        
        # Check for space in IncomeMonthlyS ummary
        if 'IncomeMonthlyS ummary' in line_112:
            print("❌ FOUND: 'IncomeMonthlyS ummary' with space!")
        elif 'IncomeMonthlySummary' in line_112:
            print("✓ CORRECT: 'IncomeMonthlySummary' without space")
            
        # Show character codes
        print("\nCharacter codes (first 20 chars after 'IncomeMonthly'):")
        idx = line_112.find('IncomeMonthly')
        if idx != -1:
            for i in range(idx, min(idx + 20, len(line_112))):
                char = line_112[i]
                print(f"  Position {i}: '{char}' = U+{ord(char):04X}")
    else:
        print(f"\nFile has only {len(lines)} lines")

# Try to import and see what fails
print("\n=== Attempting imports ===")
try:
    # First try the exact line that fails
    exec("from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary")
    print("✓ Direct exec of import line works")
except SyntaxError as e:
    print(f"❌ SyntaxError: {e}")
    print(f"  File: {e.filename}")
    print(f"  Line: {e.lineno}")
    print(f"  Text: {e.text}")
except Exception as e:
    print(f"❌ Other error: {type(e).__name__}: {e}")

# Check Python's import system
print("\n=== Python import system ===")
import importlib
import importlib.util

spec = importlib.util.spec_from_file_location("schema_model_validator", validator_path)
if spec:
    print(f"Module spec created successfully")
    print(f"Loader: {spec.loader}")
else:
    print("Failed to create module spec")
