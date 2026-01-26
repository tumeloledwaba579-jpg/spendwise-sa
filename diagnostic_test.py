import sys
print("Python version:", sys.version)
print("Python path:", sys.path)

try:
    # Test the exact import that's failing
    exec("from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary")
    print("SUCCESS: Direct exec works")
    
    # Now try importing the validator module
    from app.core.schema_model_validator import check_schema_model_alignment
    print("SUCCESS: Validator module imports successfully")
except SyntaxError as e:
    print(f"SYNTAX ERROR: {e}")
    print(f"At line: {e.lineno}")
except Exception as e:
    print(f"OTHER ERROR: {type(e).__name__}: {e}")
