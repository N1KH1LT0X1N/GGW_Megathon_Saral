from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
import os
from pathlib import Path
import traceback
from app.auth.dependencies import get_current_user
from app.models.request_models import AudioGenerationRequest, VideoGenerationRequest, MediaResponse
from app.routes.papers import papers_storage
from app.routes.scripts import scripts_storage
from app.routes.slides import slides_storage
from app.routes.api_keys import get_api_keys
from app.services.tts_service import ensure_audio_is_generated, ensure_hindi_audio_is_generated, ensure_language_audio_is_generated
from app.services.video_service import create_video_with_audio
from app.services.hindi_service import generate_hindi_script_with_google
from app.services.language_service import translate_to_language

router = APIRouter()

# In-memory storage for media
media_storage = {}

@router.post("/{paper_id}/generate-audio", response_model=MediaResponse)
async def generate_audio(
    paper_id: str,
    request: AudioGenerationRequest,
    api_keys: dict = Depends(get_api_keys)
):
    print(f"using voice selection:, {request.voice_selection}")
    print(f"Generating audio for paper ID: {paper_id}")
    if paper_id not in scripts_storage:
        scripts_file = f"temp/scripts/{paper_id}_scripts.json"
        if os.path.exists(scripts_file):
            import json
            with open(scripts_file, 'r', encoding='utf-8') as f:
                scripts_storage[paper_id] = json.load(f)
        else:
            raise HTTPException(status_code=404, detail="Scripts not found")

    if not api_keys.get("sarvam_key"):
        raise HTTPException(status_code=400, detail="Sarvam API key required for TTS")

    try:
        scripts_info = scripts_storage[paper_id]
        audio_dir = f"temp/audio/{paper_id}"
        Path(audio_dir).mkdir(parents=True, exist_ok=True)

        sections_scripts = {}
        for section_name, section_data in scripts_info.get("sections", {}).items():
            if isinstance(section_data, dict):
                sections_scripts[section_name] = section_data.get("script", "")
            else:
                sections_scripts[section_name] = str(section_data)

        if request.selected_language == "Hindi":
            print("Generating Hindi audio")
            print(f"Title intro script: {scripts_info.get('title_intro_script', '')}")
            title_intro_hindi = generate_hindi_script_with_google(
                scripts_info.get("title_intro_script", ""),
                api_keys.get("sarvam_key")
            )
            hindi_sections_scripts = {
                name: generate_hindi_script_with_google(script, api_keys.get("sarvam_key"))
                for name, script in sections_scripts.items()
            }
            title_intro_script = title_intro_hindi
            sections_scripts = hindi_sections_scripts
            language = "Hindi"
        elif request.selected_language == "English":
            title_intro_script = scripts_info.get("title_intro_script", "")
            language = "English"
        else:
            print(f"Translating to {request.selected_language}")
            title_intro_script = translate_to_language(
                scripts_info.get("title_intro_script", ""),
                request.selected_language,
                api_keys.get("sarvam_key")
            )
            sections_scripts = {
                name: translate_to_language(script, request.selected_language, api_keys.get("sarvam_key"))
                for name, script in sections_scripts.items()
            }
            language = request.selected_language
        print(f"Title intro script: {title_intro_script}")
        
        if language == "Hindi":
            audio_response = ensure_hindi_audio_is_generated(
                sarvam_api_key=api_keys.get("sarvam_key"),
                paper_id=paper_id,
                title_intro_script=title_intro_script,
                sections_scripts=sections_scripts,
                voice_selections=request.voice_selection,
                hinglish_iterations=request.hinglish_iterations,
                openai_api_key=api_keys.get("openai_key"),
                show_hindi_debug=request.show_hindi_debug
            )
        elif language == "English":
            audio_response = ensure_audio_is_generated(
                sarvam_api_key=api_keys.get("sarvam_key"),
                language=language,
                paper_id=paper_id,
                title_intro_script=title_intro_script,
                sections_scripts=sections_scripts,
                voice_selections=request.voice_selection,
                hinglish_iterations=request.hinglish_iterations,
                openai_api_key=api_keys.get("openai_key"),
                show_hindi_debug=request.show_hindi_debug
            )
        else:
            audio_response = ensure_language_audio_is_generated(
                sarvam_api_key=api_keys.get("sarvam_key"),
                language=language,
                paper_id=paper_id,
                title_intro_script=title_intro_script,
                sections_scripts=sections_scripts,
                voice_selections=request.voice_selection,
                hinglish_iterations=request.hinglish_iterations,
                openai_api_key=api_keys.get("openai_key")
            )

        audio_files = audio_response["audio_files"]
        if paper_id not in media_storage:
            media_storage[paper_id] = {}

        media_storage[paper_id]["audio_files"] = [os.path.join(audio_dir, f) for f in audio_files]
        media_storage[paper_id]["audio_dir"] = audio_dir

        return MediaResponse(
            audio_files=audio_files,
            paper_id=paper_id
        )

    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@router.get("/{paper_id}/stream-audio/{filename}")
async def stream_audio(paper_id: str, filename: str, request: Request):
    if paper_id not in media_storage:
        raise HTTPException(status_code=404, detail="Media not found")

    audio_dir = media_storage[paper_id].get("audio_dir")
    if not audio_dir:
        raise HTTPException(status_code=404, detail="Audio directory not found")

    audio_path = os.path.join(audio_dir, filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    file_size = os.path.getsize(audio_path)
    range_header = request.headers.get("range")
    if range_header:
        start, end = range_header.replace("bytes=", "").split("-")
        start = int(start)
        end = int(end) if end else file_size - 1
        chunk_size = end - start + 1

        def iterfile():
            with open(audio_path, "rb") as f:
                f.seek(start)
                yield f.read(chunk_size)

        return StreamingResponse(
            iterfile(),
            status_code=206,
            media_type="audio/wav",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
            },
        )
    else:
        return StreamingResponse(
            open(audio_path, "rb"),
            media_type="audio/wav",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            },
        )


@router.post("/{paper_id}/generate-video", response_model=MediaResponse)
async def generate_video(
    paper_id: str,
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks
):
    """Generate final video from slides and audio."""
    
    if paper_id not in slides_storage:
        raise HTTPException(status_code=404, detail="Slides not found")
    
    if paper_id not in media_storage or "audio_files" not in media_storage[paper_id]:
        raise HTTPException(status_code=404, detail="Audio files not found")
    
    try:
        slides_info = slides_storage[paper_id]
        media_info = media_storage[paper_id]
        
        # Create video directory
        video_dir = f"temp/videos/{paper_id}"
        Path(video_dir).mkdir(parents=True, exist_ok=True)
        
        # Get slide images and audio files
        slide_images = slides_info["image_paths"]
        audio_files = media_info["audio_files"]
        
        print(f"Creating video with {len(slide_images)} slides and {len(audio_files)} audio files")
        
        # Generate video
        output_file = os.path.join(video_dir, f"final_video_{request.selected_language.lower()}.mp4")
        
        video_path = create_video_with_audio(
            slide_images=slide_images,
            audio_files=audio_files,
            background_music_file=request.background_music_file,
            output_file=output_file
        )
        
        media_storage[paper_id]["video_path"] = video_path
        
        return MediaResponse(
            audio_files=[os.path.basename(f) for f in audio_files],
            video_path=os.path.basename(video_path) if video_path else None,
            paper_id=paper_id
        )
        
    except Exception as e:
        print(f"Error generating video: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating video: {str(e)}")

@router.get("/{paper_id}/download-video")
async def download_video(paper_id: str):
    """Download the generated video."""
    
    if paper_id not in media_storage or "video_path" not in media_storage[paper_id]:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = media_storage[paper_id]["video_path"]
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        video_path,
        media_type='video/mp4',
        filename=f"presentation_{paper_id}.mp4"
    )

@router.get("/{paper_id}/download-audio/{filename}")
async def download_audio(paper_id: str, filename: str):
    """Download individual audio files."""
    
    if paper_id not in media_storage:
        raise HTTPException(status_code=404, detail="Media not found")
    
    audio_dir = media_storage[paper_id].get("audio_dir")
    if not audio_dir:
        raise HTTPException(status_code=404, detail="Audio directory not found")
    
    audio_path = os.path.join(audio_dir, filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        audio_path,
        media_type='audio/wav',
        filename=filename
    )

@router.get("/{paper_id}/stream-video")
async def stream_video(paper_id: str, request: Request):
    if paper_id not in media_storage:
        raise HTTPException(status_code=404, detail="Video not found")

    # Get the actual stored video path instead of constructing it
    video_path = media_storage[paper_id].get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    file_size = os.path.getsize(video_path)
    range_header = request.headers.get("range")
    
    if range_header:
        # Parse range header
        range_match = range_header.replace("bytes=", "").split("-")
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if range_match[1] else file_size - 1
        
        # Ensure end doesn't exceed file size
        end = min(end, file_size - 1)
        chunk_size = end - start + 1

        def iterfile():
            with open(video_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining:
                    chunk = f.read(min(8192, remaining))  # Read in 8KB chunks
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iterfile(),
            status_code=206,
            media_type="video/mp4",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Cache-Control": "no-cache",
            },
        )
    else:
        # Return entire file
        return StreamingResponse(
            open(video_path, "rb"),
            media_type="video/mp4",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Cache-Control": "no-cache",
            },
        )
