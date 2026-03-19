"""Add balance constraints to accounts

Revision ID: xxxx
Revises: previous_revision_id
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = 'xxxx'  # Your actual revision ID
down_revision = 'previous_revision_id'  # Your previous migration
branch_labels = None
depends_on = None

def upgrade():
    # ============================================================
    # 1. Add CHECK CONSTRAINT for non-negative balances
    # ============================================================
    op.create_check_constraint(
        "ck_accounts_balance_non_negative",
        "accounts",
        "balance >= 0"
    )
    
    # ============================================================
    # 2. Create FUNCTION to handle credit card balances
    # ============================================================
    op.execute("""
    CREATE OR REPLACE FUNCTION handle_credit_card_balance()
    RETURNS TRIGGER AS $$
    BEGIN
        -- For credit cards and loans, automatically convert negative to positive
        IF NEW.account_type IN ('CREDIT_CARD', 'LOAN') THEN
            NEW.balance = ABS(NEW.balance);
            RETURN NEW;
        END IF;
        
        -- For all other account types, ensure balance is non-negative
        IF NEW.balance < 0 THEN
            RAISE EXCEPTION 'Balance cannot be negative for % account. 
                Account: %, Balance: %', 
                NEW.account_type, NEW.name, NEW.balance;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # ============================================================
    # 3. Create TRIGGER that runs before insert or update
    # ============================================================
    op.execute("""
    CREATE TRIGGER trg_accounts_balance_check
        BEFORE INSERT OR UPDATE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION handle_credit_card_balance();
    """)
    
    # ============================================================
    # 4. Add INDEX for faster queries on negative balances
    # ============================================================
    op.create_index(
        'ix_accounts_balance_negative',
        'accounts',
        ['balance'],
        postgresql_where=sa.text('balance < 0')
    )
    
    # ============================================================
    # 5. Create DOMAIN type for account balance (optional but powerful)
    # ============================================================
    op.execute("""
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_balance') THEN
            CREATE DOMAIN account_balance AS NUMERIC(12,2)
            CHECK (
                VALUE >= 0 OR 
                (SELECT account_type FROM accounts WHERE id = CURRENT_ROW) IN ('CREDIT_CARD', 'LOAN')
            );
        END IF;
    END $$;
    """)

def downgrade():
    # ============================================================
    # Remove all constraints in reverse order
    # ============================================================
    
    # Drop trigger first
    op.execute("DROP TRIGGER IF EXISTS trg_accounts_balance_check ON accounts;")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS handle_credit_card_balance();")
    
    # Drop check constraint
    op.drop_constraint('ck_accounts_balance_non_negative', 'accounts', type_='check')
    
    # Drop index
    op.drop_index('ix_accounts_balance_negative', table_name='accounts')
    
    # Drop domain
    op.execute("DROP DOMAIN IF EXISTS account_balance;")