#!/bin/bash
echo "=== Verification Script ==="

# Check Alembic state
echo -e "\n1. Alembic State:"
alembic heads
echo -e "\nCurrent:"
alembic current

# Check if the syntax error is fixed
echo -e "\n2. Checking for syntax errors..."
cd /app
python -m py_compile app/core/schema_model_validator.py
if [ $? -eq 0 ]; then
    echo "✅ No syntax errors in validator"
    
    # Check the specific line
    LINE_112=$(sed -n '112p' app/core/schema_model_validator.py)
    echo "Line 112: $LINE_112"
    if [[ $LINE_112 == *"IncomeMonthlySummary"* ]]; then
        echo "✅ Correct class name without space"
    else
        echo "❌ Still has space issue"
    fi
else
    echo "❌ Syntax errors found"
fi

# Test the import
echo -e "\n3. Testing imports..."
python -c "
try:
    from app.models.income import IncomeMonthlySummary
    print('✅ IncomeMonthlySummary imports successfully')
    print(f'   Class: {IncomeMonthlySummary}')
except SyntaxError as e:
    print(f'❌ SyntaxError: {e}')
except Exception as e:
    print(f'❌ Import error: {type(e).__name__}: {e}')
"

echo -e "\n=== Verification Complete ==="