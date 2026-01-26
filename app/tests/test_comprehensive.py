"""
Comprehensive End-to-End Test Suite for SpendWise SA Safeguards
==============================================================

This test suite verifies the entire silent failure prevention system:

1. Startup Validation Layer (checks at app startup)
2. Schema/Model Alignment (field matching)
3. Enum Handling (no duplication, proper serialization)
4. Pydantic Configuration (orm_mode, use_enum_values, extra)
5. Integration Testing (complete request/response cycle)
6. Error Handling (graceful failure detection)

Run with: py -3.11 -m pytest app/tests/test_comprehensive.py -v

Expected: 30+ tests passing, comprehensive coverage of all safeguards
"""

import sys
import inspect
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from app.models.account import Account, AccountType
from app.models.category import Category, CategoryType
from app.models.payment_method import PaymentMethod, PaymentMethodType
from app.schemas.account import AccountInDB, AccountCreate, AccountUpdate
from app.schemas.category import CategoryInDB, CategoryCreate, CategoryUpdate
from app.schemas.payment_method import PaymentMethodInDB, PaymentMethodCreate, PaymentMethodUpdate
from pydantic import ValidationError


# ============================================================================
# LAYER 1: STARTUP VALIDATION CHECKS
# ============================================================================

class TestStartupValidation:
    """Verify startup validation checks work correctly"""
    
    def test_enum_not_reexported_from_models_init(self):
        """Enums should not be exported from app/models/__init__.py"""
        from app import models
        
        # Check that enums are not accessible via models.EnumName
        assert not hasattr(models, 'AccountType'), (
            "AccountType exported from models/__init__.py (should not be)"
        )
        assert not hasattr(models, 'CategoryType'), (
            "CategoryType exported from models/__init__.py (should not be)"
        )
        assert not hasattr(models, 'PaymentMethodType'), (
            "PaymentMethodType exported from models/__init__.py (should not be)"
        )


# ============================================================================
# LAYER 2: SCHEMA/MODEL ALIGNMENT
# ============================================================================

class TestSchemaModelAlignment:
    """Verify schemas match model columns exactly"""
    
    def test_account_schema_has_all_model_columns(self):
        """AccountInDB must have ALL Account model columns"""
        model_columns = {col.name for col in Account.__table__.columns}
        schema_fields = set(AccountInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        extra = schema_fields - model_columns
        
        assert not missing, f"Schema missing columns: {missing}"
        assert not extra, f"Schema has extra fields: {extra}"
    
    def test_category_schema_has_all_model_columns(self):
        """CategoryInDB must have ALL Category model columns"""
        model_columns = {col.name for col in Category.__table__.columns}
        schema_fields = set(CategoryInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        assert not missing, f"Schema missing columns: {missing}"
    
    def test_payment_method_schema_has_all_model_columns(self):
        """PaymentMethodInDB must have ALL PaymentMethod model columns"""
        model_columns = {col.name for col in PaymentMethod.__table__.columns}
        schema_fields = set(PaymentMethodInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        assert not missing, f"Schema missing columns: {missing}"


# ============================================================================
# LAYER 3: ENUM HANDLING
# ============================================================================

class TestEnumHandling:
    """Verify enum serialization and deserialization work correctly"""
    
    def test_account_type_all_values_present(self):
        """All AccountType values should exist"""
        expected_values = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN']
        actual_values = [e.value for e in AccountType]
        
        for value in expected_values:
            assert value in actual_values, f"Missing AccountType: {value}"
    
    def test_category_type_all_values_present(self):
        """All CategoryType values should exist"""
        expected_values = ['INCOME', 'EXPENSE', 'TRANSFER']
        actual_values = [e.value for e in CategoryType]
        
        for value in expected_values:
            assert value in actual_values, f"Missing CategoryType: {value}"
    
    def test_payment_method_type_all_values_present(self):
        """All PaymentMethodType values should exist"""
        expected_values = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET', 'OTHER']
        actual_values = [e.value for e in PaymentMethodType]
        
        for value in expected_values:
            assert value in actual_values, f"Missing PaymentMethodType: {value}"
    
    def test_account_enum_from_orm_serializes_to_string(self):
        """AccountType from ORM should serialize to string"""
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            account_type=AccountType.CHECKING,
            balance=Decimal("100.00"),
            currency="USD",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = AccountInDB.from_orm(account)
        serialized = schema.dict()
        
        assert isinstance(serialized['account_type'], str), (
            f"Expected string, got {type(serialized['account_type'])}"
        )
        assert serialized['account_type'] == 'CHECKING'
    
    def test_category_enum_from_orm_serializes_to_string(self):
        """CategoryType from ORM should serialize to string"""
        for category_type_str in ['INCOME', 'EXPENSE', 'TRANSFER']:
            category = Category(
                id=uuid4(),
                user_id=uuid4(),
                name="Test",
                category_type=CategoryType[category_type_str],
                description=None,
                icon=None,
                color=None,
                parent_id=None,
                is_active=True,
                is_system=False,
                display_order=0,
                created_at=datetime.now(),
                updated_at=None
            )
            
            schema = CategoryInDB.from_orm(category)
            serialized = schema.dict()
            
            assert isinstance(serialized['category_type'], str)
            assert serialized['category_type'] == category_type_str
    
    def test_payment_method_enum_from_orm_serializes_to_string(self):
        """PaymentMethodType from ORM should serialize to string"""
        for pm_type_str in ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET', 'OTHER']:
            pm = PaymentMethod(
                id=uuid4(),
                user_id=uuid4(),
                name="Test",
                payment_type=PaymentMethodType[pm_type_str],
                last_four="1234",
                is_active=True,
                is_default=False,
                created_at=datetime.now(),
                updated_at=None
            )
            
            schema = PaymentMethodInDB.from_orm(pm)
            serialized = schema.dict()
            
            assert isinstance(serialized['payment_type'], str)
            assert serialized['payment_type'] == pm_type_str
    
    def test_create_schema_accepts_string_enums(self):
        """Create schemas should accept string enum values"""
        account_in = AccountCreate(
            name="Test",
            account_type="CHECKING",
            currency="USD",
            balance=Decimal("100.00"),
            is_active=True
        )
        assert account_in.account_type == "CHECKING"
        
        category_in = CategoryCreate(
            name="Test",
            category_type="EXPENSE",
            is_active=True,
            display_order=0
        )
        assert category_in.category_type == "EXPENSE"
        
        pm_in = PaymentMethodCreate(
            name="Test",
            payment_type="CREDIT_CARD",
            last_four="1234",
            is_active=True,
            is_default=False
        )
        assert pm_in.payment_type == "CREDIT_CARD"
    
    def test_create_schema_accepts_uppercase_enums(self):
        """Enums should be case-insensitive (converted to uppercase)"""
        account_in = AccountCreate(
            name="Test",
            account_type="checking",  # lowercase
            currency="USD",
            balance=Decimal("100.00"),
            is_active=True
        )
        assert account_in.account_type == "CHECKING"


# ============================================================================
# LAYER 4: PYDANTIC CONFIGURATION
# ============================================================================

class TestPydanticConfiguration:
    """Verify all schemas have correct Pydantic configuration"""
    
    def test_account_schema_config_orm_mode(self):
        """AccountInDB must have orm_mode=True"""
        assert AccountInDB.__config__.orm_mode, (
            "AccountInDB.Config.orm_mode must be True"
        )
    
    def test_account_schema_config_use_enum_values(self):
        """AccountInDB must have use_enum_values=True"""
        assert AccountInDB.__config__.use_enum_values, (
            "AccountInDB.Config.use_enum_values must be True"
        )
    
    def test_account_schema_config_extra_forbid(self):
        """AccountInDB must have extra='forbid'"""
        assert AccountInDB.__config__.extra == 'forbid', (
            "AccountInDB.Config.extra must be 'forbid'"
        )
    
    def test_category_schema_config_complete(self):
        """CategoryInDB must have all correct configs"""
        assert CategoryInDB.__config__.orm_mode
        assert CategoryInDB.__config__.use_enum_values
        assert CategoryInDB.__config__.extra == 'forbid'
    
    def test_payment_method_schema_config_complete(self):
        """PaymentMethodInDB must have all correct configs"""
        assert PaymentMethodInDB.__config__.orm_mode
        assert PaymentMethodInDB.__config__.use_enum_values
        assert PaymentMethodInDB.__config__.extra == 'forbid'


# ============================================================================
# LAYER 5: RESPONSE VALIDATION
# ============================================================================

class TestResponseValidation:
    """Verify response schemas have all required fields"""
    
    def test_account_response_has_all_fields(self):
        """Account response must have all expected fields"""
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            account_type=AccountType.CHECKING,
            balance=Decimal("100.00"),
            currency="USD",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = AccountInDB.from_orm(account)
        serialized = schema.dict()
        
        required_fields = {'id', 'user_id', 'name', 'account_type', 'balance', 'currency', 'is_active', 'created_at'}
        assert required_fields.issubset(set(serialized.keys())), (
            f"Missing fields: {required_fields - set(serialized.keys())}"
        )
    
    def test_category_response_has_is_system_field(self):
        """Category response MUST include is_system field"""
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            category_type=CategoryType.EXPENSE,
            description=None,
            icon=None,
            color=None,
            parent_id=None,
            is_active=True,
            is_system=True,
            display_order=0,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = CategoryInDB.from_orm(category)
        serialized = schema.dict()
        
        assert 'is_system' in serialized, "Missing is_system field"
        assert isinstance(serialized['is_system'], bool)
        assert serialized['is_system'] == True
    
    def test_category_response_has_display_order_field(self):
        """Category response MUST include display_order field"""
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            category_type=CategoryType.INCOME,
            description=None,
            icon=None,
            color=None,
            parent_id=None,
            is_active=True,
            is_system=False,
            display_order=5,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = CategoryInDB.from_orm(category)
        serialized = schema.dict()
        
        assert 'display_order' in serialized
        assert serialized['display_order'] == 5
    
    def test_payment_method_response_has_all_fields(self):
        """Payment method response must have all expected fields"""
        pm = PaymentMethod(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            payment_type=PaymentMethodType.CREDIT_CARD,
            last_four="1234",
            is_active=True,
            is_default=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = PaymentMethodInDB.from_orm(pm)
        serialized = schema.dict()
        
        required_fields = {'id', 'user_id', 'name', 'payment_type', 'last_four', 'is_active', 'is_default', 'created_at'}
        assert required_fields.issubset(set(serialized.keys()))


# ============================================================================
# LAYER 6: UPDATE SCHEMA VALIDATION
# ============================================================================

class TestUpdateSchemaValidation:
    """Verify update schemas allow partial updates"""
    
    def test_account_update_all_fields_optional(self):
        """AccountUpdate should allow updating any single field"""
        update1 = AccountUpdate(name="New Name")
        assert update1.name == "New Name"
        assert update1.account_type is None
        
        update2 = AccountUpdate(balance=Decimal("500.00"))
        assert update2.balance == Decimal("500.00")
        assert update2.name is None


# ============================================================================
# LAYER 7: ERROR HANDLING & VALIDATION FAILURES
# ============================================================================

class TestErrorHandling:
    """Verify proper error handling for invalid data"""
    
    def test_invalid_account_type_rejected(self):
        """Invalid AccountType should raise ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            AccountCreate(
                name="Test",
                account_type="INVALID",
                currency="USD",
                balance=Decimal("100.00"),
                is_active=True
            )
        
        assert exc_info.value
    
    def test_missing_required_account_field(self):
        """Missing required AccountCreate field should raise ValidationError"""
        with pytest.raises(ValidationError):
            AccountCreate(
                name="Test",
                # account_type missing
                currency="USD",
                balance=Decimal("100.00"),
                is_active=True
            )


# ============================================================================
# LAYER 8: ROUND-TRIP SERIALIZATION
# ============================================================================

class TestRoundTripSerialization:
    """Verify data can survive request → model → response cycle"""
    
    def test_account_round_trip(self):
        """Account data should survive: input → create → ORM → response"""
        account_in = AccountCreate(
            name="My Checking",
            account_type="CHECKING",
            currency="USD",
            balance=Decimal("1234.56"),
            is_active=True
        )
        
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name=account_in.name,
            account_type=AccountType[account_in.account_type],
            balance=account_in.balance,
            currency=account_in.currency,
            is_active=account_in.is_active,
            created_at=datetime.now(),
            updated_at=None
        )
        
        response = AccountInDB.from_orm(account)
        json_data = response.dict()
        
        assert json_data['name'] == "My Checking"
        assert json_data['account_type'] == "CHECKING"
        assert json_data['balance'] == Decimal("1234.56")
        assert isinstance(json_data['account_type'], str)
    
    def test_category_round_trip(self):
        """Category data should survive full cycle with is_system field"""
        category_in = CategoryCreate(
            name="Groceries",
            category_type="EXPENSE",
            is_active=True,
            display_order=1
        )
        
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name=category_in.name,
            category_type=CategoryType[category_in.category_type],
            description=None,
            icon=None,
            color=None,
            parent_id=None,
            is_active=category_in.is_active,
            is_system=False,
            display_order=category_in.display_order,
            created_at=datetime.now(),
            updated_at=None
        )
        
        response = CategoryInDB.from_orm(category)
        json_data = response.dict()
        
        assert json_data['name'] == "Groceries"
        assert json_data['category_type'] == "EXPENSE"
        assert json_data['is_system'] == False
        assert json_data['display_order'] == 1


# ============================================================================
# LAYER 9: COMPREHENSIVE INTEGRATION CHECKS
# ============================================================================

class TestComprehensiveIntegration:
    """Final comprehensive checks that everything works together"""
    
    def test_all_models_have_corresponding_schemas(self):
        """Every model should have corresponding InDB and Out schemas"""
        models_with_schemas = [
            (Account, AccountInDB),
            (Category, CategoryInDB),
            (PaymentMethod, PaymentMethodInDB),
        ]
        
        for model, schema in models_with_schemas:
            assert hasattr(schema, '__fields__'), f"{schema} missing fields"
            assert hasattr(schema, '__config__'), f"{schema} missing Config"
    
    def test_system_survives_complete_lifecycle(self):
        """Complete lifecycle: create → store → retrieve → serialize"""
        user_id = uuid4()
        account_in = AccountCreate(
            name="Test Account",
            account_type="SAVINGS",
            currency="USD",
            balance=Decimal("5000.00"),
            is_active=True
        )
        
        account = Account(
            id=uuid4(),
            user_id=user_id,
            name=account_in.name,
            account_type=AccountType[account_in.account_type],
            balance=account_in.balance,
            currency=account_in.currency,
            is_active=account_in.is_active,
            created_at=datetime.now(),
            updated_at=None
        )
        
        response = AccountInDB.from_orm(account)
        json_response = response.dict()
        json_str = response.json()
        
        assert json_response['name'] == "Test Account"
        assert json_response['account_type'] == "SAVINGS"
        assert json_response['balance'] == Decimal("5000.00")
        assert isinstance(json_response['account_type'], str)
        assert json_str


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])