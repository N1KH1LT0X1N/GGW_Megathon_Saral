"""
Cinematic Video Service - Creates professional videos with transitions, effects, and audio.
Enhanced version of video_service.py specifically for visual storytelling.
"""

import os
from pathlib import Path
from typing import List, Optional, Dict
from moviepy.editor import (
    ImageClip, 
    concatenate_videoclips, 
    AudioFileClip, 
    CompositeVideoClip,
    TextClip,
    CompositeAudioClip,
    VideoFileClip
)
from moviepy.video.fx import fadein, fadeout, resize
from moviepy.video.compositing.transitions import crossfadein, crossfadeout
import subprocess


class CinematicVideoService:
    """Service for creating cinematic videos with professional effects."""
    
    def __init__(self):
        """Initialize the video service."""
        self.default_fps = 24  # Cinematic frame rate
        self.default_codec = 'libx264'
        self.default_audio_codec = 'aac'
    
    def create_storytelling_video(
        self,
        scenes: List[Dict],
        image_paths: List[str],
        audio_paths: List[str],
        output_path: str,
        background_music_path: Optional[str] = None,
        music_volume: float = 0.1,
        add_text_overlays: bool = True,
        transition_duration: float = 1.0
    ) -> str:
        """
        Create a cinematic storytelling video from scenes, images, and audio.
        
        Args:
            scenes: List of scene dictionaries with metadata
            image_paths: List of paths to scene images
            audio_paths: List of paths to narration audio files
            output_path: Path for the output video
            background_music_path: Optional path to background music
            music_volume: Volume for background music (0.0 to 1.0)
            add_text_overlays: Whether to add text overlays
            transition_duration: Duration of transitions in seconds
            
        Returns:
            Path to the generated video
        """
        
        try:
            print(f"Creating cinematic video with {len(scenes)} scenes")
            
            # Validate inputs
            if len(image_paths) != len(scenes):
                raise ValueError(f"Mismatch: {len(scenes)} scenes but {len(image_paths)} images")
            
            if len(audio_paths) != len(scenes):
                raise ValueError(f"Mismatch: {len(scenes)} scenes but {len(audio_paths)} audio files")
            
            # Create video clips for each scene
            video_clips = []
            
            for i, (scene, image_path, audio_path) in enumerate(zip(scenes, image_paths, audio_paths)):
                print(f"Processing scene {i+1}/{len(scenes)}: {scene.get('scene_number', i+1)}")
                
                # Create scene clip
                scene_clip = self._create_scene_clip(
                    scene=scene,
                    image_path=image_path,
                    audio_path=audio_path,
                    add_text_overlay=add_text_overlays,
                    transition_duration=transition_duration if i < len(scenes) - 1 else 0
                )
                
                if scene_clip:
                    video_clips.append(scene_clip)
            
            if not video_clips:
                raise Exception("No valid video clips were created")
            
            print(f"Concatenating {len(video_clips)} clips...")
            
            # Concatenate all clips with transitions
            final_video = concatenate_videoclips(
                video_clips, 
                method="compose",
                padding=-transition_duration if transition_duration > 0 else 0  # Overlap for transitions
            )
            
            # Add background music if provided
            if background_music_path and os.path.exists(background_music_path):
                final_video = self._add_background_music(
                    video=final_video,
                    music_path=background_music_path,
                    volume=music_volume
                )
            
            # Write the final video
            print(f"Writing video to: {output_path}")
            
            final_video.write_videofile(
                output_path,
                fps=self.default_fps,
                codec=self.default_codec,
                audio_codec=self.default_audio_codec,
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None,
                threads=4,
                preset='medium'
            )
            
            # Clean up
            for clip in video_clips:
                clip.close()
            final_video.close()
            
            print(f"Video created successfully: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Error creating cinematic video: {e}")
            raise
    
    def _create_scene_clip(
        self,
        scene: Dict,
        image_path: str,
        audio_path: str,
        add_text_overlay: bool = True,
        transition_duration: float = 1.0
    ) -> Optional[ImageClip]:
        """Create a video clip for a single scene."""
        
        try:
            # Validate files
            if not os.path.exists(image_path):
                print(f"Image not found: {image_path}")
                return None
            
            if not os.path.exists(audio_path):
                print(f"Audio not found: {audio_path}")
                return None
            
            # Load audio to get duration
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration
            
            if duration <= 0:
                print(f"Invalid audio duration: {duration}")
                audio_clip.close()
                return None
            
            print(f"Creating scene clip: {duration:.2f}s")
            
            # Create image clip
            image_clip = ImageClip(image_path, duration=duration)
            
            # Apply ken burns effect (subtle zoom)
            image_clip = self._apply_ken_burns_effect(image_clip, zoom_ratio=1.1)
            
            # Fade effects disabled to avoid MoviePy compatibility issues
            # image_clip = image_clip.fx(fadein, transition_duration / 2)
            # image_clip = image_clip.fx(fadeout, transition_duration / 2)
            
            # Set audio
            image_clip = image_clip.set_audio(audio_clip)
            
            # Add text overlay if requested
            if add_text_overlay and scene.get("text_overlay"):
                image_clip = self._add_text_overlay(
                    clip=image_clip,
                    text=scene["text_overlay"],
                    duration=duration
                )
            
            return image_clip
            
        except Exception as e:
            print(f"Error creating scene clip: {e}")
            return None
    
    def _apply_ken_burns_effect(self, clip: ImageClip, zoom_ratio: float = 1.1) -> ImageClip:
        """Apply Ken Burns effect (slow zoom) to image clip."""
        
        try:
            # Disabled Ken Burns effect due to PIL/MoviePy compatibility issues
            # Just return the clip as-is
            return clip
            
        except Exception as e:
            print(f"Error applying Ken Burns effect: {e}")
            return clip
    
    def _add_text_overlay(
        self,
        clip: ImageClip,
        text: str,
        duration: float,
        fontsize: int = 40,
        color: str = 'white',
        position: str = 'bottom'
    ) -> CompositeVideoClip:
        """Add text overlay to video clip."""
        
        try:
            # Create text clip
            txt_clip = TextClip(
                text,
                fontsize=fontsize,
                color=color,
                font='Arial',
                stroke_color='black',
                stroke_width=2,
                method='caption',
                size=(clip.w - 100, None)  # Word wrap
            )
            
            # Set duration and position
            txt_clip = txt_clip.set_duration(duration)
            
            if position == 'bottom':
                txt_clip = txt_clip.set_position(('center', clip.h - 100))
            elif position == 'top':
                txt_clip = txt_clip.set_position(('center', 50))
            else:
                txt_clip = txt_clip.set_position('center')
            
            # Fade in/out disabled
            # txt_clip = txt_clip.fx(fadein, 0.5)
            # txt_clip = txt_clip.fx(fadeout, 0.5)
            
            # Composite
            composite = CompositeVideoClip([clip, txt_clip])
            
            return composite
            
        except Exception as e:
            print(f"Error adding text overlay: {e}")
            return clip
    
    def _add_background_music(
        self,
        video: VideoFileClip,
        music_path: str,
        volume: float = 0.1
    ) -> VideoFileClip:
        """Add background music to video."""
        
        try:
            print("Adding background music...")
            
            # Load background music
            music = AudioFileClip(music_path)
            
            # Loop music to match video duration
            if music.duration < video.duration:
                loops_needed = int(video.duration / music.duration) + 1
                music = music.loop(n=loops_needed)
            
            # Trim to video duration
            music = music.subclip(0, video.duration)
            
            # Adjust volume
            music = music.volumex(volume)
            
            # Fade in/out music
            music = audio_fadein(music, 2.0)
            music = audio_fadeout(music, 2.0)
            
            # Composite with narration
            if video.audio:
                final_audio = CompositeAudioClip([video.audio, music])
                video = video.set_audio(final_audio)
            else:
                video = video.set_audio(music)
            
            print("Background music added successfully")
            return video
            
        except Exception as e:
            print(f"Error adding background music: {e}")
            return video
    
    def create_title_card(
        self,
        title: str,
        subtitle: Optional[str] = None,
        duration: float = 5.0,
        output_path: str = "title_card.mp4"
    ) -> str:
        """
        Create a title card for the video.
        
        Args:
            title: Main title text
            subtitle: Optional subtitle text
            duration: Duration in seconds
            output_path: Output path for the title card
            
        Returns:
            Path to the title card video
        """
        
        try:
            # Create background clip (solid color)
            from moviepy.video.VideoClip import ColorClip
            bg_clip = ColorClip(size=(1920, 1080), color=(20, 30, 50), duration=duration)
            
            # Create title text
            title_clip = TextClip(
                title,
                fontsize=80,
                color='white',
                font='Arial-Bold',
                stroke_color='black',
                stroke_width=3
            ).set_duration(duration).set_position('center')
            
            clips = [bg_clip, title_clip]
            
            # Add subtitle if provided
            if subtitle:
                subtitle_clip = TextClip(
                    subtitle,
                    fontsize=40,
                    color='lightgray',
                    font='Arial'
                ).set_duration(duration).set_position(('center', bg_clip.h * 0.6))
                
                clips.append(subtitle_clip)
            
            # Apply fade effects disabled
            # for i in range(1, len(clips)):
            #     clips[i] = clips[i].fx(fadein, 1.0)
            #     clips[i] = clips[i].fx(fadeout, 1.0)
            
            # Composite
            video = CompositeVideoClip(clips)
            
            # Write video
            video.write_videofile(
                output_path,
                fps=self.default_fps,
                codec=self.default_codec,
                verbose=False,
                logger=None
            )
            
            video.close()
            
            return output_path
            
        except Exception as e:
            print(f"Error creating title card: {e}")
            raise


def audio_fadein(audio_clip, duration):
    """Apply fade-in effect to audio clip."""
    def volumex_at(t):
        if t < duration:
            return t / duration
        return 1.0
    
    return audio_clip.fl(lambda gf, t: gf(t) * volumex_at(t), apply_to=['audio'])


def audio_fadeout(audio_clip, duration):
    """Apply fade-out effect to audio clip."""
    def volumex_at(t):
        if t > audio_clip.duration - duration:
            return (audio_clip.duration - t) / duration
        return 1.0
    
    return audio_clip.fl(lambda gf, t: gf(t) * volumex_at(t), apply_to=['audio'])


def create_visual_storytelling_video(
    scenes: List[Dict],
    image_dir: str,
    audio_dir: str,
    output_path: str,
    background_music_path: Optional[str] = None,
    add_title_card: bool = True,
    title: Optional[str] = None
) -> str:
    """
    Convenience function to create a complete visual storytelling video.
    
    Args:
        scenes: List of scene dictionaries
        image_dir: Directory containing scene images
        audio_dir: Directory containing narration audio
        output_path: Output path for the final video
        background_music_path: Optional background music
        add_title_card: Whether to add a title card
        title: Video title
        
    Returns:
        Path to the generated video
    """
    
    service = CinematicVideoService()
    
    # Collect image and audio paths
    image_paths = []
    audio_paths = []
    
    for i, scene in enumerate(scenes):
        scene_num = scene.get("scene_number", i + 1)
        
        # Find image
        image_file = f"scene_{scene_num:03d}.png"
        image_path = os.path.join(image_dir, image_file)
        
        if not os.path.exists(image_path):
            # Try alternative naming
            image_path = os.path.join(image_dir, f"scene_{i+1:03d}.png")
        
        image_paths.append(image_path)
        
        # Find audio - files are named scene_000.wav, scene_001.wav, etc.
        audio_file = f"scene_{i:03d}.wav"
        audio_path = os.path.join(audio_dir, audio_file)
        
        if not os.path.exists(audio_path):
            # Try alternative naming with scene number
            audio_path = os.path.join(audio_dir, f"scene_{scene_num:03d}.wav")
        
        audio_paths.append(audio_path)
    
    # Create title card if requested
    title_card_path = None
    if add_title_card and title:
        title_card_path = os.path.join(
            os.path.dirname(output_path),
            "title_card.mp4"
        )
        service.create_title_card(
            title=title,
            subtitle="A Visual Storytelling Experience",
            duration=5.0,
            output_path=title_card_path
        )
    
    # Create main video
    video_path = service.create_storytelling_video(
        scenes=scenes,
        image_paths=image_paths,
        audio_paths=audio_paths,
        output_path=output_path,
        background_music_path=background_music_path,
        add_text_overlays=True,
        transition_duration=1.0
    )
    
    # Combine title card with main video if created
    if title_card_path and os.path.exists(title_card_path):
        try:
            final_output = output_path.replace('.mp4', '_with_title.mp4')
            
            title_video = VideoFileClip(title_card_path)
            main_video = VideoFileClip(video_path)
            
            combined = concatenate_videoclips([title_video, main_video], method="compose")
            combined.write_videofile(
                final_output,
                fps=service.default_fps,
                codec=service.default_codec,
                audio_codec=service.default_audio_codec,
                verbose=False,
                logger=None
            )
            
            title_video.close()
            main_video.close()
            combined.close()
            
            # Replace original with combined version
            os.replace(final_output, video_path)
            os.remove(title_card_path)
            
        except Exception as e:
            print(f"Error combining title card: {e}")
    
    return video_path
