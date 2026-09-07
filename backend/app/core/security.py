import hmac
import hashlib
from typing import Optional
from backend.app.core.config import settings

def verify_token(token: str) -> bool:
    """Verifies a simple bearer token against the configured secret key."""
    if not token:
        return False
    return hmac.compare_digest(token, settings.SECRET_KEY)

def generate_hash(data: str) -> str:
    """Generates a SHA-256 HMAC for payload integrity checks."""
    return hmac.new(
        settings.SECRET_KEY.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()
