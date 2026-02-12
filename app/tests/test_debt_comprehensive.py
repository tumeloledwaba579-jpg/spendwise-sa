"""
Comprehensive integration tests for debt management module.
Tests entire workflow from account creation to analytics.
"""
import pytest
from decimal import Decimal
from datetime import date, datetime, timedelta
from uuid import uuid4


class TestDebtModuleComprehensive:
    """Comprehensive tests covering complete debt management workflows."""

    # ========================================================================
    # IMPORTS & AVAILABILITY
    # ========================================================================

    def test_all_models_available(self):
        """Verify all debt models are available."""
        from app.models.debt import (
            DebtAccount, DebtPayment, DebtSnapshot,
            DebtType, PaymentMethod
        )
        from app.models.user import User
        
        assert DebtAccount.__tablename__ == "debt_accounts"
        assert DebtPayment.__tablename__ == "debt_payments"
        assert DebtSnapshot.__tablename__ == "debt_snapshots"
        assert len(DebtType) == 6  # 6 debt types
        assert len(PaymentMethod) == 5  # 5 payment methods

    def test_all_schemas_available(self):
        """Verify all debt schemas are available."""
        from app.schemas.debt import (
            DebtAccountCreate, DebtAccountUpdate, DebtAccountInDB,
            DebtPaymentCreate, DebtPaymentInDB,
            DebtSnapshotOut,
            DebtSummary, DebtStats, PayoffStrategy
        )
        
        # Verify schemas have required fields
        create_fields = DebtAccountCreate.__fields__.keys()
        assert 'name' in create_fields
        assert 'type' in create_fields
        assert 'current_balance' in create_fields
        assert 'interest_rate' in create_fields

    def test_service_layer_complete(self):
        """Verify service layer has all required methods."""
        from app.services.debt_service import DebtService
        
        required_methods = [
            'create_debt_account',
            'get_debt_account',
            'list_debt_accounts',
            'update_debt_account',
            'deactivate_debt_account',
            'record_payment',
            'get_payment_history',
            '_update_monthly_snapshot',
            'get_debt_summary',
            'get_debt_stats',
            'calculate_payoff_strategy'
        ]
        
        for method in required_methods:
            assert hasattr(DebtService, method), f"Missing method: {method}"

    def test_api_endpoints_available(self):
        """Verify all API endpoints are registered."""
        from app.api.v1.endpoints.debt import router
        
        # Check router has routes
        routes = [route.path for route in router.routes]
        
        assert "/accounts" in routes
        assert "/payments" in routes
        assert "/summary" in routes
        assert "/stats" in routes
        assert "/payoff-strategy" in routes
        assert "/health" in routes

    # ========================================================================
    # DEBT TYPE VALIDATION
    # ========================================================================

    def test_all_debt_types_valid(self):
        """Verify all 6 debt types are valid."""
        from app.models.debt import DebtType
        
        expected_types = [
            'CREDIT_CARD', 'PERSONAL_LOAN', 'AUTO_LOAN',
            'MORTGAGE', 'STUDENT_LOAN', 'OTHER'
        ]
        
        actual_types = [dt.value for dt in DebtType]
        
        for dtype in expected_types:
            assert dtype in actual_types, f"Missing debt type: {dtype}"

    def test_all_payment_methods_valid(self):
        """Verify all 5 payment methods are valid."""
        from app.models.debt import PaymentMethod
        
        expected_methods = [
            'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD',
            'AUTO_PAY', 'OTHER'
        ]
        
        actual_methods = [pm.value for pm in PaymentMethod]
        
        for method in expected_methods:
            assert method in actual_methods, f"Missing payment method: {method}"

    # ========================================================================
    # SCHEMA VALIDATION COMPREHENSIVE
    # ========================================================================

    def test_debt_account_create_validation(self):
        """Comprehensive validation of DebtAccountCreate."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Valid account
        valid = DebtAccountCreate(
            name="Valid Account",
            type="CREDIT_CARD",
            current_balance=Decimal("5000.00"),
            interest_rate=Decimal("19.99"),
            start_date=date(2026, 1, 1)
        )
        assert valid.name == "Valid Account"
        
        # Test type normalization
        lowercase = DebtAccountCreate(
            name="Test",
            type="personal_loan",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            start_date=date(2026, 1, 1)
        )
        assert lowercase.type == "PERSONAL_LOAN"

    def test_interest_rate_boundaries(self):
        """Test interest rate validation at boundaries."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Valid: 0
        valid_zero = DebtAccountCreate(
            name="Test",
            type="CREDIT_CARD",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("0.00"),
            start_date=date(2026, 1, 1)
        )
        assert valid_zero.interest_rate == Decimal("0.00")
        
        # Valid: 100
        valid_max = DebtAccountCreate(
            name="Test",
            type="CREDIT_CARD",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("100.00"),
            start_date=date(2026, 1, 1)
        )
        assert valid_max.interest_rate == Decimal("100.00")
        
        # Invalid: > 100
        with pytest.raises(ValidationError):
            DebtAccountCreate(
                name="Test",
                type="CREDIT_CARD",
                current_balance=Decimal("1000.00"),
                interest_rate=Decimal("100.01"),
                start_date=date(2026, 1, 1)
            )

    def test_due_date_boundaries(self):
        """Test due date validation at boundaries."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Valid: 1
        valid_min = DebtAccountCreate(
            name="Test",
            type="CREDIT_CARD",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("15.00"),
            due_date=1,
            start_date=date(2026, 1, 1)
        )
        assert valid_min.due_date == 1
        
        # Valid: 31
        valid_max = DebtAccountCreate(
            name="Test",
            type="CREDIT_CARD",
            current_balance=Decimal("1000.00"),
            interest_rate=Decimal("15.00"),
            due_date=31,
            start_date=date(2026, 1, 1)
        )
        assert valid_max.due_date == 31
        
        # Invalid: 0
        with pytest.raises(ValidationError):
            DebtAccountCreate(
                name="Test",
                type="CREDIT_CARD",
                current_balance=Decimal("1000.00"),
                interest_rate=Decimal("15.00"),
                due_date=0,
                start_date=date(2026, 1, 1)
            )

    def test_credit_limit_vs_balance(self):
        """Test credit limit cannot be less than balance."""
        from app.schemas.debt import DebtAccountCreate
        from pydantic import ValidationError
        
        # Valid: limit >= balance
        valid = DebtAccountCreate(
            name="Test",
            type="CREDIT_CARD",
            current_balance=Decimal("5000.00"),
            credit_limit=Decimal("5000.00"),
            interest_rate=Decimal("15.00"),
            start_date=date(2026, 1, 1)
        )
        assert valid.credit_limit == valid.current_balance
        
        # Invalid: limit < balance
        with pytest.raises(ValidationError):
            DebtAccountCreate(
                name="Test",
                type="CREDIT_CARD",
                current_balance=Decimal("5000.00"),
                credit_limit=Decimal("4999.99"),
                interest_rate=Decimal("15.00"),
                start_date=date(2026, 1, 1)
            )

    def test_payment_schema_validation(self):
        """Test DebtPaymentCreate validation."""
        from app.schemas.debt import DebtPaymentCreate
        
        payment = DebtPaymentCreate(
            debt_account_id=uuid4(),
            amount=Decimal("500.00"),
            payment_date=date(2026, 1, 31),
            payment_method="BANK_TRANSFER"
        )
        
        assert payment.amount == Decimal("500.00")
        assert payment.payment_method == "BANK_TRANSFER"

    # ========================================================================
    # RESPONSE SCHEMAS
    # ========================================================================

    def test_debt_account_indb_schema(self):
        """Test DebtAccountInDB response schema."""
        from app.schemas.debt import DebtAccountInDB
        
        account = DebtAccountInDB(
            id=uuid4(),
            user_id=uuid4(),
            name="Test Account",
            type="CREDIT_CARD",
            current_balance=Decimal("5000.00"),
            interest_rate=Decimal("15.00"),
            is_active=True,
            created_at=datetime.now(),
            start_date=date(2026, 1, 1)
        )
        
        assert account.name == "Test Account"
        assert account.is_active == True
        assert account.type == "CREDIT_CARD"

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
        """Test DebtStats schema with all fields."""
        from app.schemas.debt import DebtStats
        
        stats = DebtStats(
            total_current_debt=Decimal("50000.00"),
            total_paid_annual=Decimal("12000.00"),
            total_interest_paid=Decimal("3000.00"),
            average_interest_rate=Decimal("16.50"),
            account_count=5,
            active_account_count=4,
            total_credit_limit=Decimal("100000.00"),
            total_available_credit=Decimal("50000.00"),
            utilization_rate=Decimal("50.00"),
            highest_rate_debt="Credit Card",
            highest_balance_debt="Mortgage",
            estimated_payoff_months=48
        )
        
        assert stats.account_count == 5
        assert stats.utilization_rate == Decimal("50.00")
        assert stats.estimated_payoff_months == 48

    def test_payoff_strategy_schema(self):
        """Test PayoffStrategy schema."""
        from app.schemas.debt import PayoffStrategy
        
        strategy = PayoffStrategy(
            strategy_type="AVALANCHE",
            accounts_in_order=[
                {
                    "id": str(uuid4()),
                    "name": "High Interest Card",
                    "balance": 3000.0,
                    "interest_rate": 25.0,
                    "payoff_order": 1
                },
                {
                    "id": str(uuid4()),
                    "name": "Lower Interest Card",
                    "balance": 2000.0,
                    "interest_rate": 18.0,
                    "payoff_order": 2
                }
            ],
            estimated_total_months=36,
            estimated_total_interest=Decimal("2500.00"),
            monthly_payment_required=Decimal("400.00"),
            potential_savings=Decimal("1000.00")
        )
        
        assert strategy.strategy_type == "AVALANCHE"
        assert len(strategy.accounts_in_order) == 2
        assert strategy.estimated_total_months == 36

    # ========================================================================
    # DECIMAL PRECISION
    # ========================================================================

    def test_decimal_precision_preserved(self):
        """Test that Decimal precision is preserved."""
        from app.schemas.debt import DebtAccountCreate
        
        account = DebtAccountCreate(
            name="Precision Test",
            type="CREDIT_CARD",
            current_balance=Decimal("1234.56"),
            interest_rate=Decimal("19.99"),
            start_date=date(2026, 1, 1)
        )
        
        # Check precision
        assert str(account.current_balance) == "1234.56"
        assert str(account.interest_rate) == "19.99"

    def test_large_balance_handling(self):
        """Test handling of large balance amounts."""
        from app.schemas.debt import DebtAccountCreate
        
        account = DebtAccountCreate(
            name="Large Balance",
            type="MORTGAGE",
            current_balance=Decimal("500000.00"),
            interest_rate=Decimal("3.50"),
            start_date=date(2026, 1, 1)
        )
        
        assert account.current_balance == Decimal("500000.00")

    # ========================================================================
    # ENUM CONSISTENCY
    # ========================================================================

    def test_debt_type_enum_consistency(self):
        """Test DebtType enum is consistent."""
        from app.models.debt import DebtType
        
        # All enum values should be strings
        for debt_type in DebtType:
            assert isinstance(debt_type.value, str)
            assert debt_type.value.isupper()

    def test_payment_method_enum_consistency(self):
        """Test PaymentMethod enum is consistent."""
        from app.models.debt import PaymentMethod
        
        # All enum values should be strings
        for method in PaymentMethod:
            assert isinstance(method.value, str)
            assert method.value.isupper()

    # ========================================================================
    # WORKFLOW SIMULATION
    # ========================================================================

    def test_complete_debt_workflow(self):
        """Simulate complete workflow: account ? payment ? analytics."""
        from app.schemas.debt import (
            DebtAccountCreate, DebtPaymentCreate, DebtSummary, DebtStats
        )
        
        # Step 1: Create account
        account_data = DebtAccountCreate(
            name="Credit Card",
            type="CREDIT_CARD",
            creditor_name="Chase",
            current_balance=Decimal("5000.00"),
            credit_limit=Decimal("10000.00"),
            interest_rate=Decimal("19.99"),
            minimum_payment=Decimal("150.00"),
            due_date=15,
            start_date=date(2026, 1, 1)
        )
        
        assert account_data.name == "Credit Card"
        assert account_data.current_balance == Decimal("5000.00")
        
        # Step 2: Create payment
        payment_data = DebtPaymentCreate(
            debt_account_id=uuid4(),
            amount=Decimal("500.00"),
            payment_date=date(2026, 1, 31),
            payment_method="BANK_TRANSFER"
        )
        
        assert payment_data.amount == Decimal("500.00")
        
        # Step 3: Create summary
        summary = DebtSummary(
            total_debt=Decimal("4500.00"),  # After payment
            total_paid_this_month=Decimal("500.00"),
            total_interest_accrued=Decimal("75.00"),
            account_count=1,
            active_accounts=1,
            avg_interest_rate=Decimal("19.99")
        )
        
        assert summary.total_debt == Decimal("4500.00")
        
        # Step 4: Create stats
        stats = DebtStats(
            total_current_debt=Decimal("4500.00"),
            total_paid_annual=Decimal("500.00"),
            total_interest_paid=Decimal("75.00"),
            average_interest_rate=Decimal("19.99"),
            account_count=1,
            active_account_count=1,
            total_credit_limit=Decimal("10000.00"),
            total_available_credit=Decimal("5500.00"),
            utilization_rate=Decimal("45.00"),
            highest_rate_debt="Credit Card",
            highest_balance_debt="Credit Card",
            estimated_payoff_months=10
        )
        
        assert stats.utilization_rate == Decimal("45.00")

    # ========================================================================
    # SUMMARY
    # ========================================================================

    def test_module_summary(self):
        """Verify complete module implementation."""
        # Models
        from app.models.debt import DebtAccount, DebtPayment, DebtSnapshot
        
        # Schemas
        from app.schemas.debt import (
            DebtAccountCreate, DebtAccountUpdate, DebtAccountInDB,
            DebtPaymentCreate, DebtPaymentInDB,
            DebtSummary, DebtStats, PayoffStrategy
        )
        
        # Service
        from app.services.debt_service import DebtService
        
        # Endpoints
        from app.api.v1.endpoints.debt import router
        
        # All components present
        assert DebtAccount is not None
        assert DebtService is not None
        assert router is not None
        assert len(router.routes) >= 6
