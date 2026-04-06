# Save as fix_balances.py and run
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.account import Account
from sqlalchemy import select

async def fix_negative_balances():
    async with AsyncSessionLocal() as session:
        # Find all accounts with negative balance
        result = await session.execute(
            select(Account).where(Account.balance < 0)
        )
        negative_accounts = result.scalars().all()
        
        print(f"Found {len(negative_accounts)} accounts with negative balance:")
        for account in negative_accounts:
            print(f"  - {account.name}: {account.balance} -> {abs(account.balance)}")
            account.balance = abs(account.balance)
        
        await session.commit()
        print(f"✅ Fixed {len(negative_accounts)} accounts")

asyncio.run(fix_negative_balances())