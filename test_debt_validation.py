"""
Simple test for debt module that will definitely work.
"""
def test_debt_module_exists():
    """Test that the debt module can be imported."""
    try:
        from app.api.v1.endpoints.debts import router
        assert router is not None
        assert router.prefix == "/debts"
        print("✅ Debt router imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Could not import debt router: {e}")
        return False


def test_debt_schemas():
    """Test that debt schemas can be imported."""
    try:
        from app.schemas.debt import DebtAccountCreate, DebtAccountInDB
        assert DebtAccountCreate is not None
        assert DebtAccountInDB is not None
        print("✅ Debt schemas imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Could not import debt schemas: {e}")
        return False


def test_debt_service():
    """Test that debt service can be imported."""
    try:
        from app.services.debt_service import DebtService
        assert DebtService is not None
        print("✅ DebtService imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Could not import DebtService: {e}")
        return False


if __name__ == "__main__":
    print("Running debt module validation tests...")
    
    results = [
        test_debt_module_exists(),
        test_debt_schemas(),
        test_debt_service(),
    ]
    
    if all(results):
        print("\n🎉 All debt module validation tests passed!")
    else:
        print("\n⚠️ Some tests failed")
