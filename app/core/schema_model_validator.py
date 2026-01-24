"""
Startup validation checks to prevent silent failure patterns.
"""

import sys
import inspect
from enum import Enum
from pydantic import BaseModel
from typing import Set


def check_no_duplicate_enums():
    """Ensure no enum is defined in multiple places"""
    enum_definitions = {}
    
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__'):
            continue
        
        if not module.__name__.startswith('app.'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, Enum) and obj is not Enum:
                full_name = f"{module.__name__}.{name}"
                
                if name in enum_definitions:
                    if enum_definitions[name] is not obj:
                        raise RuntimeError(
                            f"Duplicate enum '{name}' found:\n"
                            f"  {full_name}\n"
                            f"  {enum_definitions[name]}\n"
                            f"Enums must be defined in models, imported in schemas."
                        )
                else:
                    enum_definitions[name] = full_name


def check_enum_definitions_location():
    """Enums should ONLY be in models, not schemas"""
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__'):
            continue
        
        if not module.__name__.startswith('app.schemas'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, Enum) and obj is not Enum:
                raise RuntimeError(
                    f"Enum '{name}' defined in schemas ({module.__name__}).\n"
                    f"Enums must be defined in app.models, not app.schemas."
                )


def check_schema_model_alignment():
    """Verify response schemas have all model columns"""
    from app.models.account import Account
    from app.models.category import Category
    from app.models.payment_method import PaymentMethod
    from app.schemas.account import AccountInDB
    from app.schemas.category import CategoryInDB
    from app.schemas.payment_method import PaymentMethodInDB
    
    checks = [
        (AccountInDB, Account, "AccountInDB", "Account"),
        (CategoryInDB, Category, "CategoryInDB", "Category"),
        (PaymentMethodInDB, PaymentMethod, "PaymentMethodInDB", "PaymentMethod"),
    ]
    
    for schema_cls, model_cls, schema_name, model_name in checks:
        schema_fields = set(schema_cls.__fields__.keys())
        model_columns = {col.name for col in model_cls.__table__.columns}
        
        missing = model_columns - schema_fields
        if missing:
            raise RuntimeError(
                f"{schema_name} missing model columns from {model_name}:\n"
                f"  Missing: {missing}\n"
                f"  When using orm_mode=True, all model columns must be in schema."
            )


def check_pydantic_configs():
    """Ensure all Pydantic models have correct configs"""
    critical_checks = {
        'orm_mode': (True, 'orm_mode'),
        'use_enum_values': (True, 'use_enum_values'),
        'extra': ('forbid', 'extra'),
    }
    
    issues = []
    
    for module in sys.modules.values():
        if module is None or not hasattr(module, '__name__'):
            continue
        
        if not module.__name__.startswith('app.schemas'):
            continue
        
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, BaseModel) and obj is not BaseModel:
                config = obj.__config__
                
                for setting, (expected, label) in critical_checks.items():
                    actual = getattr(config, setting, None)
                    if actual != expected:
                        issues.append(
                            f"{obj.__name__}.Config.{label} = {actual} "
                            f"(expected {expected})"
                        )
    
    if issues:
        raise RuntimeError(
            f"Pydantic configuration issues:\n" +
            "\n".join(f"  {issue}" for issue in issues)
        )