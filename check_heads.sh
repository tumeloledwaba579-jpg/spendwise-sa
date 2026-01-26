#!/bin/bash
echo "=== Current Alembic Heads ==="
alembic heads

echo -e "\n=== Migration History ==="
alembic history --verbose

echo -e "\n=== Current Database Revision ==="
alembic current

echo -e "\n=== Migration Files ==="
ls -la alembic/versions/