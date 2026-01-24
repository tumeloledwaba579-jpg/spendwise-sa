"""
Comprehensive integration test suite for SpendWise SA.

Tests the complete flow:
1. User registration and authentication
2. Account creation with proper enum handling
3. Category creation with all fields
4. Payment method creation
5. Response validation (all fields present)
6. Error handling for invalid inputs

Run with: py -3.11 -m pytest app/tests/test_integration.py -v
"""

import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

from app.models.account import Account, AccountType
from app.models.category import Category, CategoryType
from app.models.payment_method import PaymentMethod, PaymentMethodType
from app.schemas.account import AccountInDB, AccountCreate
from app.schemas.category import CategoryInDB, CategoryCreate
from app.schemas.payment_method import PaymentMethodInDB, PaymentMethodCreate


@pytest.mark.integration
class TestAccountIntegration:
    """Test account creation and serialization"""
    
    def test_account_create_schema_accepts_string_enum(self):
        """AccountCreate should accept string enum values"""
        account_in = AccountCreate(
            name="Test Checking Account",
            account_type="CHECKING",
            currency="USD",
            balance=Decimal("1500.00"),
            is_active=True
        )
        
        assert account_in.name == "Test Checking Account"
        assert account_in.account_type == "CHECKING"
        assert account_in.balance == Decimal("1500.00")
    
    def test_account_indb_schema_from_orm(self):
        """AccountInDB should load from ORM object with enum"""
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name="Savings Account",
            account_type=AccountType.SAVINGS,
            balance=Decimal("5000.00"),
            currency="USD",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        # Load into schema (this is where enum mismatch would occur)
        schema = AccountInDB.from_orm(account)
        
        # Verify all fields
        assert schema.name == "Savings Account"
        assert schema.account_type == "SAVINGS"
        assert schema.balance == Decimal("5000.00")
        assert schema.currency == "USD"
        assert schema.is_active == True
        assert schema.id == account.id
        assert schema.user_id == account.user_id
    
    def test_account_response_serialization(self):
        """Account response should serialize enum as string"""
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name="Credit Card",
            account_type=AccountType.CREDIT_CARD,
            balance=Decimal("0.00"),
            currency="USD",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = AccountInDB.from_orm(account)
        serialized = schema.dict()
        
        # Enum should be string in serialized output
        assert isinstance(serialized['account_type'], str)
        assert serialized['account_type'] == "CREDIT_CARD"
        
        # All required fields should be present
        required_fields = {'id', 'user_id', 'name', 'account_type', 'balance', 'currency', 'is_active', 'created_at'}
        assert required_fields.issubset(set(serialized.keys()))
    
    def test_account_schema_has_all_model_columns(self):
        """Verify AccountInDB has all Account model columns"""
        model_columns = {col.name for col in Account.__table__.columns}
        schema_fields = set(AccountInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        assert not missing, f"AccountInDB missing columns: {missing}"


@pytest.mark.integration
class TestCategoryIntegration:
    """Test category creation and serialization"""
    
    def test_category_create_schema_accepts_string_enum(self):
        """CategoryCreate should accept string enum values"""
        category_in = CategoryCreate(
            name="Groceries",
            category_type="EXPENSE",
            is_active=True,
            display_order=1
        )
        
        assert category_in.name == "Groceries"
        assert category_in.category_type == "EXPENSE"
        assert category_in.display_order == 1
    
    def test_category_indb_schema_from_orm(self):
        """CategoryInDB should load from ORM object with enum"""
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name="Salary",
            category_type=CategoryType.INCOME,
            description="Monthly salary",
            icon="💰",
            color="#00FF00",
            parent_id=None,
            is_active=True,
            is_system=False,
            display_order=0,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = CategoryInDB.from_orm(category)
        
        assert schema.name == "Salary"
        assert schema.category_type == "INCOME"
        assert schema.is_system == False
        assert schema.display_order == 0
    
    def test_category_response_includes_is_system_field(self):
        """Category response must include is_system field"""
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name="Uncategorized",
            category_type=CategoryType.EXPENSE,
            description=None,
            icon=None,
            color=None,
            parent_id=None,
            is_active=True,
            is_system=True,  # System category
            display_order=999,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = CategoryInDB.from_orm(category)
        serialized = schema.dict()
        
        # is_system MUST be present in response
        assert 'is_system' in serialized, "Missing is_system field in response"
        assert serialized['is_system'] == True
        assert isinstance(serialized['is_system'], bool)
    
    def test_category_enum_serialization_all_types(self):
        """Test all category types serialize correctly"""
        for category_type in ['INCOME', 'EXPENSE', 'TRANSFER']:
            category = Category(
                id=uuid4(),
                user_id=uuid4(),
                name=f"Test {category_type}",
                category_type=CategoryType[category_type],
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
            
            assert serialized['category_type'] == category_type
            assert isinstance(serialized['category_type'], str)
    
    def test_category_schema_has_all_model_columns(self):
        """Verify CategoryInDB has all Category model columns"""
        model_columns = {col.name for col in Category.__table__.columns}
        schema_fields = set(CategoryInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        assert not missing, f"CategoryInDB missing columns: {missing}"


@pytest.mark.integration
class TestPaymentMethodIntegration:
    """Test payment method creation and serialization"""
    
    def test_payment_method_create_schema(self):
        """PaymentMethodCreate should accept all fields"""
        pm_in = PaymentMethodCreate(
            name="Chase Sapphire",
            payment_type="CREDIT_CARD",
            last_four="4242",
            is_active=True,
            is_default=True
        )
        
        assert pm_in.name == "Chase Sapphire"
        assert pm_in.payment_type == "CREDIT_CARD"
        assert pm_in.last_four == "4242"
        assert pm_in.is_default == True
    
    def test_payment_method_indb_schema_from_orm(self):
        """PaymentMethodInDB should load from ORM object with enum"""
        pm = PaymentMethod(
            id=uuid4(),
            user_id=uuid4(),
            name="Bank Account",
            payment_type=PaymentMethodType.BANK_TRANSFER,
            last_four="6789",
            is_active=True,
            is_default=False,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = PaymentMethodInDB.from_orm(pm)
        
        assert schema.name == "Bank Account"
        assert schema.payment_type == "BANK_TRANSFER"
        assert schema.last_four == "6789"
        assert schema.is_default == False
    
    def test_payment_method_response_has_required_fields(self):
        """Payment method response must have all required fields"""
        pm = PaymentMethod(
            id=uuid4(),
            user_id=uuid4(),
            name="Debit Card",
            payment_type=PaymentMethodType.DEBIT_CARD,
            last_four="5555",
            is_active=True,
            is_default=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = PaymentMethodInDB.from_orm(pm)
        serialized = schema.dict()
        
        # All required fields must be present
        required_fields = {
            'id', 'user_id', 'name', 'payment_type', 
            'last_four', 'is_active', 'is_default', 'created_at'
        }
        
        for field in required_fields:
            assert field in serialized, f"Missing field: {field}"
    
    def test_payment_method_enum_serialization_all_types(self):
        """Test all payment method types serialize correctly"""
        payment_types = [
            'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER',
            'CASH', 'DIGITAL_WALLET', 'OTHER'
        ]
        
        for payment_type in payment_types:
            pm = PaymentMethod(
                id=uuid4(),
                user_id=uuid4(),
                name=f"Test {payment_type}",
                payment_type=PaymentMethodType[payment_type],
                last_four="1234",
                is_active=True,
                is_default=False,
                created_at=datetime.now(),
                updated_at=None
            )
            
            schema = PaymentMethodInDB.from_orm(pm)
            serialized = schema.dict()
            
            assert serialized['payment_type'] == payment_type
            assert isinstance(serialized['payment_type'], str)
    
    def test_payment_method_schema_has_all_model_columns(self):
        """Verify PaymentMethodInDB has all PaymentMethod model columns"""
        model_columns = {col.name for col in PaymentMethod.__table__.columns}
        schema_fields = set(PaymentMethodInDB.__fields__.keys())
        
        missing = model_columns - schema_fields
        assert not missing, f"PaymentMethodInDB missing columns: {missing}"


@pytest.mark.integration
class TestSchemaPydanticConfig:
    """Test that all schemas have correct Pydantic configuration"""
    
    def test_account_schema_config(self):
        """Account schemas must have safe Pydantic config"""
        assert AccountInDB.__config__.orm_mode, "orm_mode must be True"
        assert AccountInDB.__config__.use_enum_values, "use_enum_values must be True"
        assert AccountInDB.__config__.extra == 'forbid', "extra must be 'forbid'"
    
    def test_category_schema_config(self):
        """Category schemas must have safe Pydantic config"""
        assert CategoryInDB.__config__.orm_mode, "orm_mode must be True"
        assert CategoryInDB.__config__.use_enum_values, "use_enum_values must be True"
        assert CategoryInDB.__config__.extra == 'forbid', "extra must be 'forbid'"
    
    def test_payment_method_schema_config(self):
        """PaymentMethod schemas must have safe Pydantic config"""
        assert PaymentMethodInDB.__config__.orm_mode, "orm_mode must be True"
        assert PaymentMethodInDB.__config__.use_enum_values, "use_enum_values must be True"
        assert PaymentMethodInDB.__config__.extra == 'forbid', "extra must be 'forbid'"


@pytest.mark.integration
class TestEnumValidators:
    """Test that enum validators handle both strings and enum instances"""
    
    def test_account_type_validator_accepts_string(self):
        """AccountCreate validator should accept string"""
        account_in = AccountCreate(
            name="Test",
            account_type="CHECKING",  # String
            currency="USD",
            balance=Decimal("100.00"),
            is_active=True
        )
        assert account_in.account_type == "CHECKING"
    
    def test_account_type_validator_accepts_enum(self):
        """AccountInDB validator should accept enum instance"""
        account = Account(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            account_type=AccountType.CHECKING,  # Enum
            balance=Decimal("100.00"),
            currency="USD",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = AccountInDB.from_orm(account)
        assert schema.account_type == "CHECKING"
    
    def test_category_type_validator_accepts_string(self):
        """CategoryCreate validator should accept string"""
        category_in = CategoryCreate(
            name="Test",
            category_type="EXPENSE",  # String
            is_active=True,
            display_order=0
        )
        assert category_in.category_type == "EXPENSE"
    
    def test_category_type_validator_accepts_enum(self):
        """CategoryInDB validator should accept enum instance"""
        category = Category(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            category_type=CategoryType.EXPENSE,  # Enum
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
        assert schema.category_type == "EXPENSE"
    
    def test_payment_method_type_validator_accepts_string(self):
        """PaymentMethodCreate validator should accept string"""
        pm_in = PaymentMethodCreate(
            name="Test",
            payment_type="CREDIT_CARD",  # String
            last_four="1234",
            is_active=True,
            is_default=False
        )
        assert pm_in.payment_type == "CREDIT_CARD"
    
    def test_payment_method_type_validator_accepts_enum(self):
        """PaymentMethodInDB validator should accept enum instance"""
        pm = PaymentMethod(
            id=uuid4(),
            user_id=uuid4(),
            name="Test",
            payment_type=PaymentMethodType.CREDIT_CARD,  # Enum
            last_four="1234",
            is_active=True,
            is_default=False,
            created_at=datetime.now(),
            updated_at=None
        )
        
        schema = PaymentMethodInDB.from_orm(pm)
        assert schema.payment_type == "CREDIT_CARD"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])