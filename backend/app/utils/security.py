from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import os

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a hashed one."""
    if not hashed_password:
        return False
    # Fallback to plain text comparison for legacy passwords if hashing context fails
    # NOTE: In a real system, you would migrate all passwords to hashes first.
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # If the hash is not valid bcrypt, it might be a legacy plain text password
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash of the password."""
    return pwd_context.hash(password)

def create_session_expiry(days: int = 7) -> datetime:
    """Calculates the expiry date for a new session."""
    return datetime.now(timezone.utc) + timedelta(days=days)

def is_token_expired(expires_at: datetime) -> bool:
    """Checks if a session token has expired."""
    if not expires_at:
        return False # Fallback for legacy tokens without expiry
    
    # Handle timezone-naive vs timezone-aware comparisons
    now = datetime.now(timezone.utc)
    target = expires_at
    if target.tzinfo is None:
        target = target.replace(tzinfo=timezone.utc)
        
    return now > target
