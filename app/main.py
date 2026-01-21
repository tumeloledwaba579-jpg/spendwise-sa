from fastapi import FastAPI
from app.core.database import engine, Base
import asyncio

app = FastAPI(title="SpendWise SA", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    # Optionally, you can create database tables on startup (if not using migrations)
    # But we are using Alembic, so we don't need to create tables here.
    pass

@app.get("/")
async def root():
    return {"message": "Welcome to SpendWise SA API"}

@app.get("/health")
async def health_check():
    from app.core.database import check_db_health
    db_health = await check_db_health()
    return {"status": "healthy" if db_health else "unhealthy", "database": "connected" if db_health else "disconnected"}
