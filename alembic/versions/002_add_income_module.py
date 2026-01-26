"""Add income module

Revision ID: 002_add_income_module
Revises: 3bb02c689d40
Create Date: 2026-01-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_income_module'
down_revision = '3bb02c689d40'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create income module tables"""
    
    # Income sources table
    op.create_table(
        'income_sources',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.VARCHAR(length=255), nullable=False),
        sa.Column('type', sa.VARCHAR(length=50), nullable=False),
        sa.Column('frequency', sa.VARCHAR(length=50), nullable=False),
        sa.Column('amount', sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column('start_date', sa.DATE(), nullable=False),
        sa.Column('end_date', sa.DATE(), nullable=True),
        sa.Column('is_recurring', sa.BOOLEAN(), server_default='true', nullable=False),
        sa.Column('is_taxable', sa.BOOLEAN(), server_default='true', nullable=False),
        sa.Column('tax_category', sa.VARCHAR(length=50), nullable=True),
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='chk_amount'),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_dates'),
    )
    op.create_index('idx_user_created', 'income_sources', ['user_id', 'created_at'])
    
    # Income history table
    op.create_table(
        'income_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('income_source_id', sa.UUID(), nullable=True),
        sa.Column('amount', sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column('received_date', sa.DATE(), nullable=False),
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['income_source_id'], ['income_sources.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_user_received', 'income_history', ['user_id', 'received_date'])
    
    # Monthly income summary table
    op.create_table(
        'income_monthly_summary',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('year', sa.INTEGER(), nullable=False),
        sa.Column('month', sa.INTEGER(), nullable=False),
        sa.Column('total_income', sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column('recurring_income', sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column('one_time_income', sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column('source_count', sa.INTEGER(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'year', 'month', name='uq_user_period'),
    )
    op.create_index('idx_user_period', 'income_monthly_summary', ['user_id', 'year', 'month'])


def downgrade() -> None:
    """Drop income module tables"""
    op.drop_index('idx_user_period', 'income_monthly_summary')
    op.drop_table('income_monthly_summary')
    op.drop_index('idx_user_received', 'income_history')
    op.drop_table('income_history')
    op.drop_index('idx_user_created', 'income_sources')
    op.drop_table('income_sources')