# 📋 Migration Policy

## Golden Rules

1. **NEVER delete migration files** - They are historical records
2. **NEVER edit applied migrations** - Create new ones instead
3. **ALWAYS validate before running** - Use the validation script
4. **ALWAYS backup before migrating** - Use the safe migration script
5. **ALWAYS commit migration files** - Keep them in version control

## Migration Workflow

### Creating a New Migration
```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "description"

# Manually create (for complex changes)
alembic revision -m "description"

Running Migrations Safely
bash
# Use the safe migration script
python scripts/safe_migrate.py
If Things Go Wrong
bash
# Restore from backup
pg_restore -U postgres -d spendwise_db backups/db_backup_20240319_123456.sql

# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade 7c3e789f11b6
Troubleshooting
Problem	Solution
Multiple heads	alembic merge heads
Stuck revision	alembic stamp <revision>
Placeholder error	Delete bad migration, recreate
Database out of sync	Restore from backup
Prevention Checklist
Migration validated with script

Database backed up

Current state checked

All files committed to Git

Tested on staging first

text

---

### ✅ **6. Git Pre-Commit Hook**

Save as `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing migrations with placeholders

echo "🔍 Checking migration files for placeholders..."

if grep -r "previous_revision_id" alembic/versions/; then
    echo "❌ Found placeholder 'previous_revision_id' in migration files!"
    echo "Please fix before committing."
    exit 1
fi

echo "✅ Migration files look good!"
exit 0
Make it executable:

powershell
# In Git Bash or WSL
chmod +x .git/hooks/pre-commit
✅ 7. CI/CD Pipeline Check
Add to your CI/CD workflow (GitHub Actions):

yaml
name: Validate Migrations

on: [push, pull_request]

jobs:
  validate-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - name: Install dependencies
        run: pip install alembic sqlalchemy psycopg2-binary
      - name: Validate migrations
        run: python scripts/validate_migrations.py
🎯 Summary of Prevention Layers
Layer	Tool	When It Stops Problems
1. Validation Script	validate_migrations.py	Before running migrations
2. Safe Runner	safe_migrate.py	With backup & checks
3. Git Hooks	Pre-commit hook	Before committing
4. CI/CD	GitHub Actions	Before deploying
5. Policy	MIGRATION_POLICY.md	Team education
🚀 New Workflow Going Forward
powershell
# 1. NEVER manually edit migrations unless absolutely necessary
# 2. ALWAYS use the safe script:
python scripts/safe_migrate.py

# 3. If it fails, restore from backup:
pg_restore -U postgres -d spendwise_db backups/latest_backup.sql

# 4. Fix the issue, then try again
This system ensures you never lose data and never get stuck with migration issues again!

