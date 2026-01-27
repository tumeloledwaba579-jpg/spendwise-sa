"""
Pytest configuration for SpendWise SA tests.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.core.security import create_access_token


# ============================================================================
# ASYNC & EVENT LOOP FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# AUTHENTICATION FIXTURES (Without SQLAlchemy)
# ============================================================================

class MockUser:
    """Mock user object that doesn't trigger SQLAlchemy configuration."""
    def __init__(self):
        self.id = "123e4567-e89b-12d3-a456-426614174000"
        self.email = "test@example.com"
        self.is_active = True
    
    # Don't define __init__ with SQLAlchemy relationships
    # This prevents the mapper configuration error


@pytest.fixture
def test_user():
    """Create a mock test user without SQLAlchemy."""
    return MockUser()


@pytest.fixture
def test_user_token(test_user):
    """Create a JWT token for the test user."""
    return {
        "access_token": create_access_token(
            data={"sub": test_user.email},
            expires_delta=None
        )
    }


# ============================================================================
# SERVICE MOCK FIXTURES
# ============================================================================

@pytest.fixture
def mock_db_session():
    """Create a fully mocked database session."""
    session = AsyncMock()
    
    # Mock all common session methods
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock(return_value=AsyncMock())
    session.scalar_one_or_none = AsyncMock()
    session.scalars = AsyncMock(return_value=AsyncMock())
    
    # Configure the mock to return appropriate values
    session.execute.return_value.scalar_one_or_none.return_value = None
    session.execute.return_value.scalars.return_value.all.return_value = []
    
    return session
