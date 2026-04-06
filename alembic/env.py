import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# THIS IS THE IMPORTANT PART - import your models' Base
from app.models.base import Base
from app.models import user, account, category, transaction, income, debt  # import all models

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target metadata for autogenerate
target_metadata = Base.metadata

# Add this function to verify migrations before running
def run_migrations_online():
    """Run migrations in 'online' mode."""
    
    # Verify all migration files have proper down_revision
    from alembic.script import ScriptDirectory
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    
    if len(heads) > 1:
        raise Exception(f"Multiple heads detected: {heads}. Merge them first!")
    
    print(f"✅ Current head: {heads[0] if heads else 'None'}")
    
    # Rest of your existing code...
    connectable = engine_from_config(...)
    # ...

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
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