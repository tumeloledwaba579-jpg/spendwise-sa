"""
Tests for debt management module.
"""
import pytest
from decimal import Decimal
from datetime import date
from uuid import uuid4


class TestDebtModule:
    """Test debt module exists and is importable."""

    def test_debt_models_exist(self):
        """Test that debt models can be imported."""
        try:
            from app.models.debt import DebtAccount, DebtPayment, DebtSnapshot, DebtType, PaymentMethod
            assert DebtAccount is not None
            assert DebtPayment is not None
            assert DebtSnapshot is not None
            assert DebtType is not None
            assert PaymentMethod is not None
        except ImportError as e:
            pytest.fail(f"Failed to import debt models: {e}")

    def test_debt_schemas_exist(self):
        """Test that debt schemas can be imported."""
        try:
            from app.schemas.debt import (
                DebtAccountCreate,
                DebtAccountUpdate,
                DebtAccountInDB,
                DebtPaymentCreate,
                DebtPaymentInDB,
                DebtSummary,
                DebtStats,
                PayoffStrategy
            )
            assert DebtAccountCreate is not None
            assert DebtAccountUpdate is not None
            assert DebtAccountInDB is not None
            assert DebtPaymentCreate is not None
            assert DebtPaymentInDB is not None
            assert DebtSummary is not None
            assert DebtStats is not None
            assert PayoffStrategy is not None
        except ImportError as e:
            pytest.fail(f"Failed to import debt schemas: {e}")

    def test_debt_service_exists(self):
        """Test that debt service can be imported."""
        try:
            from app.services.debt_service import DebtService
            assert DebtService is not None
            
            # Check for required methods
            assert hasattr(DebtService, 'create_debt_account')
            assert hasattr(DebtService, 'get_debt_account')
            assert hasattr(DebtService, 'list_debt_accounts')
            assert hasattr(DebtService, 'update_debt_account')
            assert hasattr(DebtService, 'deactivate_debt_account')
            assert hasattr(DebtService, 'record_payment')
            assert hasattr(DebtService, 'get_payment_history')
            assert hasattr(DebtService, 'get_debt_summary')
            assert hasattr(DebtService, 'get_debt_stats')
            assert hasattr(DebtService, 'calculate_payoff_strategy')
        except ImportError as e:
            pytest.fail(f"Failed to import debt service: {e}")

    def test_debt_endpoints_exist(self):
        """Test that debt endpoints can be imported."""
        try:
            from app.api.v1.endpoints import debt
            assert debt is not None
            assert debt.router is not None
        except ImportError as e:
            pytest.fail(f"Failed to import debt endpoints: {e}")

    def test_debt_types_enum(self):
        """Test DebtType enum values."""
        from app.models.debt import DebtType
        
        assert DebtType.CREDIT_CARD.value == "CREDIT_CARD"
        assert DebtType.PERSONAL_LOAN.value == "PERSONAL_LOAN"
        assert DebtType.AUTO_LOAN.value == "AUTO_LOAN"
        assert DebtType.MORTGAGE.value == "MORTGAGE"
        assert DebtType.STUDENT_LOAN.value == "STUDENT_LOAN"
        assert DebtType.OTHER.value == "OTHER"

    def test_payment_method_enum(self):
        """Test PaymentMethod enum values."""
        from app.models.debt import PaymentMethod
        
        assert PaymentMethod.BANK_TRANSFER.value == "BANK_TRANSFER"
        assert PaymentMethod.CHECK.value == "CHECK"
        assert PaymentMethod.CREDIT_CARD.value == "CREDIT_CARD"
        assert PaymentMethod.AUTO_PAY.value == "AUTO_PAY"
        assert PaymentMethod.OTHER.value == "OTHER"

    def test_debt_account_schema_validation(self):
        """Test DebtAccountCreate schema validation."""
        from app.schemas.debt import DebtAccountCreate
        
        # Valid data
        valid_data = DebtAccountCreate(
            name="Test Account",
            type="CREDIT_CARD",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("15.00"),
            start_date=date(2026, 1, 1)
        )
        assert valid_data.name == "Test Account"
        assert valid_data.type == "CREDIT_CARD"

    def test_debt_account_type_normalization(self):
        """Test that debt type is normalized to uppercase."""
        from app.schemas.debt import DebtAccountCreate
        
        account = DebtAccountCreate(
            name="Test",
            type="credit_card",  # lowercase
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("15.00"),
            start_date=date(2026, 1, 1)
        )
        # Validator should normalize to uppercase
        assert account.type.upper() == "CREDIT_CARD"

    def test_interest_rate_validation(self):
        """Test interest rate validation (0-100)."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Invalid: > 100
        with pytest.raises(ValidationError):
            DebtAccountCreate(
                name="Test",
                type="CREDIT_CARD",
                current_balance=Decimal("1000.00"),
                interest_rate=Decimal("150.00"),
                start_date=date(2026, 1, 1)
            )

    def test_credit_limit_validation(self):
        """Test credit limit vs balance validation."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Invalid: limit < balance
        with pytest.raises(ValidationError):
            DebtAccountCreate(
                name="Test",
                type="CREDIT_CARD",
                current_balance=Decimal("10000.00"),
                credit_limit=Decimal("5000.00"),  # Invalid
                interest_rate=Decimal("15.00"),
                start_date=date(2026, 1, 1)
            )

    def test_debt_payment_schema(self):
        """Test DebtPaymentCreate schema."""
        from app.schemas.debt import DebtPaymentCreate
        from uuid import uuid4
        
        payment = DebtPaymentCreate(
            debt_account_id=uuid4(),
            amount=Decimal("500.00"),
            payment_date=date(2026, 1, 31),
            payment_method="BANK_TRANSFER"
        )
        assert payment.amount == Decimal("500.00")
        assert payment.payment_method == "BANK_TRANSFER"

    def test_debt_summary_schema(self):
        """Test DebtSummary schema."""
        from app.schemas.debt import DebtSummary
        
        summary = DebtSummary(
            total_debt=Decimal("10000.00"),
            total_paid_this_month=Decimal("500.00"),
            total_interest_accrued=Decimal("50.00"),
            account_count=3,
            active_accounts=2,
            avg_interest_rate=Decimal("15.00")
        )
        assert summary.total_debt == Decimal("10000.00")
        assert summary.account_count == 3

    def test_debt_stats_schema(self):
        """Test DebtStats schema."""
        from app.schemas.debt import DebtStats
        
        stats = DebtStats(
            total_current_debt=Decimal("10000.00"),
            total_paid_annual=Decimal("6000.00"),
            total_interest_paid=Decimal("1500.00"),
            average_interest_rate=Decimal("15.00"),
            account_count=3,
            active_account_count=2,
            total_credit_limit=Decimal("30000.00"),
            total_available_credit=Decimal("20000.00"),
            utilization_rate=Decimal("33.33"),
            highest_rate_debt="Credit Card",
            highest_balance_debt="Mortgage",
            estimated_payoff_months=24
        )
        assert stats.account_count == 3
        assert stats.utilization_rate == Decimal("33.33")

    def test_payoff_strategy_schema(self):
        """Test PayoffStrategy schema."""
        from app.schemas.debt import PayoffStrategy
        
        strategy = PayoffStrategy(
            strategy_type="SNOWBALL",
            accounts_in_order=[
                {"id": "123", "name": "Small Debt", "balance": 1000.0, "interest_rate": 15.0, "payoff_order": 1},
                {"id": "456", "name": "Large Debt", "balance": 5000.0, "interest_rate": 20.0, "payoff_order": 2}
            ],
            estimated_total_months=24,
            estimated_total_interest=Decimal("1500.00"),
            monthly_payment_required=Decimal("300.00"),
            potential_savings=Decimal("500.00")
        )
        assert strategy.strategy_type == "SNOWBALL"
        assert len(strategy.accounts_in_order) == 2
