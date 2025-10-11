from fastapi import Header, HTTPException, Cookie
from typing import Optional
from app.services.session_manager import session_manager

async def get_session_id(
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Cookie(None)
) -> str:
    """Extract session ID from header or cookie."""
    session_id = x_session_id or session_id
    
    if not session_id:
        # Create new session if none provided
        session_id = session_manager.create_session()
        return session_id
    
    if not session_manager.is_valid_session(session_id):
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return session_id

async def get_or_create_session(
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Cookie(None)
) -> str:
    """Get existing session or create new one."""
    session_id = x_session_id or session_id
    
    if not session_id or not session_manager.is_valid_session(session_id):
        session_id = session_manager.create_session()
    
    return session_id
