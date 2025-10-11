# app/auth/decorators.py
from functools import wraps
from fastapi import Depends
from app.auth.google_auth import get_current_user

def require_auth(func):
    """Decorator to require authentication for route handlers"""
    @wraps(func)
    async def wrapper(*args, current_user: dict = Depends(get_current_user), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper