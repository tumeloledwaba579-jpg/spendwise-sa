import sys
sys.path.append('.')
try:
    from app.models import User, Account, Category, PaymentMethod, Transaction, Budget, TransactionPayment
    from app.schemas import UserCreate, TransactionCreate, BudgetCreate
    print('✅ All model and schema imports work')
except Exception as e:
    print(f'❌ Import error: {e}')
    import traceback
    traceback.print_exc()
