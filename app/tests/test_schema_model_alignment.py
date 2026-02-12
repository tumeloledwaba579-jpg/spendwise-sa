"""
Test that Pydantic schemas correctly map to SQLAlchemy models.
"""

import pytest
from app.models.account import Account
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.schemas.account import AccountInDB
from app.schemas.category import CategoryInDB
from app.schemas.payment_method import PaymentMethodInDB


class TestSchemaModelAlignment:
    """Verify schema fields match model columns"""
    
    def test_account_schema_has_all_model_columns(self):
        """AccountInDB schema must have all Account model columns"""
        model_columns = {col.name for col in Account.__table__.columns}
        schema_fields = set(AccountInDB.__fields__.keys())
        
        # All model columns should be in schema
        assert model_columns.issubset(schema_fields), \
            f"Schema missing columns: {model_columns - schema_fields}"
    
    def test_category_schema_has_all_model_columns(self):
        """CategoryInDB schema must have all Category model columns"""
        model_columns = {col.name for col in Category.__table__.columns}
        schema_fields = set(CategoryInDB.__fields__.keys())
        
        assert model_columns.issubset(schema_fields), \
            f"Schema missing columns: {model_columns - schema_fields}"
    
    def test_payment_method_schema_has_all_model_columns(self):
        """PaymentMethodInDB schema must have all PaymentMethod model columns"""
        model_columns = {col.name for col in PaymentMethod.__table__.columns}
        schema_fields = set(PaymentMethodInDB.__fields__.keys())
        
        assert model_columns.issubset(schema_fields), \
            f"Schema missing columns: {model_columns - schema_fields}"
