#!/bin/bash
set -e

echo "=== Fixing Alembic Multiple Heads Issue ==="

# First, let's backup the current state
BACKUP_DIR="/tmp/alembic_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r alembic/versions/* $BACKUP_DIR/ 2>/dev/null || true
echo "Backup created at: $BACKUP_DIR"

# Get the current heads
echo -e "\n=== Current heads before fix ==="
alembic heads

# Option 1: If you want to keep both and merge them
echo -e "\n=== Option 1: Merging heads ==="
echo "This creates a new migration that combines both branches"
read -p "Do you want to merge the heads? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Merging heads..."
    alembic merge heads -m "merge_production_and_test_heads"
    echo "✅ Heads merged"
fi

# Option 2: If you want to delete the test migrations
echo -e "\n=== Option 2: Removing test migrations ==="
echo "Looking for migrations with 'test' in them..."
TEST_MIGRATIONS=$(grep -l -i "test" alembic/versions/*.py 2>/dev/null || true)

if [ -n "$TEST_MIGRATIONS" ]; then
    echo "Found test migrations:"
    echo "$TEST_MIGRATIONS"
    
    read -p "Do you want to remove these test migrations? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for migration in $TEST_MIGRATIONS; do
            echo "Removing: $migration"
            rm "$migration"
        done
        
        # Also remove any .pyc files
        rm alembic/versions/*.pyc 2>/dev/null || true
        
        echo "✅ Test migrations removed"
    fi
else
    echo "No test migrations found by name. Looking at migration content..."
    
    # Check migration descriptions
    for migration in alembic/versions/*.py; do
        if grep -q "test\|Test\|TEST" "$migration"; then
            echo "Possible test migration: $migration"
            head -5 "$migration"
            echo "---"
        fi
    done
fi

# Option 3: Create a proper branching strategy
echo -e "\n=== Option 3: Setting up proper branching ==="
echo "Creating separate branches for test and production..."

# Create a new head for production
PRODUCTION_HEAD=$(alembic heads | grep -v test | head -1 | awk '{print $1}')
if [ -n "$PRODUCTION_HEAD" ]; then
    echo "Production head: $PRODUCTION_HEAD"
    
    # Stamp the database with the production head
    echo "Stamping database with production head..."
    alembic stamp "$PRODUCTION_HEAD"
    
    # Create a new empty revision as the new head
    alembic revision -m "production_head" --head "$PRODUCTION_HEAD"
else
    echo "Could not identify production head"
fi

echo -e "\n=== Final migration state ==="
alembic heads

echo -e "\n=== Ready to upgrade ==="
echo "Run: alembic upgrade head"