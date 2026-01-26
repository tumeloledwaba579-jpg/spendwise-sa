try:
    from app.models.income import IncomeSource, IncomeHistory, IncomeMonthlySummary
    print("SUCCESS: Import works correctly")
    print(f"Classes found: {IncomeSource}, {IncomeHistory}, {IncomeMonthlySummary}")
except Exception as e:
    print(f"ERROR: {e}")
