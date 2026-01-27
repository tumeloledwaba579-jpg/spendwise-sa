import uvicorn
import sys

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    
    print("🚀 Starting SpendWise SA - Personal Finance Management")
    print("=" * 55)
    print(f"🌐 Application URL: http://localhost:{port}")
    print(f"📚 API Documentation: http://localhost:{port}/api/v1/docs")
    print(f"💳 Debt Module: http://localhost:{port}/api/v1/debts/*")
    print("=" * 55)
    print("🔄 Auto-reload enabled. Press Ctrl+C to stop.")
    print("")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
