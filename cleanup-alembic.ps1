# final-alembic-fix.ps1
Write-Host "🔧 Final Alembic Fix - Removing Environment Variable" -ForegroundColor Cyan

# Step 1: Show current env var
Write-Host "`n[1] Current ALEMBIC_CONFIG:" -ForegroundColor Yellow
Get-ChildItem Env:ALEMBIC_CONFIG

# Step 2: Remove it
Write-Host "`n[2] Removing ALEMBIC_CONFIG environment variable..." -ForegroundColor Yellow
Remove-Item Env:ALEMBIC_CONFIG -ErrorAction SilentlyContinue
Write-Host "   ✅ Removed" -ForegroundColor Green

# Step 3: Verify it's gone
Write-Host "`n[3] Verifying removal:" -ForegroundColor Yellow
$check = Get-ChildItem Env:ALEMBIC_CONFIG -ErrorAction SilentlyContinue
if (-not $check) {
    Write-Host "   ✅ Environment variable cleared" -ForegroundColor Green
} else {
    Write-Host "   ❌ Still present: $check" -ForegroundColor Red
}

# Step 4: Reset database
Write-Host "`n[4] Resetting database..." -ForegroundColor Yellow
docker exec -it spendwise-postgres-new psql -U postgres -c "DROP DATABASE IF EXISTS spendwise_db;"
docker exec -it spendwise-postgres-new psql -U postgres -c "CREATE DATABASE spendwise_db;"
Write-Host "   ✅ Database reset" -ForegroundColor Green

# Step 5: Create fresh migration
Write-Host "`n[5] Creating fresh migration..." -ForegroundColor Yellow
alembic revision --autogenerate -m "initial_migration"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Migration created successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Migration failed" -ForegroundColor Red
    exit 1
}

# Step 6: Apply migration
Write-Host "`n[6] Applying migration..." -ForegroundColor Yellow
alembic upgrade head
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Migration applied successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Migration failed" -ForegroundColor Red
    exit 1
}

# Step 7: Verify tables
Write-Host "`n[7] Tables created:" -ForegroundColor Yellow
docker exec -it spendwise-postgres-new psql -U postgres -d spendwise_db -c "\dt"

# Step 8: Add email index
Write-Host "`n[8] Creating email index..." -ForegroundColor Yellow
alembic revision --autogenerate -m "add_email_index"
alembic upgrade head

# Step 9: Verify index
Write-Host "`n[9] Verifying email index..." -ForegroundColor Yellow
$indexCheck = docker exec -it spendwise-postgres-new psql -U postgres -d spendwise_db -t -c "SELECT indexname FROM pg_indexes WHERE tablename='users' AND indexname='idx_users_email';" 2>$null
$indexCheck = $indexCheck.Trim()

if ($indexCheck -eq "idx_users_email") {
    Write-Host "   ✅ Email index created successfully!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Creating index manually..." -ForegroundColor Yellow
    docker exec -it spendwise-postgres-new psql -U postgres -d spendwise_db -c "CREATE INDEX idx_users_email ON users(email);"
    Write-Host "   ✅ Email index created manually" -ForegroundColor Green
}

Write-Host "`n✅ FINAL FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "Run .\test-performance.ps1 to check login speed" -ForegroundColor Yellow