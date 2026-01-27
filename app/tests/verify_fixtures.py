"""
Test to verify conftest.py fixtures work.
"""
import pytest


def test_fixture_availability(test_user_token):
    """Test that the test_user_token fixture is available and works."""
    # The fixture should return a dict with an access_token
    assert isinstance(test_user_token, dict)
    assert 'access_token' in test_user_token
    assert isinstance(test_user_token['access_token'], str)
    print(f"? test_user_token fixture works! Token: {test_user_token['access_token'][:20]}...")

@pytest.mark.asyncio
async def test_async_client_fixture(async_client):
    """Test that the async_client fixture is available."""
    # The fixture should return an AsyncClient instance
    assert async_client is not None
    print("? async_client fixture works!")

if __name__ == "__main__":
    # This allows you to run it directly for debugging
    import asyncio
    
    # Note: This won't work with pytest fixtures without pytest runner
    print("This file is meant to be run with: pytest verify_fixtures.py -v")
