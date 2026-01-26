"""Add income tracking module

Revision ID: 003_add_income_tracking
Revises: 3bb02c689d40
Create Date: 2026-01-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_income_tracking'
down_revision = '3bb02c689d40'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create income tracking tables"""
    
    # Income sources table - stores income stream definitions
    op.create_table(
        'income_sources',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.VARCHAR(length=255), nullable=False),
        sa.Column('type', sa.VARCHAR(length=50), nullable=False),  # SALARY, FREELANCE, INVESTMENT, PASSIVE, CUSTOM, OTHER
        sa.Column('frequency', sa.VARCHAR(length=50), nullable=False),  # DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
        sa.Column('amount', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.VARCHAR(length=3), nullable=False, server_default='USD'),
        sa.Column('start_date', sa.DATE(), nullable=False),
        sa.Column('end_date', sa.DATE(), nullable=True),
        sa.Column('is_recurring', sa.BOOLEAN(), nullable=False, server_default='true'),
        sa.Column('is_taxable', sa.BOOLEAN(), nullable=False, server_default='true'),
        sa.Column('tax_category', sa.VARCHAR(length=50), nullable=True),  # INCOME_TAX, CAPITAL_GAINS_SHORT, CAPITAL_GAINS_LONG, DIVIDEND, SELF_EMPLOYMENT
        sa.Column('auto_tax_calculation', sa.BOOLEAN(), nullable=False, server_default='false'),
        sa.Column('tax_rate', sa.NUMERIC(precision=5, scale=2), nullable=True),  # Percentage (e.g., 15.50 for 15.5%)
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='chk_income_amount'),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='chk_income_dates'),
        sa.CheckConstraint('tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 100)', name='chk_tax_rate'),
    )
    op.create_index('idx_income_user_active', 'income_sources', ['user_id', 'is_active'])
    op.create_index('idx_income_user_created', 'income_sources', ['user_id', 'created_at'])
    
    # Income history table - actual received income records
    op.create_table(
        'income_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('income_source_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.VARCHAR(length=3), nullable=False, server_default='USD'),
        sa.Column('received_date', sa.DATE(), nullable=False),
        sa.Column('tax_amount', sa.NUMERIC(precision=12, scale=2), nullable=True),
        sa.Column('net_amount', sa.NUMERIC(precision=12, scale=2), nullable=True),
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('is_manual_entry', sa.BOOLEAN(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['income_source_id'], ['income_sources.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='chk_history_amount'),
        sa.CheckConstraint('tax_amount IS NULL OR tax_amount >= 0', name='chk_tax_amount'),
    )
    op.create_index('idx_income_history_user', 'income_history', ['user_id', 'received_date'])
    op.create_index('idx_income_history_source', 'income_history', ['income_source_id', 'received_date'])
    
    # Monthly income summary table - denormalized for fast queries
    op.create_table(
        'income_monthly_summary',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('year', sa.INTEGER(), nullable=False),
        sa.Column('month', sa.INTEGER(), nullable=False),
        sa.Column('total_income', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('total_tax', sa.NUMERIC(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('net_income', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('recurring_income', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('one_time_income', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('source_count', sa.INTEGER(), nullable=False),
        sa.Column('record_count', sa.INTEGER(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'year', 'month', name='uq_user_month'),
    )
    op.create_index('idx_summary_user_period', 'income_monthly_summary', ['user_id', 'year', 'month'])


def downgrade() -> None:
    """Drop income tracking tables"""
    op.drop_index('idx_summary_user_period', 'income_monthly_summary')
    op.drop_table('income_monthly_summary')
    op.drop_index('idx_income_history_source', 'income_history')
    op.drop_index('idx_income_history_user', 'income_history')
    op.drop_table('income_history')
    op.drop_index('idx_income_user_created', 'income_sources')
    op.drop_index('idx_income_user_active', 'income_sources')
    op.drop_table('income_sources')