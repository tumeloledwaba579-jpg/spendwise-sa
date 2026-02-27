# final-solution.ps1
Write-Host "🎯 FINAL SOLUTION - COMPLETE RESET" -ForegroundColor Magenta

# 1. Deactivate current environment
deactivate

# 2. Delete the entire project virtual environment
Write-Host "`n[1] Removing virtual environment..." -ForegroundColor Yellow
Remove-Item .\venv -Recurse -Force -ErrorAction SilentlyContinue

# 3. Delete all Python cache files
Write-Host "`n[2] Cleaning Python cache..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Recurse -Filter "*.pyc" | Remove-Item -Force

# 4. Reset database (one last time)
Write-Host "`n[3] Resetting database..." -ForegroundColor Yellow
docker exec -it spendwise-postgres-new psql -U postgres -c "DROP DATABASE IF EXISTS spendwise_db;"
docker exec -it spendwise-postgres-new psql -U postgres -c "CREATE DATABASE spendwise_db;"

# 5. Create brand new virtual environment
Write-Host "`n[4] Creating fresh virtual environment..." -ForegroundColor Yellow
python -m venv venv

# 6. Activate it
.\venv\Scripts\activate

# 7. Install packages from scratch
Write-Host "`n[5] Installing dependencies..." -ForegroundColor Yellow
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy asyncpg alembic pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart redis psycopg2-binary

# 8. Reinitialize Alembic
Write-Host "`n[6] Initializing fresh Alembic..." -ForegroundColor Yellow
alembic init alembic

# 9. Configure env.py with your sync version
$envPyContent = @'
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models.base import Base
from app.core.config import settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_sync_database_url():
    db_url = settings.DATABASE_URL
    if db_url.startswith('postgresql+asyncpg://'):
        db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
    return db_url

def run_migrations_offline() -> None:
    url = get_sync_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = get_sync_database_url()
    connectable = engine_from_config(
        configuration,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
'@

$envPyContent | Set-Content .\alembic\env.py -Encoding UTF8 -Force

# 10. Update alembic.ini
$iniContent = Get-Content .\alembic.ini -Raw
$iniContent = $iniContent -replace 'sqlalchemy.url = .*', 'sqlalchemy.url = postgresql://postgres:root123@localhost:5432/spendwise_db'
$iniContent | Set-Content .\alembic.ini -Encoding UTF8 -Force

# 11. Create migration
Write-Host "`n[7] Creating initial migration..." -ForegroundColor Yellow
alembic revision --autogenerate -m "initial_migration"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! Ghost revision exorcised!" -ForegroundColor Green
    alembic upgrade head
    
    # 12. Verify tables
    Write-Host "`n[8] Tables created:" -ForegroundColor Yellow
    docker exec -it spendwise-postgres-new psql -U postgres -d spendwise_db -c "\dt"
    
    # 13. Add email index
    Write-Host "`n[9] Creating email index..." -ForegroundColor Yellow
    alembic revision --autogenerate -m "add_email_index"
    alembic upgrade head
    
    Write-Host "`n✅ All done! The ghost revision has been vanquished!" -ForegroundColor Green
} else {
    Write-Host "❌ The ghost is too powerful. This is now a Python installation issue." -ForegroundColor Red
    Write-Host "Consider reinstalling Python completely." -ForegroundColor Yellow
}