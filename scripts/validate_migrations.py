#!/usr/bin/env python
"""Validate all migration files before running them."""

import os
import re
from pathlib import Path

def validate_migration_files():
    """Check all migration files for common issues."""
    versions_dir = Path("alembic/versions")
    issues = []
    
    # Track all revision IDs
    revisions = {}
    
    for file in versions_dir.glob("*.py"):
        if file.name == "__init__.py":
            continue
            
        content = file.read_text()
        
        # Extract revision ID
        rev_match = re.search(r'revision = [\'"]([^\'"]+)[\'"]', content)
        if not rev_match:
            issues.append(f"❌ {file.name}: No revision ID found")
            continue
        
        rev_id = rev_match.group(1)
        
        # Extract down_revision
        down_match = re.search(r'down_revision = [\'"]([^\'"]+)[\'"]', content)
        down_rev = down_match.group(1) if down_match else None
        
        # Check for placeholder
        if down_rev == 'previous_revision_id':
            issues.append(f"❌ {file.name}: Contains placeholder 'previous_revision_id'")
        
        # Check for duplicate revisions
        if rev_id in revisions:
            issues.append(f"❌ {file.name}: Duplicate revision ID {rev_id} (also in {revisions[rev_id]})")
        else:
            revisions[rev_id] = file.name
    
    if issues:
        print("\n".join(issues))
        return False
    
    print("✅ All migration files look good!")
    return True

if __name__ == "__main__":
    validate_migration_files()