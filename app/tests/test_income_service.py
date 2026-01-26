"""
Comprehensive tests for income tracking service.
"""
import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary
from app.models.user import User
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceUpdate,
    IncomeHistoryCreate, IncomeStats
)
from app.services.income_service import IncomeService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
async def test_user(session: AsyncSession):
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="income_test@example.com",
        hashed_password="fake_hash",
        full_name="Test User",
        is_active=True
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
def salary_source_data():
    """Salary income source data."""
    return IncomeSourceCreate(
        name="Primary Salary",
        type="SALARY",
        frequency="MONTHLY",
        amount=Decimal("5000.00"),
        currency="USD",
        start_date=date(2026, 1, 1),
        is_recurring=True,
        is_taxable=True,
        tax_category="INCOME_TAX",
        auto_tax_calculation=True,
        tax_rate=Decimal("20.0")
    )


@pytest.fixture
def freelance_source_data():
    """Freelance income source data."""
    return IncomeSourceCreate(
        name="Freelance Projects",
        type="FREELANCE",
        frequency="MONTHLY",
        amount=Decimal("2000.00"),
        currency="USD",
        start_date=date(2026, 1, 1),
        is_recurring=True,
        is_taxable=True,
        tax_category="SELF_EMPLOYMENT",
        auto_tax_calculation=False
    )


@pytest.fixture
def bonus_source_data():
    """One-time bonus data."""
    return IncomeSourceCreate(
        name="Annual Bonus",
        type="CUSTOM",
        frequency="YEARLY",
        amount=Decimal("10000.00"),
        currency="USD",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 31),
        is_recurring=False,
        is_taxable=True
    )


# ============================================================================
# INCOME SOURCE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_create_income_source(session: AsyncSession, test_user: User, salary_source_data):
    """Test creating an income source."""
    source = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    assert source.id is not None
    assert source.user_id == test_user.id
    assert source.name == "Primary Salary"
    assert source.type == "SALARY"
    assert source.amount == Decimal("5000.00")
    assert source.is_active is True
    assert source.created_at is not None


@pytest.mark.asyncio
async def test_get_income_source(session: AsyncSession, test_user: User, salary_source_data):
    """Test retrieving a specific income source."""
    created = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    retrieved = await IncomeService.get_income_source(session, test_user.id, created.id)
    
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.name == "Primary Salary"


@pytest.mark.asyncio
async def test_get_nonexistent_income_source(session: AsyncSession, test_user: User):
    """Test retrieving non-existent income source returns None."""
    fake_id = uuid4()
    result = await IncomeService.get_income_source(session, test_user.id, fake_id)
    
    assert result is None


@pytest.mark.asyncio
async def test_list_income_sources(session: AsyncSession, test_user: User, salary_source_data, freelance_source_data):
    """Test listing income sources."""
    await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    await IncomeService.create_income_source(session, test_user.id, freelance_source_data)
    
    sources = await IncomeService.list_income_sources(session, test_user.id)
    
    assert len(sources) == 2
    assert sources[0].type in ["SALARY", "FREELANCE"]
    assert sources[1].type in ["SALARY", "FREELANCE"]


@pytest.mark.asyncio
async def test_update_income_source(session: AsyncSession, test_user: User, salary_source_data):
    """Test updating an income source."""
    created = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    update_data = IncomeSourceUpdate(
        amount=Decimal("5500.00"),
        tax_rate=Decimal("22.0")
    )
    updated = await IncomeService.update_income_source(session, test_user.id, created.id, update_data)
    
    assert updated.amount == Decimal("5500.00")
    assert updated.tax_rate == Decimal("22.0")
    assert updated.name == "Primary Salary"  # Unchanged


@pytest.mark.asyncio
async def test_deactivate_income_source(session: AsyncSession, test_user: User, salary_source_data):
    """Test deactivating an income source."""
    created = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    deactivated = await IncomeService.deactivate_income_source(session, test_user.id, created.id)
    
    assert deactivated.is_active is False
    
    # Verify it doesn't show in active-only list
    active_sources = await IncomeService.list_income_sources(session, test_user.id, active_only=True)
    assert len(active_sources) == 0


# ============================================================================
# INCOME HISTORY TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_record_income(session: AsyncSession, test_user: User, salary_source_data):
    """Test recording actual income."""
    source = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    history_data = IncomeHistoryCreate(
        income_source_id=source.id,
        amount=Decimal("5000.00"),
        currency="USD",
        received_date=date(2026, 1, 31),
        tax_amount=Decimal("1000.00"),
        is_manual_entry=True
    )
    
    record = await IncomeService.record_income(session, test_user.id, history_data)
    
    assert record.id is not None
    assert record.amount == Decimal("5000.00")
    assert record.tax_amount == Decimal("1000.00")
    assert record.net_amount == Decimal("4000.00")
    assert record.is_manual_entry is True


@pytest.mark.asyncio
async def test_get_income_history(session: AsyncSession, test_user: User, salary_source_data):
    """Test retrieving income history."""
    source = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    # Record multiple incomes
    for day in [10, 20, 31]:
        history_data = IncomeHistoryCreate(
            income_source_id=source.id,
            amount=Decimal("5000.00"),
            received_date=date(2026, 1, day),
            is_manual_entry=True
        )
        await IncomeService.record_income(session, test_user.id, history_data)
    
    # Retrieve all
    all_records = await IncomeService.get_income_history(session, test_user.id)
    assert len(all_records) == 3
    
    # Retrieve with date filter
    filtered = await IncomeService.get_income_history(
        session, test_user.id,
        start_date=date(2026, 1, 15),
        end_date=date(2026, 1, 25)
    )
    assert len(filtered) == 1  # Only the 20th


# ============================================================================
# MONTHLY SUMMARY TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_monthly_summary_calculation(session: AsyncSession, test_user: User, salary_source_data, freelance_source_data):
    """Test monthly summary is calculated correctly."""
    salary = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    freelance = await IncomeService.create_income_source(session, test_user.id, freelance_source_data)
    
    # Record incomes
    await IncomeService.record_income(
        session, test_user.id,
        IncomeHistoryCreate(
            income_source_id=salary.id,
            amount=Decimal("5000.00"),
            received_date=date(2026, 1, 31),
            tax_amount=Decimal("1000.00"),
            is_manual_entry=True
        )
    )
    
    await IncomeService.record_income(
        session, test_user.id,
        IncomeHistoryCreate(
            income_source_id=freelance.id,
            amount=Decimal("2000.00"),
            received_date=date(2026, 1, 30),
            is_manual_entry=True
        )
    )
    
    # Get summary
    summary = await IncomeService.get_monthly_summary(session, test_user.id, 2026, 1)
    
    assert summary is not None
    assert summary.total_income == Decimal("7000.00")
    assert summary.total_tax == Decimal("1000.00")
    assert summary.net_income == Decimal("6000.00")
    assert summary.recurring_income == Decimal("7000.00")  # Both are recurring
    assert summary.one_time_income == Decimal("0.00")
    assert summary.source_count == 2
    assert summary.record_count == 2


@pytest.mark.asyncio
async def test_monthly_summary_with_bonus(session: AsyncSession, test_user: User, salary_source_data, bonus_source_data):
    """Test monthly summary distinguishes recurring vs one-time."""
    salary = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    bonus = await IncomeService.create_income_source(session, test_user.id, bonus_source_data)
    
    # Record both
    await IncomeService.record_income(
        session, test_user.id,
        IncomeHistoryCreate(
            income_source_id=salary.id,
            amount=Decimal("5000.00"),
            received_date=date(2026, 1, 31),
            is_manual_entry=True
        )
    )
    
    await IncomeService.record_income(
        session, test_user.id,
        IncomeHistoryCreate(
            income_source_id=bonus.id,
            amount=Decimal("10000.00"),
            received_date=date(2026, 1, 15),
            is_manual_entry=True
        )
    )
    
    summary = await IncomeService.get_monthly_summary(session, test_user.id, 2026, 1)
    
    assert summary.total_income == Decimal("15000.00")
    assert summary.recurring_income == Decimal("5000.00")
    assert summary.one_time_income == Decimal("10000.00")


# ============================================================================
# ANALYTICS TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_predict_next_month_income(session: AsyncSession, test_user: User, salary_source_data, freelance_source_data):
    """Test income prediction for next month."""
    salary = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    freelance = await IncomeService.create_income_source(session, test_user.id, freelance_source_data)
    
    prediction = await IncomeService.predict_next_month_income(session, test_user.id)
    
    # Should sum both recurring sources: 5000 + 2000 = 7000
    assert prediction == Decimal("7000.00")


@pytest.mark.asyncio
async def test_get_income_stats(session: AsyncSession, test_user: User, salary_source_data):
    """Test income statistics calculation."""
    source = await IncomeService.create_income_source(session, test_user.id, salary_source_data)
    
    # Record monthly incomes for current year
    for month in [1, 2, 3]:
        await IncomeService.record_income(
            session, test_user.id,
            IncomeHistoryCreate(
                income_source_id=source.id,
                amount=Decimal("5000.00"),
                received_date=date(2026, month, 15),
                tax_amount=Decimal("1000.00"),
                is_manual_entry=True
            )
        )
    
    stats = await IncomeService.get_income_stats(session, test_user.id, 2026)
    
    assert stats.total_annual_income == Decimal("15000.00")
    assert stats.total_tax_paid == Decimal("3000.00")
    assert stats.net_annual_income == Decimal("12000.00")
    assert stats.average_monthly_income == Decimal("1250.00")  # 15000 / 12
    assert stats.recurring_income_count == 1
    assert stats.top_source_name == "Primary Salary"
    assert stats.top_source_amount == Decimal("15000.00")


# ============================================================================
# VALIDATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_invalid_income_type(test_user: User):
    """Test validation rejects invalid income type."""
    invalid_data = IncomeSourceCreate(
        name="Invalid",
        type="INVALID_TYPE",  # Invalid
        frequency="MONTHLY",
        amount=Decimal("1000.00"),
        start_date=date(2026, 1, 1)
    )
    
    with pytest.raises(ValueError):
        invalid_data.dict()  # Validation should fail


@pytest.mark.asyncio
async def test_invalid_frequency(test_user: User):
    """Test validation rejects invalid frequency."""
    invalid_data = IncomeSourceCreate(
        name="Invalid",
        type="SALARY",
        frequency="INVALID_FREQ",  # Invalid
        amount=Decimal("1000.00"),
        start_date=date(2026, 1, 1)
    )
    
    with pytest.raises(ValueError):
        invalid_data.dict()


@pytest.mark.asyncio
async def test_invalid_date_range(test_user: User):
    """Test validation rejects end_date before start_date."""
    invalid_data = IncomeSourceCreate(
        name="Invalid",
        type="SALARY",
        frequency="MONTHLY",
        amount=Decimal("1000.00"),
        start_date=date(2026, 12, 31),
        end_date=date(2026, 1, 1)  # Before start_date
    )
    
    with pytest.raises(ValueError):
        invalid_data.dict()


@pytest.mark.asyncio
async def test_negative_amount_validation(test_user: User):
    """Test validation rejects negative amounts."""
    invalid_data = IncomeSourceCreate(
        name="Invalid",
        type="SALARY",
        frequency="MONTHLY",
        amount=Decimal("-1000.00"),  # Negative
        start_date=date(2026, 1, 1)
    )
    
    with pytest.raises(ValueError):
        invalid_data.dict()


@pytest.mark.asyncio
async def test_tax_amount_exceeds_income(test_user: User, salary_source_data):
    """Test validation rejects tax > income."""
    invalid_history = IncomeHistoryCreate(
        income_source_id=uuid4(),
        amount=Decimal("1000.00"),
        received_date=date(2026, 1, 31),
        tax_amount=Decimal("1500.00")  # Exceeds amount
    )
    
    with pytest.raises(ValueError):
        invalid_history.dict()

