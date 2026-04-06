#!/usr/bin/env python
"""Safe migration runner with validation and backup."""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

def backup_database():
    """Create a database backup before migration."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backups/db_backup_{timestamp}.sql"
    
    # Create backups directory if it doesn't exist
    Path("backups").mkdir(exist_ok=True)
    
    print(f"💾 Creating database backup: {backup_file}")
    result = subprocess.run([
        "pg_dump", "-U", "postgres", "-d", "spendwise_db",
        "-f", backup_file
    ], capture_output=True)
    
    if result.returncode == 0:
        print(f"✅ Backup created: {backup_file}")
        return backup_file
    else:
        print(f"❌ Backup failed: {result.stderr.decode()}")
        return None

def validate_migrations():
    """Run validation script."""
    print("🔍 Validating migration files...")
    result = subprocess.run([
        sys.executable, "scripts/validate_migrations.py"
    ])
    return result.returncode == 0

def check_current_state():
    """Check current Alembic state."""
    print("📊 Checking current migration state...")
    result = subprocess.run(
        ["alembic", "current"],
        capture_output=True,
        text=True
    )
    print(result.stdout)
    return result.returncode == 0

def run_migrations():
    """Run migrations with proper error handling."""
    print("🚀 Running migrations...")
    result = subprocess.run(["alembic", "upgrade", "head"])
    
    if result.returncode == 0:
        print("✅ Migrations completed successfully!")
        return True
    else:
        print("❌ Migrations failed!")
        return False

def main():
    """Main migration workflow."""
    print("=" * 50)
    print("🛡️  SAFE MIGRATION WORKFLOW")
    print("=" * 50)
    
    # Step 1: Validate migration files
    if not validate_migrations():
        print("❌ Validation failed. Aborting.")
        return 1
    
    # Step 2: Check current state
    check_current_state()
    
    # Step 3: Create backup
    backup_file = backup_database()
    if not backup_file:
        response = input("⚠️  Backup failed. Continue anyway? (y/N): ")
        if response.lower() != 'y':
            return 1
    
    # Step 4: Run migrations
    if not run_migrations():
        print(f"\n❌ Migration failed! Restore from backup: {backup_file}")
        print(f"   pg_restore -U postgres -d spendwise_db {backup_file}")
        return 1
    
    # Step 5: Verify
    print("\n🔍 Verifying final state...")
    check_current_state()
    
    print("\n✅ All done! Migrations successful.")
    return 0

if __name__ == "__main__":
    sys.exit(main())