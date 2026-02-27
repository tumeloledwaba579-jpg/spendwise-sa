"""
CSRF protection utilities for cookie-based authentication
"""
import secrets
from typing import Dict, Optional
from datetime import datetime, timedelta

class CSRFProtection:
    def __init__(self):
        # In production, use Redis instead of memory
        self.tokens: Dict[str, dict] = {}
        self.token_ttl = 3600  # 1 hour in seconds
    
    def generate_token(self, session_id: str) -> str:
        """Generate a new CSRF token for a session."""
        token = secrets.token_urlsafe(32)
        self.tokens[session_id] = {
            'token': token,
            'expires': datetime.utcnow() + timedelta(seconds=self.token_ttl)
        }
        return token
    
    def validate_token(self, session_id: str, token: str) -> bool:
        """Validate a CSRF token."""
        stored = self.tokens.get(session_id)
        if not stored:
            return False
        
        # Check expiration
        if datetime.utcnow() > stored['expires']:
            del self.tokens[session_id]
            return False
        
        # Constant-time comparison to prevent timing attacks
        return secrets.compare_digest(stored['token'], token)
    
    def refresh_token(self, session_id: str) -> Optional[str]:
        """Refresh an existing token."""
        if session_id in self.tokens:
            return self.generate_token(session_id)
        return None
    
    def remove_token(self, session_id: str):
        """Remove a token (on logout)."""
        self.tokens.pop(session_id, None)

# Create global instance
csrf_protection = CSRFProtection()