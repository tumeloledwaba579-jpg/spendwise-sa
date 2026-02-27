"""
Structured logging configuration for the application.
"""
import logging
import structlog
import json
from datetime import datetime
from typing import Any, Dict

# Configure structlog for structured JSON logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    cache_logger_on_first_use=True,
)

# Create structured logger
logger = structlog.get_logger()

# Request context for tracking requests
class RequestContext:
    """Context manager for request-scoped logging."""
    
    def __init__(self, request_id: str = None):
        self.request_id = request_id or self._generate_request_id()
    
    def _generate_request_id(self) -> str:
        import uuid
        return str(uuid.uuid4())[:8]
    
    def __enter__(self):
        structlog.contextvars.bind_contextvars(
            request_id=self.request_id,
            timestamp=datetime.utcnow().isoformat()
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        structlog.contextvars.unbind_contextvars('request_id', 'timestamp')

# Helper functions
def log_request(method: str, path: str, status_code: int, duration_ms: float, user_id: str = None):
    """Log API request with structured data."""
    log_data = {
        "type": "request",
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "user_id": user_id
    }
    logger.info("api_request", **log_data)

def log_error(error: Exception, context: Dict[str, Any] = None):
    """Log errors with context."""
    log_data = {
        "type": "error",
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context or {}
    }
    logger.error("application_error", **log_data)

def log_db_query(query: str, duration_ms: float, params: Dict = None):
    """Log database queries for performance monitoring."""
    log_data = {
        "type": "db_query",
        "query": query[:200] + "..." if len(query) > 200 else query,
        "duration_ms": round(duration_ms, 2),
        "params": params or {}
    }
    logger.debug("database_query", **log_data)