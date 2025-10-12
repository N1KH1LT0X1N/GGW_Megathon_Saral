"""
Visual Storytelling Service - Generates narrative scripts with scene descriptions
for research papers, enabling AI-generated visual storytelling videos.
"""

import google.generativeai as genai
import re
from typing import Dict, List, Tuple
import json


class VisualStorytellingService:
    """Service for generating visual storytelling scripts from research papers."""
    
    def __init__(self, api_key: str):
        """Initialize the service with Gemini API key."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def generate_storytelling_script(
        self, 
        paper_content: str, 
        complexity_level: str = "medium",
        video_duration: int = 180,  # Default 3 minutes
        style: str = "educational"
    ) -> Dict[str, any]:
        """
        Generate a visual storytelling script from research paper.
        
        Args:
            paper_content: The full text of the research paper
            complexity_level: easy, medium, or advanced
            video_duration: Target video duration in seconds
            style: educational, dramatic, documentary, or minimalist
            
        Returns:
            Dict containing scenes with narration and visual descriptions
        """
        
        complexity_instructions = {
            'easy': """
Target Audience: General public, high school students
- Use simple, everyday language
- Focus on the big picture and practical applications
- Use relatable analogies and examples
- Avoid technical jargon unless essential""",
            'medium': """
Target Audience: Undergraduate students, educated professionals
- Balance clarity with technical accuracy
- Include key concepts and methodologies
- Use some domain-specific terminology with context""",
            'advanced': """
Target Audience: Graduate students, researchers, domain experts
- Use full academic terminology
- Include detailed methodology and results
- Discuss implications and future research directions"""
        }
        
        style_instructions = {
            'educational': """
Style: Educational/Tutorial
- Clear, structured narrative
- Build concepts step by step
- Use diagrams and visual aids
- Focus on teaching and understanding""",
            'dramatic': """
Style: Dramatic/Engaging
- Create narrative tension and resolution
- Use storytelling techniques
- Emphasize the journey and discovery
- Make it emotionally engaging""",
            'documentary': """
Style: Documentary
- Professional, authoritative tone
- Present facts and findings objectively
- Use real-world context and impact
- Interview-style narration""",
            'minimalist': """
Style: Minimalist/Modern
- Concise, impactful statements
- Clean visual descriptions
- Focus on key insights
- Modern, sleek aesthetic"""
        }
        
        num_scenes = max(5, min(15, video_duration // 15))  # 15-20 seconds per scene
        
        prompt = f"""
You are a visual storytelling expert creating a narrative video script from a research paper.

{complexity_instructions.get(complexity_level, complexity_instructions['medium'])}
{style_instructions.get(style, style_instructions['educational'])}

VIDEO SPECIFICATIONS:
- Target Duration: {video_duration} seconds
- Number of Scenes: {num_scenes}
- Average Scene Duration: {video_duration // num_scenes} seconds

TASK:
Create a compelling visual storytelling script that transforms this research paper into an engaging video narrative.

OUTPUT FORMAT (JSON):
{{
  "title": "Engaging video title",
  "description": "Brief video description",
  "total_duration": {video_duration},
  "scenes": [
    {{
      "scene_number": 1,
      "duration": 15,
      "narration": "Clear, engaging narration text (no more than 2-3 sentences)",
      "visual_description": "Detailed description of what should be shown visually",
      "visual_style": "Style/mood of the visual (e.g., abstract, realistic, diagram, etc.)",
      "text_overlay": "Optional text to display on screen",
      "transition": "Transition effect to next scene"
    }}
  ]
}}

NARRATION GUIDELINES:
- Write in a conversational, engaging tone
- Each scene's narration should be speakable in {video_duration // num_scenes} seconds
- Connect scenes with smooth narrative flow
- Build a story arc: Hook → Context → Problem → Solution → Impact
- Avoid contracted words (use "we will" not "we'll")

VISUAL DESCRIPTION GUIDELINES:
- Be specific and descriptive for AI image generation
- Include: subject, setting, style, mood, colors, composition
- Focus on visual metaphors that explain concepts
- Ensure visuals support and enhance the narration
- Consider what would make compelling imagery

RESEARCH PAPER CONTENT:
{paper_content[:8000]}  # Limit content to avoid token limits

Generate the complete visual storytelling script in the specified JSON format.
"""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON directly
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    raise ValueError("Could not extract JSON from response")
            
            script_data = json.loads(json_str)
            
            # Validate and clean the script
            script_data = self._validate_and_clean_script(script_data, num_scenes)
            
            return script_data
            
        except Exception as e:
            print(f"Error generating storytelling script: {e}")
            raise
    
    def _validate_and_clean_script(self, script_data: Dict, expected_scenes: int) -> Dict:
        """Validate and clean the generated script data."""
        
        # Ensure required fields exist
        if "scenes" not in script_data:
            raise ValueError("No scenes found in generated script")
        
        # Clean narration text
        for scene in script_data["scenes"]:
            if "narration" in scene:
                # Remove markdown formatting
                scene["narration"] = re.sub(r'\*\*([^*]+)\*\*', r'\1', scene["narration"])
                scene["narration"] = re.sub(r'\*([^*]+)\*', r'\1', scene["narration"])
                # Remove special characters that might cause TTS issues
                scene["narration"] = re.sub(r'[^\w\s.,!?;:\-()"]', ' ', scene["narration"])
                scene["narration"] = re.sub(r'\s+', ' ', scene["narration"]).strip()
            
            # Ensure duration is set
            if "duration" not in scene or scene["duration"] <= 0:
                scene["duration"] = 15  # Default 15 seconds
            
            # Ensure visual description exists
            if "visual_description" not in scene or not scene["visual_description"]:
                scene["visual_description"] = "Abstract visualization related to the concept"
        
        return script_data
    
    def generate_scene_prompts_for_image_generation(self, scenes: List[Dict]) -> List[str]:
        """
        Convert scene visual descriptions into optimized prompts for AI image generation.
        
        Args:
            scenes: List of scene dictionaries with visual descriptions
            
        Returns:
            List of optimized image generation prompts
        """
        
        prompts = []
        
        for scene in scenes:
            visual_desc = scene.get("visual_description", "")
            visual_style = scene.get("visual_style", "professional")
            
            # Enhance prompt with style modifiers
            style_modifiers = {
                "abstract": "abstract art, modern, colorful, conceptual",
                "realistic": "photorealistic, detailed, professional photography",
                "diagram": "clean diagram, educational illustration, clear labels",
                "minimalist": "minimalist design, clean lines, simple colors",
                "scientific": "scientific illustration, technical diagram, precise",
                "cinematic": "cinematic composition, dramatic lighting, high quality"
            }
            
            style_text = style_modifiers.get(visual_style.lower(), "professional, high quality")
            
            # Construct optimized prompt
            enhanced_prompt = f"{visual_desc}, {style_text}, 16:9 aspect ratio, high resolution"
            
            prompts.append(enhanced_prompt)
        
        return prompts
    
    def refine_narration_for_tts(self, narration: str) -> str:
        """
        Refine narration text for optimal text-to-speech generation.
        
        Args:
            narration: Raw narration text
            
        Returns:
            Cleaned and optimized narration text
        """
        
        # Remove any remaining markdown
        narration = re.sub(r'[*_#`]', '', narration)
        
        # Expand common abbreviations for better TTS
        abbreviations = {
            'e.g.': 'for example',
            'i.e.': 'that is',
            'etc.': 'et cetera',
            'vs.': 'versus',
            'Dr.': 'Doctor',
            'Prof.': 'Professor'
        }
        
        for abbr, expansion in abbreviations.items():
            narration = narration.replace(abbr, expansion)
        
        # Ensure proper spacing
        narration = re.sub(r'\s+', ' ', narration)
        
        # Remove any URLs
        narration = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', narration)
        
        return narration.strip()
    
    def split_narration_into_sentences(self, narration: str) -> List[str]:
        """Split narration into individual sentences for timing."""
        # Split by periods, question marks, and exclamation marks
        sentences = re.split(r'[.!?]+', narration)
        return [s.strip() for s in sentences if s.strip()]
    
    def estimate_narration_duration(self, narration: str, words_per_minute: int = 150) -> float:
        """
        Estimate the duration of narration in seconds.
        
        Args:
            narration: The narration text
            words_per_minute: Average speaking rate
            
        Returns:
            Estimated duration in seconds
        """
        words = len(narration.split())
        duration_minutes = words / words_per_minute
        return duration_minutes * 60
    
    def adjust_scene_durations(self, scenes: List[Dict]) -> List[Dict]:
        """
        Adjust scene durations based on narration length.
        
        Args:
            scenes: List of scene dictionaries
            
        Returns:
            Scenes with adjusted durations
        """
        for scene in scenes:
            narration = scene.get("narration", "")
            estimated_duration = self.estimate_narration_duration(narration)
            
            # Add buffer time (1.5x the estimated duration)
            scene["duration"] = max(10, int(estimated_duration * 1.5))
        
        return scenes


def generate_visual_storytelling_script(
    api_key: str,
    paper_content: str,
    complexity_level: str = "medium",
    video_duration: int = 180,
    style: str = "educational"
) -> Dict:
    """
    Convenience function to generate visual storytelling script.
    
    Args:
        api_key: Google Gemini API key
        paper_content: Research paper text content
        complexity_level: easy, medium, or advanced
        video_duration: Target video duration in seconds
        style: educational, dramatic, documentary, or minimalist
        
    Returns:
        Dictionary containing the complete visual storytelling script
    """
    service = VisualStorytellingService(api_key)
    script = service.generate_storytelling_script(
        paper_content=paper_content,
        complexity_level=complexity_level,
        video_duration=video_duration,
        style=style
    )
    
    # Adjust durations based on narration
    script["scenes"] = service.adjust_scene_durations(script["scenes"])
    
    # Refine all narrations for TTS
    for scene in script["scenes"]:
        scene["narration"] = service.refine_narration_for_tts(scene["narration"])
    
    return script
