"""
Podcast Generation Routes
Handles interactive podcast creation for research papers
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
from pathlib import Path
import logging

from app.services.podcast_generator import podcast_generator
from app.services.bhashini_service import bhashini_service
from app.routes.papers import papers_storage

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for podcast data
podcast_storage = {}

class PodcastRequest(BaseModel):
    num_exchanges: Optional[int] = 8
    language: Optional[str] = "en"

class PodcastResponse(BaseModel):
    paper_id: str
    dialogue: List[Dict[str, str]]
    status: str
    message: str

class PodcastAudioResponse(BaseModel):
    paper_id: str
    audio_files: List[Dict[str, str]]
    status: str

@router.post("/{paper_id}/generate-script", response_model=PodcastResponse)
async def generate_podcast_script(paper_id: str, request: PodcastRequest):
    """Generate podcast dialogue script for a paper"""
    
    if paper_id not in papers_storage:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    try:
        paper_info = papers_storage[paper_id]
        metadata = paper_info.get("metadata", {})
        
        # Get paper content
        paper_content = ""
        
        # Try to get from scripts if available
        scripts_file = f"temp/scripts/{paper_id}_scripts.json"
        if os.path.exists(scripts_file):
            with open(scripts_file, 'r', encoding='utf-8') as f:
                scripts_data = json.load(f)
                # Combine all section scripts
                sections = scripts_data.get("sections", {})
                for section_name, section_data in sections.items():
                    if isinstance(section_data, dict):
                        script = section_data.get("script", "")
                        paper_content += f"\n{section_name}: {script}\n"
                
                # Add title intro
                paper_content = scripts_data.get("title_intro_script", "") + "\n" + paper_content
        
        # Fallback to paper metadata
        if not paper_content.strip():
            paper_content = f"Title: {metadata.get('title', '')}\nAuthors: {metadata.get('authors', '')}"
        
        # Generate dialogue
        try:
            dialogue = podcast_generator.generate_podcast_script(
                paper_content=paper_content,
                metadata=metadata,
                num_exchanges=request.num_exchanges,
                language=request.language
            )
        except Exception as gen_error:
            error_detail = f"Podcast generation error: {str(gen_error)}"
            logger.error(error_detail)
            raise HTTPException(status_code=500, detail=error_detail)
        
        if not dialogue:
            raise HTTPException(status_code=500, detail="Failed to generate podcast script - no dialogue returned")
        
        # Ensure dialogue meets TTS constraints
        dialogue = podcast_generator.chunk_dialogue_for_tts(dialogue)
        
        # Store podcast data
        podcast_dir = f"temp/podcasts/{paper_id}"
        Path(podcast_dir).mkdir(parents=True, exist_ok=True)
        
        podcast_data = {
            "paper_id": paper_id,
            "dialogue": dialogue,
            "metadata": metadata,
            "language": request.language,
            "status": "script_generated"
        }
        
        podcast_storage[paper_id] = podcast_data
        
        # Save to file
        with open(f"{podcast_dir}/script.json", 'w', encoding='utf-8') as f:
            json.dump(podcast_data, f, indent=2)
        
        logger.info(f"Generated podcast script for {paper_id}: {len(dialogue)} segments")
        
        return PodcastResponse(
            paper_id=paper_id,
            dialogue=dialogue,
            status="success",
            message=f"Generated {len(dialogue)} dialogue segments"
        )
        
    except Exception as e:
        logger.error(f"Podcast script generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate podcast: {str(e)}")

@router.get("/{paper_id}/script")
async def get_podcast_script(paper_id: str):
    """Get existing podcast script"""
    
    # Check in-memory storage
    if paper_id in podcast_storage:
        return podcast_storage[paper_id]
    
    # Check file storage
    script_file = f"temp/podcasts/{paper_id}/script.json"
    if os.path.exists(script_file):
        with open(script_file, 'r', encoding='utf-8') as f:
            podcast_data = json.load(f)
            podcast_storage[paper_id] = podcast_data
            return podcast_data
    
    raise HTTPException(status_code=404, detail="Podcast script not found")

@router.post("/{paper_id}/generate-audio", response_model=PodcastAudioResponse)
async def generate_podcast_audio(paper_id: str, background_tasks: BackgroundTasks):
    """Generate audio files for podcast using Sarvam AI TTS (Bulbul v2 model)"""
    
    logger.info("=" * 80)
    logger.info(f"AUDIO GENERATION REQUEST RECEIVED for paper: {paper_id}")
    logger.info("=" * 80)
    
    try:
        if paper_id not in podcast_storage:
            # Try to load from file
            script_file = f"temp/podcasts/{paper_id}/script.json"
            if os.path.exists(script_file):
                with open(script_file, 'r', encoding='utf-8') as f:
                    podcast_storage[paper_id] = json.load(f)
            else:
                raise HTTPException(status_code=404, detail="Podcast script not found. Generate script first.")
    except Exception as e:
        logger.error(f"ERROR loading podcast data: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=f"Failed to load podcast: {str(e)}")
    
    try:
        logger.info(f"Starting audio generation for paper: {paper_id}")
        
        podcast_data = podcast_storage[paper_id]
        dialogue = podcast_data["dialogue"]
        language = podcast_data.get("language", "en")  # Get language from stored data
        
        logger.info(f"Found {len(dialogue)} dialogue segments")
        
        podcast_dir = f"temp/podcasts/{paper_id}"
        audio_files = []
        
        logger.info(f"Generating audio in language: {language}")
        
        # Generate audio for each dialogue segment using Sarvam AI
        for i, segment in enumerate(dialogue):
            speaker = segment["speaker"]
            text = segment["text"]
            # Map speaker to voice: teacher=male (abhilash), student=female (anushka)
            gender = speaker.lower()  # Pass speaker role directly
            
            logger.info(f"Generating audio {i+1}/{len(dialogue)}: {speaker}")
            
            # Call Sarvam TTS with language parameter
            audio_base64 = bhashini_service.text_to_speech(text, gender, language)
            
            if audio_base64:
                # Save base64 audio directly to file
                audio_filename = f"{i:03d}_{speaker}.wav"
                audio_path = f"{podcast_dir}/{audio_filename}"
                
                try:
                    # Decode base64 and save as WAV file
                    import base64
                    audio_data = base64.b64decode(audio_base64)
                    with open(audio_path, 'wb') as f:
                        f.write(audio_data)
                    
                    audio_files.append({
                        "index": str(i),
                        "speaker": speaker,
                        "text": text,
                        "filename": audio_filename,
                        "url": f"/api/podcast/{paper_id}/audio/{audio_filename}"
                    })
                    logger.info(f"Saved audio file: {audio_filename}")
                except Exception as e:
                    logger.error(f"Failed to save audio for segment {i}: {str(e)}")
            else:
                logger.warning(f"TTS failed for segment {i}")
        
        # Update storage with audio files
        podcast_data["audio_files"] = audio_files
        podcast_data["status"] = "audio_generated"
        podcast_storage[paper_id] = podcast_data
        
        # Save updated data
        with open(f"{podcast_dir}/script.json", 'w', encoding='utf-8') as f:
            json.dump(podcast_data, f, indent=2)
        
        logger.info(f"Generated {len(audio_files)} audio files for podcast {paper_id}")
        
        return PodcastAudioResponse(
            paper_id=paper_id,
            audio_files=audio_files,
            status="success"
        )
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"PODCAST AUDIO GENERATION FAILED!")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.exception(e)
        logger.error("=" * 80)
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")

@router.get("/{paper_id}/audio/{filename}")
async def get_podcast_audio(paper_id: str, filename: str):
    """Stream podcast audio file"""
    from fastapi.responses import FileResponse
    
    audio_path = f"temp/podcasts/{paper_id}/{filename}"
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename=filename
    )

@router.get("/{paper_id}/status")
async def get_podcast_status(paper_id: str):
    """Get podcast generation status"""
    
    if paper_id in podcast_storage:
        podcast_data = podcast_storage[paper_id]
        return {
            "paper_id": paper_id,
            "status": podcast_data.get("status", "unknown"),
            "dialogue_count": len(podcast_data.get("dialogue", [])),
            "audio_count": len(podcast_data.get("audio_files", []))
        }
    
    # Check file storage
    script_file = f"temp/podcasts/{paper_id}/script.json"
    if os.path.exists(script_file):
        with open(script_file, 'r', encoding='utf-8') as f:
            podcast_data = json.load(f)
            podcast_storage[paper_id] = podcast_data
            return {
                "paper_id": paper_id,
                "status": podcast_data.get("status", "unknown"),
                "dialogue_count": len(podcast_data.get("dialogue", [])),
                "audio_count": len(podcast_data.get("audio_files", []))
            }
    
    raise HTTPException(status_code=404, detail="Podcast not found")
