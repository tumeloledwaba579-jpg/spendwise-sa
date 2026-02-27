"""
Simplified metrics middleware for FastAPI.
Uses logging instead of prometheus if unavailable.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger(__name__)

# Try to import prometheus, but don't fail if not available
try:
    from prometheus_client import Counter, Histogram, generate_latest, REGISTRY
    PROMETHEUS_AVAILABLE = True
    logger.info("Prometheus metrics enabled")
    
    # Define metrics
    request_count = Counter(
        'http_requests_total',
        'Total HTTP requests',
        ['method', 'endpoint', 'status']
    )
    
    request_duration = Histogram(
        'http_request_duration_seconds',
        'HTTP request duration in seconds',
        ['method', 'endpoint'],
        buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10)
    )
    
    # Note: Counter doesn't have dec() - only inc()
    # We'll track active requests with a separate counter
    
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logger.warning("Prometheus not available - metrics will be logged only")
    
    # Dummy objects
    request_count = None
    request_duration = None

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect metrics for all requests."""
    
    def __init__(self, app):
        super().__init__(app)
        # Track active requests manually
        self.active_requests = 0
    
    async def dispatch(self, request: Request, call_next):
        # Increment active requests
        self.active_requests += 1
        
        # Start timer
        start_time = time.time()
        
        # Process request
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise e
        finally:
            # Calculate duration
            duration = time.time() - start_time
            
            # Decrement active requests
            self.active_requests -= 1
            
            # Log metrics if prometheus not available
            if not PROMETHEUS_AVAILABLE:
                logger.info(
                    f"METRICS: {request.method} {request.url.path} "
                    f"status={status_code} duration={duration*1000:.2f}ms "
                    f"active={self.active_requests}"
                )
            else:
                # Record Prometheus metrics
                endpoint = request.url.path
                request_count.labels(
                    method=request.method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()
                
                request_duration.labels(
                    method=request.method,
                    endpoint=endpoint
                ).observe(duration)
        
        return response

async def metrics_endpoint(request: Request):
    """Prometheus metrics endpoint."""
    if not PROMETHEUS_AVAILABLE:
        return Response(
            content="# Prometheus not available\nmetrics_logged_only 1",
            media_type="text/plain"
        )
    
    return Response(
        content=generate_latest(REGISTRY),
        media_type="text/plain"
    )