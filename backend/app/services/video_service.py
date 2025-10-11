import os
from pathlib import Path
from typing import List, Optional
from moviepy.editor import ImageClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip
import wave
import subprocess

def validate_audio_file_for_video(audio_path: str) -> bool:
    """Validate audio file before using in video creation."""
    try:
        if not os.path.exists(audio_path):
            print(f"Audio file does not exist: {audio_path}")
            return False
        
        # Check file size
        file_size = os.path.getsize(audio_path)
        if file_size < 1000:
            print(f"Audio file too small ({file_size} bytes): {audio_path}")
            return False
        
        # Try to read with wave module
        try:
            with wave.open(audio_path, 'rb') as wav_file:
                frames = wav_file.getnframes()
                sample_rate = wav_file.getframerate()
                channels = wav_file.getnchannels()
                duration = frames / sample_rate if sample_rate > 0 else 0
                
                if frames == 0 or sample_rate == 0 or duration == 0:
                    print(f"Invalid audio parameters: {audio_path}")
                    return False
                
                print(f"Audio validated: {duration:.2f}s, {sample_rate}Hz, {channels}ch")
                return True
                
        except wave.Error as e:
            print(f"Wave validation failed for {audio_path}: {e}")
            return False
            
    except Exception as e:
        print(f"Error validating audio file {audio_path}: {e}")
        return False

def repair_audio_with_ffmpeg(audio_path: str) -> bool:
    """Repair corrupted audio file using FFmpeg."""
    try:
        backup_path = audio_path + ".backup"
        temp_path = audio_path + ".temp"
        
        # Backup original
        os.rename(audio_path, backup_path)
        
        # Repair with FFmpeg
        cmd = [
            'ffmpeg', '-y',
            '-err_detect', 'ignore_err',
            '-i', backup_path,
            '-c:a', 'pcm_s16le',
            '-ar', '22050',
            '-ac', '1',
            temp_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(temp_path):
            # Replace with repaired version
            os.rename(temp_path, audio_path)
            os.remove(backup_path)
            print(f"Repaired audio file: {audio_path}")
            return True
        else:
            # Restore backup
            os.rename(backup_path, audio_path)
            print(f"Failed to repair {audio_path}: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error repairing audio: {e}")
        return False

def create_safe_audio_clip(audio_path: str) -> Optional[AudioFileClip]:
    """Safely create AudioFileClip with validation and repair attempts."""
    try:
        # First validate the audio file
        if not validate_audio_file_for_video(audio_path):
            print(f"Audio validation failed, attempting repair: {audio_path}")
            if repair_audio_with_ffmpeg(audio_path):
                print(f"Audio repair successful: {audio_path}")
            else:
                print(f"Audio repair failed: {audio_path}")
                return None
        
        # Try to create AudioFileClip
        try:
            audio_clip = AudioFileClip(audio_path)
            
            # Validate duration
            if audio_clip.duration is None or audio_clip.duration <= 0:
                print(f"Invalid duration for audio: {audio_path}")
                audio_clip.close()
                return None
            
            print(f"Successfully loaded audio: {audio_path} (duration: {audio_clip.duration:.2f}s)")
            return audio_clip
            
        except Exception as e:
            print(f"MoviePy failed to load audio {audio_path}: {e}")
            # Attempt repair and retry
            if repair_audio_with_ffmpeg(audio_path):
                try:
                    audio_clip = AudioFileClip(audio_path)
                    if audio_clip.duration is None or audio_clip.duration <= 0:
                        audio_clip.close()
                        return None
                    print(f"Successfully loaded repaired audio: {audio_path}")
                    return audio_clip
                except Exception as e2:
                    print(f"Failed to load even after repair: {e2}")
                    return None
            return None
            
    except Exception as e:
        print(f"Error creating audio clip for {audio_path}: {e}")
        return None

def create_video_with_audio(
    slide_images: List[str],
    audio_files: List[str],
    background_music_file: Optional[str] = None,
    output_file: str = "output_video.mp4"
) -> str:
    """Create video from slide images and audio files with improved error handling."""
    try:
        video_clips = []
        successful_clips = 0
        
        # Filter out invalid audio files first
        valid_audio_files = []
        for audio_path in audio_files:
            if validate_audio_file_for_video(audio_path):
                valid_audio_files.append(audio_path)
            else:
                print(f"Skipping invalid audio file: {audio_path}")
        
        if not valid_audio_files:
            raise Exception("No valid audio files found")
        
        # Ensure we have matching slides for valid audio files
        min_length = min(len(slide_images), len(valid_audio_files))
        print(f"Creating video with {min_length} slides and audio clips")
        
        for i in range(min_length):
            slide_path = slide_images[i]
            audio_path = valid_audio_files[i]
            
            if not os.path.exists(slide_path):
                print(f"Warning: Slide image not found: {slide_path}")
                continue
            
            # Create audio clip safely
            audio_clip = create_safe_audio_clip(audio_path)
            if audio_clip is None:
                print(f"Warning: Failed to load audio file: {audio_path}")
                continue
            
            duration = audio_clip.duration
            print(f"Processing slide {i+1}: {os.path.basename(slide_path)} with duration {duration:.2f}s")
            
            try:
                # Create image clip with audio duration
                image_clip = ImageClip(slide_path, duration=duration)
                
                # Set audio to image clip
                image_clip = image_clip.set_audio(audio_clip)
                video_clips.append(image_clip)
                successful_clips += 1
                
            except Exception as e:
                print(f"Error processing slide {i+1}: {e}")
                if audio_clip:
                    audio_clip.close()
                continue
        
        if not video_clips:
            raise Exception("No valid video clips created")
        
        print(f"Successfully created {successful_clips} video clips")
        
        # Concatenate all clips
        final_video = concatenate_videoclips(video_clips, method="compose")
        
        # Add background music if provided
        if background_music_file and os.path.exists(background_music_file):
            try:
                background_music = AudioFileClip(background_music_file)
                
                # Loop background music to match video duration
                if background_music.duration < final_video.duration:
                    loops_needed = int(final_video.duration / background_music.duration) + 1
                    background_music = background_music.loop(n=loops_needed)
                
                # Set background music volume lower
                background_music = background_music.volumex(0.1)
                
                # Trim background music to video duration
                background_music = background_music.subclip(0, final_video.duration)
                
                # Composite audio
                final_audio = CompositeAudioClip([final_video.audio, background_music])
                final_video = final_video.set_audio(final_audio)
                
                print("Added background music to video")
                
            except Exception as e:
                print(f"Warning: Could not add background music: {e}")
        
        # Write the final video
        print(f"Writing video to: {output_file}")
        final_video.write_videofile(
            output_file,
            fps=1,  # Low FPS for slide presentation
            codec='libx264',
            audio_codec='aac',
            temp_audiofile='temp-audio.m4a',
            remove_temp=True,
            verbose=False,
            logger=None
        )
        
        # Clean up clips
        for clip in video_clips:
            clip.close()
        final_video.close()
        
        print(f"Video created successfully: {output_file}")
        return output_file
        
    except Exception as e:
        print(f"Error creating video: {e}")
        raise
