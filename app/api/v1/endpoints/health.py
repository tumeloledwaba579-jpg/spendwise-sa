"""
Enhanced health check endpoints for monitoring.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.services.cache_service import CacheService
import time
import platform
import logging

# Optional imports
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logging.warning("psutil not installed - system metrics will be limited")

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Enhanced health check with dependency status.
    """
    start_time = time.time()
    statuses = {
        "api": "healthy",
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Add system metrics only if psutil is available
    if PSUTIL_AVAILABLE:
        statuses["disk"] = "unknown"
        statuses["memory"] = "unknown"
    
    # Check database
    try:
        await db.execute(text("SELECT 1"))
        statuses["database"] = "healthy"
    except Exception as e:
        statuses["database"] = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis_client = await CacheService.get_redis()
        if redis_client:
            await redis_client.ping()
            statuses["redis"] = "healthy"
        else:
            statuses["redis"] = "unhealthy: not connected"
    except Exception as e:
        statuses["redis"] = f"unhealthy: {str(e)}"
    
    # Check disk space (if psutil available)
    if PSUTIL_AVAILABLE:
        try:
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            if disk_percent < 90:
                statuses["disk"] = f"healthy ({disk_percent:.1f}% used)"
            else:
                statuses["disk"] = f"warning ({disk_percent:.1f}% used)"
        except Exception as e:
            statuses["disk"] = f"unknown: {str(e)}"
    
    # Check memory (if psutil available)
    if PSUTIL_AVAILABLE:
        try:
            memory = psutil.virtual_memory()
            if memory.percent < 90:
                statuses["memory"] = f"healthy ({memory.percent:.1f}% used)"
            else:
                statuses["memory"] = f"warning ({memory.percent:.1f}% used)"
        except Exception as e:
            statuses["memory"] = f"unknown: {str(e)}"
    
    response_time = (time.time() - start_time) * 1000
    
    # Determine overall status
    overall_status = "healthy"
    for service, status in statuses.items():
        if service != "api" and "unhealthy" in status:
            overall_status = "degraded"
            break
    
    return {
        "status": overall_status,
        "version": "3.0.0",
        "timestamp": time.time(),
        "response_time_ms": round(response_time, 2),
        "services": statuses,
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "hostname": platform.node()
        }
    }

@router.get("/health/readiness")
async def readiness_check():
    """Kubernetes readiness probe."""
    return {"status": "ready"}

@router.get("/health/liveness")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive"}

@router.get("/health/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """Detailed database health check."""
    try:
        start = time.time()
        result = await db.execute(text("SELECT 1"))
        latency = (time.time() - start) * 1000
        
        # Get connection pool stats
        pool = db.bind.pool
        pool_stats = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow()
        }
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "pool_stats": pool_stats
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }