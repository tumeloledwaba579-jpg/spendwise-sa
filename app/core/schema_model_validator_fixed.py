"""
Startup validation checks to prevent schema/model misalignment.
This catches the silent failure patterns before they reach production.
"""

import sys
import inspect
from enum import Enum
from pydantic import BaseModel
from typing import Set, Dict


def check_no_duplicate_enums():
    """
    Ensure no enum is defined in multiple DIFFERENT places.
    
    Important: An enum imported in a schema is OK - it's the SAME object
    from the model. We only flag it if there are TWO DIFFERENT enum classes
    with the same name.
    
    Fails if:
    - Same enum name exists in two different source modules
    - And they are DIFFERENT objects (not just imported)
    """
    enum_definitions: Dict[str, str] = {}  # {enum_name: source_module}
    
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__'):
            continue
        
        if not module.__name__.startswith('app.'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, Enum) and obj is not Enum:
                # Get the actual module where the enum is DEFINED
                # (not where it's imported from)
                source_module = obj.__module__
                
                if name in enum_definitions:
                    # Check if it's the SAME enum object from the same source
                    previous_module = enum_definitions[name]
                    
                    if previous_module != source_module:
                        # Different source modules = DUPLICATE DEFINITION (bad)
                        raise RuntimeError(
                            f"CRITICAL: Duplicate enum definition '{name}':\n"
                            f"  Defined in: {source_module}\n"
                            f"  Also defined in: {previous_module}\n"
                            f"\nEnums must be defined ONCE in app.models, "
                            f"then IMPORTED in app.schemas.\n"
                            f"See: Prevention Checklist in documentation."
                        )
                    # Same source module = just an import, which is OK
                else:
                    enum_definitions[name] = source_module
    
    print(f"  ? No duplicate enums ({len(enum_definitions)} total)")


def check_enum_definitions_location():
    """
    Verify enums are ONLY defined in models, not schemas.
    
    An enum imported in a schema is OK (it's from the model).
    We only fail if an enum is DEFINED (created) in a schema module.
    
    Fails if:
    - An enum class's __module__ is app.schemas.* (it was defined there)
    """
    schema_enums = []
    
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__'):
            continue
        
        if not module.__name__.startswith('app.'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, Enum) and obj is not Enum:
                # Check where the enum is actually DEFINED
                if obj.__module__.startswith('app.schemas'):
                    schema_enums.append((name, obj.__module__))
    
    if schema_enums:
        error_msg = "CRITICAL: Enums defined in schemas (should be in models):\n"
        for enum_name, module_name in schema_enums:
            error_msg += f"  - {enum_name} in {module_name}\n"
        error_msg += (
            "\nEnums must be defined in app.models.X, "
            "then IMPORTED in app.schemas.X:\n"
            "  from app.models.account import AccountType  # ? Correct\n"
            "  class AccountType(str, Enum):  # ? Wrong (shouldn't be here)\n"
        )
        raise RuntimeError(error_msg)
    
    print("  ? Enum definitions in correct location (models only)")


def check_schema_model_alignment():
    """
    Verify response schemas have ALL model columns.
    
    Fails if:
    - Response schema missing any column from the model
    - This causes orm_mode=True to fail with confusing errors
    """
    from app.models.account import Account
    from app.models.category import Category
    from app.models.payment_method import PaymentMethod
    from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary
    from app.schemas.account import AccountInDB
    from app.schemas.category import CategoryInDB
    from app.schemas.payment_method import PaymentMethodInDB
    from app.schemas.income import IncomeSourceInDB, IncomeHistoryInDB, IncomeMonthlySummaryOut
    
    checks = [
        (AccountInDB, Account, "AccountInDB", "Account"),
        (CategoryInDB, Category, "CategoryInDB", "Category"),
        (PaymentMethodInDB, PaymentMethod, "PaymentMethodInDB", "PaymentMethod"),
        (IncomeSourceInDB, IncomeSource, "IncomeSourceInDB", "IncomeSource"),
        (IncomeHistoryInDB, IncomeHistory, "IncomeHistoryInDB", "IncomeHistory"),
        (IncomeMonthlySummaryOut, IncomeMonthlySummary, "IncomeMonthlySummaryOut", "IncomeMonthlySummary"),
    ]
    
    alignment_errors = []
    
    for schema_cls, model_cls, schema_name, model_name in checks:
        schema_fields = set(schema_cls.__fields__.keys())
        model_columns = {col.name for col in model_cls.__table__.columns}
        
        missing = model_columns - schema_fields
        if missing:
            alignment_errors.append(
                f"  {schema_name}: Missing {missing}"
            )
    
    if alignment_errors:
        error_msg = "CRITICAL: Schema/model column misalignment:\n"
        for error in alignment_errors:
            error_msg += error + "\n"
        error_msg += (
            "\nWhen using orm_mode=True, ALL model columns must be in response schema.\n"
            "This prevents silent 500 errors during response serialization.\n"
            "See: Schema/Model Alignment in documentation."
        )
        raise RuntimeError(error_msg)
    
    print("  ? Schema/model alignment verified (all columns present)")


def check_pydantic_configs():
    """
    Ensure response schemas (InDB, Out) have correct Pydantic configs.
    
    Only checks *InDB and *Out schemas which are returned to users.
    Create/Update/Base schemas don't need orm_mode=True since they're inputs.
    
    Fails if response schemas have:
    - orm_mode != True (required for ORM loading)
    - use_enum_values != True (required for enum serialization)
    - extra != 'forbid' (required for strict validation)
    """
    critical_checks = {
        'orm_mode': (True, 'orm_mode'),
        'use_enum_values': (True, 'use_enum_values'),
        'extra': ('forbid', 'extra'),
    }
    
    config_issues = []
    
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__):
            continue
        
        if not module.__name__.startswith('app.schemas'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, BaseModel) and obj is not BaseModel:
                # Only check response schemas (InDB, Out, response models)
                # Skip input schemas (Create, Update, Base) as they don't need orm_mode
                if not (name.endswith('InDB') or name.endswith('Out') or name in ['Token', 'TokenPayload']):
                    continue
                
                if not hasattr(obj, '__config__'):
                    continue
                
                config = obj.__config__
                
                for setting, (expected, label) in critical_checks.items():
                    actual = getattr(config, setting, None)
                    if actual != expected:
                        config_issues.append(
                            f"  {obj.__name__}.Config.{label} = {actual} "
                            f"(expected {expected})"
                        )
    
    if config_issues:
        error_msg = "CRITICAL: Response schema Pydantic configuration issues:\n"
        error_msg += "\n".join(config_issues) + "\n"
        error_msg += (
            "\nAll *InDB and *Out response schemas must have:\n"
            "  orm_mode = True          # Load from ORM objects\n"
            "  use_enum_values = True   # Serialize enums as strings\n"
            "  extra = 'forbid'         # Reject unknown fields\n"
        )
        raise RuntimeError(error_msg)
    
    print("  ? Pydantic configurations validated (response schemas)")


def run_all_checks():
    """
    Run all startup validation checks.
    Called from app/main.py on startup.
    
    Raises RuntimeError if any check fails (prevents app startup).
    """
    print("\n" + "="*60)
    print("SYSTEM STARTUP VALIDATION")
    print("="*60 + "\n")
    
    try:
        print("Checking enums...")
        check_no_duplicate_enums()
        check_enum_definitions_location()
        
        print("\nChecking schema/model alignment...")
        check_schema_model_alignment()
        
        print("\nChecking Pydantic configurations...")
        check_pydantic_configs()
        
        print("\n" + "="*60)
        print("? ALL STARTUP CHECKS PASSED")
        print("="*60 + "\n")
        
    except RuntimeError as e:
        print("\n" + "="*60)
        print("? STARTUP VALIDATION FAILED")
        print("="*60)
        print(f"\n{e}\n")
        raise
