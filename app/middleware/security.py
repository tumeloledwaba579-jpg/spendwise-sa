"""
Security headers middleware for FastAPI.
Adds security headers to all responses to protect against common vulnerabilities.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    """
    
    def __init__(self, app, is_development: bool = True):
        super().__init__(app)
        self.is_development = is_development
    
    async def dispatch(self, request: Request, call_next):
        """Process the request and add security headers to the response."""
        response = await call_next(request)
        
        # 1. Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 2. Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # 3. Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 4. Enforce HTTPS (only in production)
        if not self.is_development:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # 5. Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 6. Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "accelerometer=(), "
            "gyroscope=()"
        )
        
        # 7. Content Security Policy (most important!)
        response.headers["Content-Security-Policy"] = self.get_csp_policy(request)
        
        # 8. Remove server header
        if "server" in response.headers:
            del response.headers["server"]
        
        return response
    
    def get_csp_policy(self, request: Request) -> str:
        """
        Generate Content Security Policy based on environment.
        
        CSP helps prevent XSS attacks by controlling which resources can be loaded.
        """
        directives = []
        
        # Default policy - only allow same origin
        directives.append("default-src 'self'")
        
        # Scripts - allow from self and specific CDNs
        if self.is_development:
            # In development, allow 'unsafe-eval' and 'unsafe-inline' for hot reload
            directives.append("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net")
        else:
            # In production, be stricter
            directives.append("script-src 'self' https://cdn.jsdelivr.net")
        
        # Styles - allow self and Google Fonts
        directives.append("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
        
        # Fonts - allow self and Google Fonts
        directives.append("font-src 'self' https://fonts.gstatic.com")
        
        # Images - allow self, data URIs, and any HTTPS source
        directives.append("img-src 'self' data: https:")
        
        # Connect (API calls) - allow self and API
        api_url = str(request.base_url).rstrip('/')
        directives.append(f"connect-src 'self' {api_url} http://localhost:3000")
        
        # Form actions - only to self
        directives.append("form-action 'self'")
        
        # Frame ancestors - prevent clickjacking
        directives.append("frame-ancestors 'none'")
        
        # Base URI - restrict to self
        directives.append("base-uri 'self'")
        
        return "; ".join(directives)