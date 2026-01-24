"""
Test that enums from models can be serialized by schemas.
This catches the enum identity mismatch issue early.
"""

import pytest
from uuid import uuid4
from datetime import datetime
from decimal import Decimal

from app.models.account import AccountType, Account
from app.models.category import CategoryType, Category
from app.models.payment_method import PaymentMethodType, PaymentMethod
from app.schemas.account import AccountInDB as AccountSchema
from app.schemas.category import CategoryInDB as CategorySchema
from app.schemas.payment_method import PaymentMethodInDB as PaymentMethodSchema


class TestEnumSerialization:
    """Test enum round-trip serialization through schemas"""
    
    def test_account_enum_serialization(self):
        """Enum from model → schema → dict should be string"""
        account_dict = {
            'id': uuid4(),
            'user_id': uuid4(),
            'name': 'Test',
            'account_type': AccountType.CHECKING,
            'balance': Decimal('100.00'),
            'currency': 'USD',
            'is_active': True,
            'created_at': datetime.now(),
            'updated_at': None
        }

        # Load enum instance into schema
        schema = AccountSchema(**account_dict)
        
        # Serialize to dict
        serialized = schema.dict()

        # Verify enum is string
        assert isinstance(serialized['account_type'], str)
        assert serialized['account_type'] == 'CHECKING'

    def test_category_enum_serialization(self):
        """Category enum serialization"""
        category_dict = {
            'id': uuid4(),
            'user_id': uuid4(),
            'name': 'Test',
            'category_type': CategoryType.EXPENSE,
            'description': None,
            'icon': None,
            'color': None,
            'parent_id': None,
            'is_active': True,
            'is_system': False,
            'display_order': 0,
            'created_at': datetime.now(),
            'updated_at': None
        }

        schema = CategorySchema(**category_dict)
        serialized = schema.dict()

        assert isinstance(serialized['category_type'], str)
        assert serialized['category_type'] == 'EXPENSE'

    def test_payment_method_enum_serialization(self):
        """PaymentMethod enum serialization"""
        pm_dict = {
            'id': uuid4(),
            'user_id': uuid4(),
            'name': 'Test',
            'payment_type': PaymentMethodType.CREDIT_CARD,
            'last_four': '1234',
            'is_active': True,
            'is_default': False,
            'created_at': datetime.now(),
            'updated_at': None
        }

        schema = PaymentMethodSchema(**pm_dict)
        serialized = schema.dict()

        assert isinstance(serialized['payment_type'], str)
        assert serialized['payment_type'] == 'CREDIT_CARD'