"""
Minimal startup validation without complex imports.
"""
import sys
import os

def run_all_checks():
    """Run essential startup checks without problematic imports."""
    print("\n" + "="*60)
    print("ESSENTIAL STARTUP CHECKS")
    print("="*60 + "\n")
    
    try:
        # Clear Python cache first
        print("Clearing Python cache...")
        for root, dirs, files in os.walk("."):
            if "__pycache__" in dirs:
                import shutil
                shutil.rmtree(os.path.join(root, "__pycache__"), ignore_errors=True)
            for file in files:
                if file.endswith(".pyc"):
                    os.remove(os.path.join(root, file))
        
        print("✅ Cache cleared")
        
        # Test basic imports
        print("\nTesting critical imports...")
        
        # Test 1: Can we import basic models?
        from app.models.account import Account
        from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary
        print("  ✅ Models import successfully")
        
        # Test 2: Can we import basic schemas?
        from app.schemas.account import AccountInDB
        from app.schemas.income import IncomeSourceInDB, IncomeHistoryInDB, IncomeMonthlySummaryOut
        print("  ✅ Schemas import successfully")
        
        # Test 3: Check schema configurations
        print("\nChecking schema configurations...")
        schemas_to_check = [
            (AccountInDB, "AccountInDB"),
            (IncomeSourceInDB, "IncomeSourceInDB"),
            (IncomeHistoryInDB, "IncomeHistoryInDB"),
            (IncomeMonthlySummaryOut, "IncomeMonthlySummaryOut")
        ]
        
        for schema, name in schemas_to_check:
            if not hasattr(schema.Config, 'orm_mode') or not schema.Config.orm_mode:
                raise RuntimeError(f"Schema {name} missing orm_mode=True")
            if not hasattr(schema.Config, 'use_enum_values') or not schema.Config.use_enum_values:
                raise RuntimeError(f"Schema {name} missing use_enum_values=True")
        
        print("  ✅ All schemas configured correctly")
        
        print("\n" + "="*60)
        print("✅ ESSENTIAL CHECKS PASSED")
        print("="*60 + "\n")
        
    except ImportError as e:
        print(f"\n❌ IMPORT ERROR: {e}")
        print("This usually indicates a missing import or circular dependency.")
        raise
    except SyntaxError as e:
        print(f"\n❌ SYNTAX ERROR: {e}")
        print(f"File: {e.filename}")
        print(f"Line {e.lineno}: {e.text}")
        raise
    except Exception as e:
        print(f"\n❌ CHECK FAILED: {type(e).__name__}: {e}")
        raise