"""Add debt management module

Revision ID: 004_add_debt_management
Revises: 003_add_income_tracking
Create Date: 2026-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_debt_management'
down_revision = '003_add_income_tracking'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create debt management tables"""

    # Debt accounts table - stores credit cards, loans, etc
    op.create_table(
        'debt_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.VARCHAR(length=255), nullable=False),
        sa.Column('type', sa.VARCHAR(length=50), nullable=False),  # CREDIT_CARD, PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, STUDENT_LOAN, OTHER
        sa.Column('creditor_name', sa.VARCHAR(length=255), nullable=True),
        sa.Column('current_balance', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('credit_limit', sa.NUMERIC(precision=12, scale=2), nullable=True),
        sa.Column('interest_rate', sa.NUMERIC(precision=5, scale=2), nullable=False),  # Annual percentage rate
        sa.Column('minimum_payment', sa.NUMERIC(precision=12, scale=2), nullable=True),
        sa.Column('due_date', sa.INTEGER(), nullable=True),  # Day of month (1-31)
        sa.Column('start_date', sa.DATE(), nullable=False),
        sa.Column('payoff_date', sa.DATE(), nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), nullable=False, server_default='true'),
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('current_balance >= 0', name='chk_debt_balance'),
        sa.CheckConstraint('interest_rate >= 0 AND interest_rate <= 100', name='chk_interest_rate'),
        sa.CheckConstraint('credit_limit IS NULL OR credit_limit >= current_balance', name='chk_credit_limit'),
    )
    op.create_index('idx_debt_user_active', 'debt_accounts', ['user_id', 'is_active'])
    op.create_index('idx_debt_user_created', 'debt_accounts', ['user_id', 'created_at'])

    # Debt payments table - track payments made on debts
    op.create_table(
        'debt_payments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('debt_account_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('payment_date', sa.DATE(), nullable=False),
        sa.Column('payment_method', sa.VARCHAR(length=50), nullable=True),  # BANK_TRANSFER, CHECK, CREDIT_CARD, AUTO_PAY, OTHER
        sa.Column('notes', sa.TEXT(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['debt_account_id'], ['debt_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='chk_payment_amount'),
    )
    op.create_index('idx_payment_user', 'debt_payments', ['user_id', 'payment_date'])
    op.create_index('idx_payment_debt', 'debt_payments', ['debt_account_id', 'payment_date'])

    # Debt snapshots table - monthly balance snapshots for tracking progress
    op.create_table(
        'debt_snapshots',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('debt_account_id', sa.UUID(), nullable=False),
        sa.Column('year', sa.INTEGER(), nullable=False),
        sa.Column('month', sa.INTEGER(), nullable=False),
        sa.Column('balance_start', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('balance_end', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('total_paid', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('interest_accrued', sa.NUMERIC(precision=12, scale=2), nullable=False),
        sa.Column('payment_count', sa.INTEGER(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['debt_account_id'], ['debt_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('debt_account_id', 'year', 'month', name='uq_debt_snapshot'),
    )
    op.create_index('idx_snapshot_user_period', 'debt_snapshots', ['user_id', 'year', 'month'])


def downgrade() -> None:
    """Drop debt management tables"""
    op.drop_index('idx_snapshot_user_period', 'debt_snapshots')
    op.drop_table('debt_snapshots')
    op.drop_index('idx_payment_debt', 'debt_payments')
    op.drop_index('idx_payment_user', 'debt_payments')
    op.drop_table('debt_payments')
    op.drop_index('idx_debt_user_created', 'debt_accounts')
    op.drop_index('idx_debt_user_active', 'debt_accounts')
    op.drop_table('debt_accounts')
