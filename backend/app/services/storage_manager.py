import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from app.services.session_manager import session_manager

# Configure logging
logger = logging.getLogger(__name__)

class StorageManager:
    """Manages persistent storage of paper information."""
    
    def __init__(self, storage_dir: str = "temp/storage"):
        self.storage_dir = storage_dir
        Path(storage_dir).mkdir(parents=True, exist_ok=True)
        self.papers_file = os.path.join(storage_dir, "papers_storage.json")
        self.memory_cache = {}
        self._load_papers()
    
    def _load_papers(self):
        """Load papers from disk into memory."""
        if os.path.exists(self.papers_file):
            try:
                with open(self.papers_file, 'r') as f:
                    data = json.load(f)
                    self.memory_cache = data
                    logger.info(f"Loaded {len(data)} papers from storage")
            except Exception as e:
                logger.error(f"Error loading papers from storage: {str(e)}")
                self.memory_cache = {}
        else:
            logger.info("No papers storage file found, starting with empty cache")
            self.memory_cache = {}
    
    def _save_papers(self):
        """Save papers from memory to disk."""
        try:
            with open(self.papers_file, 'w') as f:
                json.dump(self.memory_cache, f)
            logger.info(f"Saved {len(self.memory_cache)} papers to storage")
            return True
        except Exception as e:
            logger.error(f"Error saving papers to storage: {str(e)}")
            return False
    
    def get_paper(self, paper_id: str) -> Optional[Dict[str, Any]]:
        """Get paper info by ID."""
        return self.memory_cache.get(paper_id)
    
    def save_paper(self, paper_id: str, paper_info: Dict[str, Any]) -> bool:
        """Save paper info."""
        self.memory_cache[paper_id] = paper_info
        return self._save_papers()
    
    def delete_paper(self, paper_id: str) -> bool:
        """Delete paper info."""
        if paper_id in self.memory_cache:
            del self.memory_cache[paper_id]
            return self._save_papers()
        return False
    
    def get_all_papers(self) -> Dict[str, Any]:
        """Get all papers."""
        return self.memory_cache
    
    def clear_all(self) -> bool:
        """Clear all papers."""
        self.memory_cache = {}
        return self._save_papers()

# Create global instance
storage_manager = StorageManager()

class SessionAwareStorage:
    def __init__(self, storage_type: str):
        self.storage_type = storage_type
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
    
    async def get_session_storage(self, session_id: str) -> Dict[str, Any]:
        """Get storage for a specific session."""
        if not session_manager.is_valid_session(session_id):
            raise ValueError(f"Invalid session: {session_id}")
        
        # Check memory cache first
        if session_id not in self._memory_cache:
            # Load from disk
            data = await session_manager.load_session_data(session_id, self.storage_type)
            self._memory_cache[session_id] = data or {}
        
        return self._memory_cache[session_id]
    
    async def update_session_storage(self, session_id: str, data: Dict[str, Any]):
        """Update storage for a specific session."""
        if not session_manager.is_valid_session(session_id):
            raise ValueError(f"Invalid session: {session_id}")
        
        self._memory_cache[session_id] = data
        await session_manager.save_session_data(session_id, self.storage_type, data)
    
    async def get_item(self, session_id: str, key: str) -> Optional[Any]:
        """Get a specific item from session storage."""
        storage = await self.get_session_storage(session_id)
        return storage.get(key)
    
    async def set_item(self, session_id: str, key: str, value: Any):
        """Set a specific item in session storage."""
        storage = await self.get_session_storage(session_id)
        storage[key] = value
        await self.update_session_storage(session_id, storage)
    
    async def remove_item(self, session_id: str, key: str):
        """Remove a specific item from session storage."""
        storage = await self.get_session_storage(session_id)
        if key in storage:
            del storage[key]
            await self.update_session_storage(session_id, storage)

# Create storage instances
papers_storage = SessionAwareStorage("papers")
scripts_storage = SessionAwareStorage("scripts")
slides_storage = SessionAwareStorage("slides")
media_storage = SessionAwareStorage("media")
api_keys_storage = SessionAwareStorage("api_keys")
