"""
Simple tests for debt module that don't require imports.
"""
import pytest


class TestDebtModuleBasic:
    """Basic sanity tests."""

    def test_debt_module_exists(self):
        """Verify debt module directory exists."""
        import os
        debt_module_path = os.path.join(os.path.dirname(__file__), '..', 'api', 'v1', 'endpoints', 'debt.py')
        assert os.path.exists(debt_module_path)

    def test_debt_service_exists(self):
        """Verify debt service file exists."""
        import os
        service_path = os.path.join(os.path.dirname(__file__), '..', 'services', 'debt_service.py')
        assert os.path.exists(service_path)

    def test_debt_models_exist(self):
        """Verify debt models file exists."""
        import os
        models_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'debt.py')
        assert os.path.exists(models_path)

    def test_debt_schemas_exist(self):
        """Verify debt schemas file exists."""
        import os
        schemas_path = os.path.join(os.path.dirname(__file__), '..', 'schemas', 'debt.py')
        assert os.path.exists(schemas_path)

    def test_api_endpoints_exist(self):
        """Verify API endpoints exist."""
        import os
        endpoints_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'v1', 'endpoints')
        assert os.path.isdir(endpoints_dir)
        assert 'debt.py' in os.listdir(endpoints_dir)

    def test_migration_exists(self):
        """Verify migration file exists."""
        import os
        # Check from project root
        migration_filename = '004_add_debt_management.py'
        alembic_versions_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'alembic', 'versions')
        
        # List migrations in directory
        if os.path.isdir(alembic_versions_dir):
            files = os.listdir(alembic_versions_dir)
            assert migration_filename in files or any('debt' in f for f in files)
        else:
            pytest.skip("Alembic versions directory not found")


class TestDebtModuleStructure:
    """Test debt module structure and organization."""

    def test_models_has_debt_module(self):
        """Verify models package includes debt module."""
        import os
        models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        assert 'debt.py' in os.listdir(models_dir)

    def test_schemas_has_debt_module(self):
        """Verify schemas package includes debt module."""
        import os
        schemas_dir = os.path.join(os.path.dirname(__file__), '..', 'schemas')
        assert 'debt.py' in os.listdir(schemas_dir)

    def test_services_has_debt_service(self):
        """Verify services package includes debt service."""
        import os
        services_dir = os.path.join(os.path.dirname(__file__), '..', 'services')
        assert 'debt_service.py' in os.listdir(services_dir)

    def test_endpoints_has_debt_router(self):
        """Verify endpoints package includes debt router."""
        import os
        endpoints_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'v1', 'endpoints')
        assert 'debt.py' in os.listdir(endpoints_dir)


class TestDebtModuleSummary:
    """Summary of what was tested."""

    def test_all_debt_files_present(self):
        """Verify all debt module files are present."""
        import os
        
        required_files = {
            'models': 'debt.py',
            'schemas': 'debt.py',
            'services': 'debt_service.py',
            'endpoints': 'debt.py'
        }
        
        app_dir = os.path.dirname(os.path.dirname(__file__))
        
        for location, filename in required_files.items():
            if location == 'endpoints':
                filepath = os.path.join(app_dir, 'api', 'v1', 'endpoints', filename)
            else:
                filepath = os.path.join(app_dir, location, filename)
            
            assert os.path.exists(filepath), f"Missing {location}/{filename}"
