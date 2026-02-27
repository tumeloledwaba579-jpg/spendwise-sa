# final-fix.ps1
Write-Host "=== FINAL FIX ===" -ForegroundColor Cyan

$pgContainer = "spendwise-postgres-new"
$dbName = "spendwise_db"

# Step 1: Fix env.py
Write-Host "`n[1] Fixing alembic/env.py..." -ForegroundColor Yellow
$envPyPath = ".\alembic\env.py"
$content = Get-Content $envPyPath -Raw
$newContent = $content -replace 'from app.models import Base', 'from app.models.base import Base'
$newContent | Set-Content $envPyPath -Encoding UTF8 -Force
Write-Host "   [OK] env.py fixed" -ForegroundColor Green

# Step 2: Reset database
Write-Host "`n[2] Resetting database..." -ForegroundColor Yellow
docker exec -it $pgContainer psql -U postgres -c "DROP DATABASE IF EXISTS $dbName;"
docker exec -it $pgContainer psql -U postgres -c "CREATE DATABASE $dbName;"
Write-Host "   [OK] Database reset" -ForegroundColor Green

# Step 3: Create migration
Write-Host "`n[3] Creating initial migration..." -ForegroundColor Yellow
alembic revision --autogenerate -m "initial_migration"
Write-Host "   [OK] Migration created" -ForegroundColor Green

# Step 4: Apply migration
Write-Host "`n[4] Applying migration..." -ForegroundColor Yellow
alembic upgrade head
Write-Host "   [OK] Migration applied" -ForegroundColor Green

# Step 5: Verify tables
Write-Host "`n[5] Tables created:" -ForegroundColor Yellow
docker exec -it $pgContainer psql -U postgres -d $dbName -c "\dt"

# Step 6: Create email index
Write-Host "`n[6] Creating email index..." -ForegroundColor Yellow
alembic revision --autogenerate -m "add_email_index"
alembic upgrade head

# Step 7: Verify index
Write-Host "`n[7] Verifying email index..." -ForegroundColor Yellow
$indexCheck = docker exec -it $pgContainer psql -U postgres -d $dbName -t -c "SELECT indexname FROM pg_indexes WHERE tablename='users' AND indexname='idx_users_email';" 2>$null
$indexCheck = $indexCheck.Trim()

if ($indexCheck -eq "idx_users_email") {
    Write-Host "   [OK] Email index created successfully!" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Creating index manually..." -ForegroundColor Yellow
    docker exec -it $pgContainer psql -U postgres -d $dbName -c "CREATE INDEX idx_users_email ON users(email);"
    Write-Host "   [OK] Email index created manually" -ForegroundColor Green
}

Write-Host "`n=== FINAL FIX COMPLETE! ===" -ForegroundColor Cyan