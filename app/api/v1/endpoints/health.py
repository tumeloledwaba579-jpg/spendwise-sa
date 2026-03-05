"""
Enhanced health check endpoints for monitoring.
All endpoints are designed to be fast and non-blocking.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.services.cache_service import CacheService
import time
import platform
import logging
from typing import Dict, Any

# Optional imports - safely handled
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logging.warning("psutil not installed - system metrics will be limited")

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """
    Basic health check - fast and simple.
    No dependencies to avoid cascading failures.
    """
    return {
        "status": "healthy",
        "version": "3.0.0",
        "timestamp": time.time(),
        "service": "SpendWise API"
    }

@router.get("/health/readiness")
async def readiness_check():
    """
    Kubernetes readiness probe.
    Checks if the service is ready to receive traffic.
    """
    return {"status": "ready", "timestamp": time.time()}

@router.get("/health/liveness")
async def liveness_check():
    """
    Kubernetes liveness probe.
    Checks if the service is alive.
    """
    return {"status": "alive", "timestamp": time.time()}

@router.get("/health/db")
async def db_health(db: AsyncSession = Depends(get_db)):
    """
    Detailed database health check.
    Tests database connectivity and returns connection pool stats.
    """
    start_time = time.time()
    
    try:
        # Simple query to test connection
        result = await db.execute(text("SELECT 1 as health_check"))
        await result.fetchone()
        
        latency = (time.time() - start_time) * 1000
        
        # Safely get connection pool stats
        pool_stats = {}
        try:
            if hasattr(db, 'bind') and hasattr(db.bind, 'pool'):
                pool = db.bind.pool
                pool_stats = {
                    "size": pool.size(),
                    "checked_in_connections": pool.checkedin(),
                    "overflow": pool.overflow(),
                    "timeout": pool.timeout()
                }
        except Exception as pool_error:
            pool_stats = {"error": f"Could not retrieve pool stats: {str(pool_error)}"}
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "timestamp": time.time(),
            "pool_stats": pool_stats
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "latency_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }

@router.get("/health/redis")
async def redis_health():
    """
    Redis cache health check.
    Tests connectivity to Redis.
    """
    start_time = time.time()
    
    try:
        redis_client = await CacheService.get_redis()
        if not redis_client:
            return {
                "status": "unhealthy",
                "error": "Redis client not initialized",
                "latency_ms": round((time.time() - start_time) * 1000, 2),
                "timestamp": time.time()
            }
        
        await redis_client.ping()
        latency = (time.time() - start_time) * 1000
        
        # Get Redis info if available
        redis_info = {}
        try:
            info = await redis_client.info()
            redis_info = {
                "version": info.get("redis_version", "unknown"),
                "connected_clients": info.get("connected_clients", "unknown"),
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "total_connections_received": info.get("total_connections_received", "unknown")
            }
        except:
            redis_info = {"note": "Detailed info not available"}
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "timestamp": time.time(),
            "info": redis_info
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "latency_ms": round((time.time() - start_time) * 1000, 2),
            "timestamp": time.time()
        }

@router.get("/health/system")
async def system_health():
    """
    System health metrics.
    Returns CPU, memory, and disk usage if psutil is available.
    """
    result = {
        "timestamp": time.time(),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "hostname": platform.node()
    }
    
    if PSUTIL_AVAILABLE:
        try:
            # CPU usage (non-blocking, short interval)
            result["cpu"] = {
                "percent": psutil.cpu_percent(interval=0.1),
                "count": psutil.cpu_count(),
                "stats": {
                    "ctx_switches": psutil.cpu_stats().ctx_switches,
                    "interrupts": psutil.cpu_stats().interrupts,
                    "soft_interrupts": psutil.cpu_stats().soft_interrupts
                }
            }
            
            # Memory usage
            memory = psutil.virtual_memory()
            result["memory"] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free
            }
            
            # Disk usage (root partition)
            disk = psutil.disk_usage('/')
            result["disk"] = {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.used / disk.total * 100
            }
            
            # Process info
            process = psutil.Process()
            with process.oneshot():
                result["process"] = {
                    "pid": process.pid,
                    "cpu_percent": process.cpu_percent(interval=0.1),
                    "memory_percent": process.memory_percent(),
                    "memory_rss": process.memory_info().rss,
                    "memory_vms": process.memory_info().vms,
                    "connections": len(process.connections()),
                    "threads": len(process.threads()),
                    "open_files": len(process.open_files())
                }
                
        except Exception as e:
            result["error"] = f"Error collecting system metrics: {str(e)}"
    else:
        result["note"] = "Install psutil for detailed system metrics: pip install psutil"
    
    return result

@router.get("/health/detailed")
async def detailed_health(
    db: AsyncSession = Depends(get_db)
):
    """
    Comprehensive health check with all dependencies.
    Use sparingly as it calls multiple services.
    """
    start_time = time.time()
    
    # Run checks in parallel for speed
    import asyncio
    
    async def check_db():
        try:
            db_start = time.time()
            await db.execute(text("SELECT 1"))
            db_latency = (time.time() - db_start) * 1000
            return {"status": "healthy", "latency_ms": round(db_latency, 2)}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    async def check_redis():
        try:
            redis_start = time.time()
            redis_client = await CacheService.get_redis()
            if redis_client:
                await redis_client.ping()
                redis_latency = (time.time() - redis_start) * 1000
                return {"status": "healthy", "latency_ms": round(redis_latency, 2)}
            return {"status": "unhealthy", "error": "Redis client not initialized"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    # Run checks concurrently
    db_result, redis_result = await asyncio.gather(
        check_db(),
        check_redis(),
        return_exceptions=True
    )
    
    total_latency = (time.time() - start_time) * 1000
    
    # Determine overall status
    services = {
        "database": db_result if not isinstance(db_result, Exception) else {"status": "error", "error": str(db_result)},
        "redis": redis_result if not isinstance(redis_result, Exception) else {"status": "error", "error": str(redis_result)}
    }
    
    overall_status = "healthy"
    for service, status in services.items():
        if status.get("status") != "healthy":
            overall_status = "degraded"
            break
    
    return {
        "status": overall_status,
        "timestamp": time.time(),
        "total_latency_ms": round(total_latency, 2),
        "services": services,
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.platform()
        } if PSUTIL_AVAILABLE else {"python_version": platform.python_version()}
    }

@router.get("/health/ping")
async def ping():
    """
    Ultra-fast ping endpoint for load balancers.
    No dependencies, minimal processing.
    """
    return {"ping": "pong", "timestamp": time.time()}