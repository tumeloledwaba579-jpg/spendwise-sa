# recovery.ps1 - Run this as Administrator
Write-Host "=== Recovery Script ===" -ForegroundColor Cyan

# Stop execution on errors
$ErrorActionPreference = "Stop"

# 1. Kill any Python processes that might be locking files
Write-Host "`n[1] Stopping Python processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Remove broken venv
Write-Host "`n[2] Removing broken virtual environment..." -ForegroundColor Yellow
Remove-Item .\venv -Recurse -Force -ErrorAction SilentlyContinue

# 3. Create fresh venv
Write-Host "`n[3] Creating fresh virtual environment..." -ForegroundColor Yellow
python -m venv venv --clear

# 4. Activate and install
Write-Host "`n[4] Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# 5. Upgrade pip
Write-Host "`n[5] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# 6. Install packages with --no-cache-dir to avoid permission issues
Write-Host "`n[6] Installing packages..." -ForegroundColor Yellow
pip install --no-cache-dir fastapi uvicorn sqlalchemy asyncpg alembic pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart redis psycopg2-binary

# 7. Verify alembic
Write-Host "`n[7] Verifying alembic installation..." -ForegroundColor Yellow
$alembicPath = Get-Command alembic -ErrorAction SilentlyContinue
if ($alembicPath) {
    Write-Host "   [OK] Alembic found at: $($alembicPath.Source)" -ForegroundColor Green
    & alembic --version
} else {
    Write-Host "   [WARN] Alembic not found in PATH" -ForegroundColor Yellow
    Write-Host "   Looking in venv scripts..." -ForegroundColor Yellow
    $alembicExe = Get-ChildItem -Path .\venv -Recurse -Filter "alembic.exe" | Select-Object -First 1
    if ($alembicExe) {
        Write-Host "   [OK] Found at: $($alembicExe.FullName)" -ForegroundColor Green
        & $alembicExe.FullName --version
    }
}

# 8. Reset database
Write-Host "`n[8] Resetting database..." -ForegroundColor Yellow
docker exec -it spendwise-postgres-new psql -U postgres -c "DROP DATABASE IF EXISTS spendwise_db;"
docker exec -it spendwise-postgres-new psql -U postgres -c "CREATE DATABASE spendwise_db;"

# 9. Initialize Alembic
Write-Host "`n[9] Initializing Alembic..." -ForegroundColor Yellow
if (Get-Command alembic -ErrorAction SilentlyContinue) {
    alembic init alembic
} else {
    $alembicExe = Get-ChildItem -Path .\venv -Recurse -Filter "alembic.exe" | Select-Object -First 1
    if ($alembicExe) {
        & $alembicExe.FullName init alembic
    }
}

Write-Host "`n=== Recovery complete! ===" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "1. Configure alembic/env.py with your settings"
Write-Host "2. Run: alembic revision --autogenerate -m 'initial_migration'"
Write-Host "3. Run: alembic upgrade head"