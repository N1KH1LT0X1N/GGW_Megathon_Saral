"""
Visual Storytelling API Routes - Endpoints for generating visual storytelling videos
from research papers using AI-generated imagery and narration.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
import os
import json
from pathlib import Path
from typing import Optional, Dict, List
import traceback

from app.routes.api_keys import get_api_keys, rotate_gemini_key
from app.routes.papers import papers_storage
from app.services.visual_storytelling_service import generate_visual_storytelling_script, VisualStorytellingService
from app.services.ai_image_generator import generate_images_from_prompts, AIImageGenerator
from app.services.tts_service import ensure_audio_is_generated
from app.services.cinematic_video_service import create_visual_storytelling_video
from app.services.script_generator import extract_text_from_file
from pydantic import BaseModel

router = APIRouter()

# In-memory storage for visual storytelling data
visual_storytelling_storage = {}


class VisualStorytellingRequest(BaseModel):
    """Request model for visual storytelling script generation."""
    complexity_level: str = "medium"  # easy, medium, advanced
    video_duration: int = 180  # seconds
    style: str = "educational"  # educational, dramatic, documentary, minimalist
    image_provider: str = "placeholder"  # stability, dalle, placeholder
    voice_selection: Dict[str, str] = {"English": "arvind"}


class VisualStorytellingResponse(BaseModel):
    """Response model for visual storytelling operations."""
    paper_id: str
    status: str
    message: str
    script_data: Optional[Dict] = None
    image_count: Optional[int] = None
    video_path: Optional[str] = None


@router.post("/{paper_id}/generate-storytelling-script", response_model=VisualStorytellingResponse)
async def generate_storytelling_script(
    paper_id: str,
    request: VisualStorytellingRequest,
    api_keys: dict = Depends(get_api_keys)
):
    """
    Generate a visual storytelling script from a research paper.
    
    This creates a narrative script with scene descriptions optimized for
    visual storytelling with AI-generated images.
    """
    
    print(f"Generating visual storytelling script for paper: {paper_id}")
    
    # Check if paper exists
    if paper_id not in papers_storage:
        # Try loading from file
        paper_file = f"temp/papers/{paper_id}_metadata.json"
        if os.path.exists(paper_file):
            with open(paper_file, 'r', encoding='utf-8') as f:
                papers_storage[paper_id] = json.load(f)
        else:
            raise HTTPException(status_code=404, detail="Paper not found")
    
    if not api_keys.get("gemini_key"):
        raise HTTPException(status_code=400, detail="Google Gemini API key required")
    
    try:
        paper_info = papers_storage[paper_id]
        
        # Extract paper content
        tex_file_path = paper_info.get("tex_file_path")
        if not tex_file_path or not os.path.exists(tex_file_path):
            raise HTTPException(status_code=404, detail="Paper text file not found")
        
        paper_content = extract_text_from_file(tex_file_path)
        
        if not paper_content:
            raise HTTPException(status_code=400, detail="Could not extract paper content")
        
        print(f"Paper content extracted: {len(paper_content)} characters")
        
        # Generate visual storytelling script with automatic key rotation on quota errors
        max_retries = len(api_keys.get("gemini_keys", [api_keys.get("gemini_key")])) if api_keys.get("gemini_keys") else 1
        script_data = None
        
        for attempt in range(max_retries):
            try:
                script_data = generate_visual_storytelling_script(
                    api_key=api_keys["gemini_key"],
                    paper_content=paper_content,
                    complexity_level=request.complexity_level,
                    video_duration=request.video_duration,
                    style=request.style
                )
                break  # Success!
            except Exception as e:
                error_msg = str(e)
                # Check if it's a quota error OR expired/invalid key
                is_quota_error = "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower()
                is_key_error = "expired" in error_msg.lower() or "invalid" in error_msg.lower() or "api_key_invalid" in error_msg.lower()
                
                if is_quota_error or is_key_error:
                    error_type = "Quota exceeded" if is_quota_error else "API key expired/invalid"
                    print(f"⚠️ {error_type} on attempt {attempt + 1}/{max_retries}")
                    
                    if attempt < max_retries - 1:
                        if rotate_gemini_key():
                            print("🔄 Retrying with next API key...")
                            api_keys = get_api_keys()  # Refresh keys
                            continue
                        else:
                            raise HTTPException(
                                status_code=429 if is_quota_error else 401,
                                detail=f"All Gemini API keys have issues. Please check your keys in .env file."
                            )
                    else:
                        raise HTTPException(
                            status_code=429 if is_quota_error else 401,
                            detail=f"All Gemini API keys failed. Error: {error_msg}"
                        )
                else:
                    # Non-quota/non-key error, raise immediately
                    raise
        
        if not script_data:
            raise HTTPException(status_code=500, detail="Failed to generate script after all retries")
        
        # Store the script data
        storytelling_dir = f"temp/visual_storytelling/{paper_id}"
        Path(storytelling_dir).mkdir(parents=True, exist_ok=True)
        
        script_file = os.path.join(storytelling_dir, "storytelling_script.json")
        with open(script_file, 'w', encoding='utf-8') as f:
            json.dump(script_data, f, indent=2, ensure_ascii=False)
        
        # Update storage
        if paper_id not in visual_storytelling_storage:
            visual_storytelling_storage[paper_id] = {}
        
        visual_storytelling_storage[paper_id]["script_data"] = script_data
        visual_storytelling_storage[paper_id]["script_file"] = script_file
        visual_storytelling_storage[paper_id]["request_params"] = request.dict()
        
        print(f"Visual storytelling script generated: {len(script_data.get('scenes', []))} scenes")
        
        return VisualStorytellingResponse(
            paper_id=paper_id,
            status="success",
            message=f"Generated storytelling script with {len(script_data.get('scenes', []))} scenes",
            script_data=script_data
        )
        
    except Exception as e:
        print(f"Error generating storytelling script: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating storytelling script: {str(e)}")


@router.get("/{paper_id}/storytelling-script")
async def get_storytelling_script(paper_id: str):
    """Get the generated visual storytelling script."""
    
    if paper_id not in visual_storytelling_storage:
        # Try loading from file
        script_file = f"temp/visual_storytelling/{paper_id}/storytelling_script.json"
        if os.path.exists(script_file):
            with open(script_file, 'r', encoding='utf-8') as f:
                script_data = json.load(f)
            return {"paper_id": paper_id, "script_data": script_data}
        else:
            raise HTTPException(status_code=404, detail="Storytelling script not found")
    
    return {
        "paper_id": paper_id,
        "script_data": visual_storytelling_storage[paper_id].get("script_data")
    }


@router.post("/{paper_id}/generate-storytelling-images", response_model=VisualStorytellingResponse)
async def generate_storytelling_images(
    paper_id: str,
    background_tasks: BackgroundTasks,
    api_keys: dict = Depends(get_api_keys)
):
    """
    Generate AI images for all scenes in the storytelling script.
    
    Uses the visual descriptions from each scene to generate appropriate imagery.
    """
    
    print(f"Generating images for visual storytelling: {paper_id}")
    
    if paper_id not in visual_storytelling_storage:
        # Try loading from file
        script_file = f"temp/visual_storytelling/{paper_id}/storytelling_script.json"
        if os.path.exists(script_file):
            with open(script_file, 'r', encoding='utf-8') as f:
                script_data = json.load(f)
            visual_storytelling_storage[paper_id] = {"script_data": script_data}
        else:
            raise HTTPException(status_code=404, detail="Storytelling script not found. Generate script first.")
    
    try:
        script_data = visual_storytelling_storage[paper_id]["script_data"]
        scenes = script_data.get("scenes", [])
        
        if not scenes:
            raise HTTPException(status_code=400, detail="No scenes found in script")
        
        # Generate simple text-based scene cards (no AI image generation)
        print("✓ Creating text-based scene cards (no AI image generation)")
        
        image_dir = f"temp/visual_storytelling/{paper_id}/images"
        Path(image_dir).mkdir(parents=True, exist_ok=True)
        
        # Create simple text cards for each scene
        from PIL import Image, ImageDraw, ImageFont
        
        image_paths = []
        for i, scene in enumerate(scenes, 1):
            output_path = os.path.join(image_dir, f"scene_{i:03d}.png")
            
            # Create image
            width, height = 1920, 1080
            img = Image.new('RGB', (width, height))
            draw = ImageDraw.Draw(img)
            
            # Generate color based on scene number
            hue = (i * 30) % 360
            if hue < 120:
                colors = [(30, 30, 60), (60, 80, 180), (100, 120, 255)]
            elif hue < 240:
                colors = [(20, 60, 80), (40, 120, 140), (60, 180, 200)]
            else:
                colors = [(50, 20, 60), (120, 60, 140), (180, 100, 200)]
            
            # Create gradient
            for y in range(height):
                progress = y / height
                if progress < 0.5:
                    local_progress = progress * 2
                    r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * local_progress)
                    g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * local_progress)
                    b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * local_progress)
                else:
                    local_progress = (progress - 0.5) * 2
                    r = int(colors[1][0] + (colors[2][0] - colors[1][0]) * local_progress)
                    g = int(colors[1][1] + (colors[2][1] - colors[1][1]) * local_progress)
                    b = int(colors[1][2] + (colors[2][2] - colors[1][2]) * local_progress)
                draw.rectangle([(0, y), (width, y + 1)], fill=(r, g, b))
            
            # Add scene number at top
            try:
                font_large = ImageFont.truetype("arial.ttf", 80)
                font_medium = ImageFont.truetype("arial.ttf", 50)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
            
            # Scene number
            scene_text = f"Scene {i}"
            bbox = draw.textbbox((0, 0), scene_text, font=font_large)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            draw.text((x, 150), scene_text, fill=(255, 255, 255), font=font_large)
            
            # Narration text (word wrapped)
            narration = scene.get("narration", "")
            words = narration.split()
            lines = []
            current_line = []
            max_width = width - 200
            
            for word in words:
                current_line.append(word)
                test_line = ' '.join(current_line)
                bbox = draw.textbbox((0, 0), test_line, font=font_medium)
                if bbox[2] - bbox[0] > max_width:
                    if len(current_line) > 1:
                        current_line.pop()
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
                        current_line = []
            
            if current_line:
                lines.append(' '.join(current_line))
            
            # Draw text lines
            y_offset = 300
            line_height = 70
            for line in lines[:8]:  # Max 8 lines
                bbox = draw.textbbox((0, 0), line, font=font_medium)
                line_width = bbox[2] - bbox[0]
                x = (width - line_width) // 2
                draw.text((x, y_offset), line, fill=(255, 255, 255), font=font_medium)
                y_offset += line_height
            
            img.save(output_path, 'PNG')
            image_paths.append(output_path)
            print(f"Generated text card {i}/{len(scenes)}")
        
        print(f"✓ Created {len(image_paths)} text-based scene cards")
        
        # Store image paths
        visual_storytelling_storage[paper_id]["image_paths"] = image_paths
        visual_storytelling_storage[paper_id]["image_dir"] = image_dir
        
        print(f"Generated {len(image_paths)} images")
        
        return VisualStorytellingResponse(
            paper_id=paper_id,
            status="success",
            message=f"Generated {len(image_paths)} images",
            image_count=len(image_paths)
        )
        
    except Exception as e:
        print(f"Error generating images: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating images: {str(e)}")


@router.post("/{paper_id}/generate-storytelling-audio", response_model=VisualStorytellingResponse)
async def generate_storytelling_audio(
    paper_id: str,
    api_keys: dict = Depends(get_api_keys)
):
    """
    Generate narration audio for all scenes in the storytelling script.
    """
    
    print(f"Generating audio for visual storytelling: {paper_id}")
    
    if paper_id not in visual_storytelling_storage:
        # Try loading from file
        script_file = f"temp/visual_storytelling/{paper_id}/storytelling_script.json"
        if os.path.exists(script_file):
            with open(script_file, 'r', encoding='utf-8') as f:
                script_data = json.load(f)
            visual_storytelling_storage[paper_id] = {"script_data": script_data}
        else:
            raise HTTPException(status_code=404, detail="Storytelling script not found")
    
    if not api_keys.get("sarvam_key"):
        raise HTTPException(status_code=400, detail="Sarvam API key required for audio generation")
    
    try:
        from app.services.sarvam_sdk import SarvamTTS
        from app.services.script_generator import clean_script_for_tts_and_video
        
        script_data = visual_storytelling_storage[paper_id]["script_data"]
        scenes = script_data.get("scenes", [])
        
        if not scenes:
            raise HTTPException(status_code=400, detail="No scenes found in script")
        
        # Get voice selection from request params
        request_params = visual_storytelling_storage[paper_id].get("request_params", {})
        voice_selection = request_params.get("voice_selection", {"English": "vidya"})
        voice = voice_selection.get("English", "vidya")
        
        # Validate voice - Sarvam TTS actual supported voices (from API error message)
        supported_voices = [
            "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh",
            "aditya", "isha", "ritu", "chirag", "harsh", "sakshi", "priya", "neha",
            "rahul", "pooja", "rohan", "simran", "kavya", "anjali", "sneha", "kiran",
            "vikram", "rajesh", "sunita", "tara", "anirudh", "kriti", "ishaan"
        ]
        if voice not in supported_voices:
            print(f"Warning: Voice '{voice}' not supported, using 'vidya' instead")
            voice = "vidya"
        
        # Create audio directory
        audio_dir = f"temp/visual_storytelling/{paper_id}/audio"
        Path(audio_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize TTS client
        tts_client = SarvamTTS(api_key=api_keys["sarvam_key"])
        
        # Test connection
        print("Testing Sarvam TTS connection...")
        if not tts_client.test_connection():
            raise HTTPException(
                status_code=500, 
                detail="Cannot connect to Sarvam TTS API. Please check your API key and try again."
            )
        
        print(f"✓ Connected to Sarvam TTS API")
        print(f"Using voice: {voice}")
        
        # Generate audio for each scene
        audio_paths = []
        successful_generations = 0
        
        for i, scene in enumerate(scenes):
            narration = scene.get("narration", "")
            if not narration or not narration.strip():
                print(f"Skipping scene {i+1}: empty narration")
                continue
            
            # Clean and prepare narration
            cleaned_narration = clean_script_for_tts_and_video(narration)
            
            if not cleaned_narration:
                print(f"Skipping scene {i+1}: narration became empty after cleaning")
                continue
            
            # Generate audio file
            audio_path = os.path.join(audio_dir, f"scene_{i:03d}.wav")
            
            print(f"Generating audio for scene {i+1}/{len(scenes)}: {len(cleaned_narration)} chars")
            
            try:
                success = tts_client.synthesize_long_text(
                    text=cleaned_narration,
                    output_path=audio_path,
                    target_language='en-IN',
                    voice=voice,
                    max_chunk_length=500
                )
                
                if success and os.path.exists(audio_path):
                    audio_paths.append(audio_path)
                    successful_generations += 1
                    print(f"✓ Scene {i+1} audio generated: {audio_path}")
                else:
                    print(f"✗ Scene {i+1} audio generation failed")
                    
            except Exception as scene_error:
                print(f"✗ Error generating audio for scene {i+1}: {scene_error}")
                continue
        
        if successful_generations == 0:
            raise ValueError("No audio files were generated successfully. Check Sarvam API key and quota.")
        
        # Store audio paths
        visual_storytelling_storage[paper_id]["audio_paths"] = audio_paths
        visual_storytelling_storage[paper_id]["audio_dir"] = audio_dir
        
        print(f"✓ Generated {len(audio_paths)} audio files successfully")
        
        return VisualStorytellingResponse(
            paper_id=paper_id,
            status="success",
            message=f"Generated {len(audio_paths)} audio narrations"
        )
        
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")


@router.post("/{paper_id}/generate-storytelling-video", response_model=VisualStorytellingResponse)
async def generate_storytelling_video(
    paper_id: str,
    background_music: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Generate the final visual storytelling video by combining images and audio.
    """
    
    print(f"Generating visual storytelling video: {paper_id}")
    
    if paper_id not in visual_storytelling_storage:
        # Try loading from file
        script_file = f"temp/visual_storytelling/{paper_id}/storytelling_script.json"
        if os.path.exists(script_file):
            with open(script_file, 'r', encoding='utf-8') as f:
                script_data = json.load(f)
            visual_storytelling_storage[paper_id] = {"script_data": script_data}
        else:
            raise HTTPException(status_code=404, detail="Storytelling data not found")
    
    # Check if images and audio exist
    if "image_paths" not in visual_storytelling_storage[paper_id]:
        raise HTTPException(status_code=400, detail="Images not generated. Generate images first.")
    
    if "audio_paths" not in visual_storytelling_storage[paper_id]:
        raise HTTPException(status_code=400, detail="Audio not generated. Generate audio first.")
    
    try:
        script_data = visual_storytelling_storage[paper_id]["script_data"]
        image_dir = visual_storytelling_storage[paper_id]["image_dir"]
        audio_dir = visual_storytelling_storage[paper_id]["audio_dir"]
        
        # Create video output directory
        video_dir = f"temp/visual_storytelling/{paper_id}/videos"
        Path(video_dir).mkdir(parents=True, exist_ok=True)
        
        output_path = os.path.join(video_dir, f"{paper_id}_storytelling.mp4")
        
        # Generate video (without title card to avoid ImageMagick requirement)
        video_path = create_visual_storytelling_video(
            scenes=script_data.get("scenes", []),
            image_dir=image_dir,
            audio_dir=audio_dir,
            output_path=output_path,
            background_music_path=background_music,
            add_title_card=False,  # Disabled - requires ImageMagick on Windows
            title=script_data.get("title", "Research Paper Visualization")
        )
        
        # Store video path
        visual_storytelling_storage[paper_id]["video_path"] = video_path
        
        print(f"Visual storytelling video created: {video_path}")
        
        return VisualStorytellingResponse(
            paper_id=paper_id,
            status="success",
            message="Visual storytelling video generated successfully",
            video_path=os.path.basename(video_path)
        )
        
    except Exception as e:
        print(f"Error generating video: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating video: {str(e)}")


@router.get("/{paper_id}/download-storytelling-video")
async def download_storytelling_video(paper_id: str):
    """Download the generated visual storytelling video."""
    
    if paper_id not in visual_storytelling_storage or "video_path" not in visual_storytelling_storage[paper_id]:
        # Try finding the video file
        video_path = f"temp/visual_storytelling/{paper_id}/videos/{paper_id}_storytelling.mp4"
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video not found")
    else:
        video_path = visual_storytelling_storage[paper_id]["video_path"]
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        video_path,
        media_type='video/mp4',
        filename=f"storytelling_{paper_id}.mp4"
    )


@router.get("/{paper_id}/list-storytelling-images")
async def list_storytelling_images(paper_id: str):
    """List all generated images for the storytelling video."""
    
    image_dir = f"temp/visual_storytelling/{paper_id}/images"
    
    if not os.path.exists(image_dir):
        raise HTTPException(status_code=404, detail="Images not found")
    
    images = [f for f in os.listdir(image_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    images.sort()
    
    return {
        "paper_id": paper_id,
        "image_count": len(images),
        "images": images
    }


@router.get("/{paper_id}/storytelling-image/{filename}")
async def get_storytelling_image(paper_id: str, filename: str):
    """Get a specific storytelling image."""
    
    image_path = f"temp/visual_storytelling/{paper_id}/images/{filename}"
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        image_path,
        media_type='image/png',
        filename=filename
    )
