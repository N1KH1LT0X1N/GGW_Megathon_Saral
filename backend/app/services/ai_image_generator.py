"""
AI Image Generation Service - Generates placeholder images from text prompts.
Using free placeholder generation with text overlays for development/demo purposes.
"""

import os
import requests
import base64
from pathlib import Path
from typing import List, Optional, Dict
from PIL import Image, ImageDraw, ImageFont
import io
import hashlib
import json


class AIImageGenerator:
    """Service for generating placeholder images with text overlays (free, no API required)."""
    
    def __init__(self, provider: str = "placeholder", api_key: Optional[str] = None):
        """
        Initialize the image generator.
        
        Args:
            provider: Image generation provider (currently only 'placeholder' is used)
            api_key: API key (not required for placeholder generation)
        """
        self.provider = provider.lower()
        self.api_key = api_key
        
        # API endpoints (kept for compatibility, but not used with placeholder)
        self.endpoints = {
            "stability": "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            "dalle": "https://api.openai.com/v1/images/generations"
        }
    
    def generate_image(
        self, 
        prompt: str, 
        output_path: str,
        width: int = 1024,
        height: int = 576,  # 16:9 aspect ratio
        style: str = "professional"
    ) -> str:
        """
        Generate an image from a text prompt.
        
        Args:
            prompt: Text description of the image to generate
            output_path: Path where the image should be saved
            width: Image width in pixels
            height: Image height in pixels
            style: Visual style preference
            
        Returns:
            Path to the generated image
        """
        
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Check cache first
        cached_path = self._check_cache(prompt, output_path)
        if cached_path:
            print(f"Using cached image for prompt: {prompt[:50]}...")
            return cached_path
        
        try:
            # Try Hugging Face first (free with API key)
            if self.api_key:
                print(f"Generating AI image with Hugging Face for: {prompt[:50]}...")
                return self._generate_huggingface(prompt, output_path, width, height)
            elif self.provider == "stability" and self.api_key:
                return self._generate_stability_ai(prompt, output_path, width, height)
            elif self.provider == "dalle" and self.api_key:
                return self._generate_dalle(prompt, output_path, width, height)
            else:
                # Fallback to gradient generation
                print(f"Generating gradient image for: {prompt[:50]}...")
                return self._generate_placeholder(prompt, output_path, width, height)
        
        except Exception as e:
            print(f"Error generating image: {e}")
            print(f"Falling back to placeholder generation")
            return self._generate_placeholder(prompt, output_path, width, height)
    
    def _generate_huggingface(
        self, 
        prompt: str, 
        output_path: str,
        width: int,
        height: int
    ) -> str:
        """
        Generate image using Hugging Face Inference API (FREE).
        Uses Stable Diffusion model.
        """
        
        API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Enhance prompt for better quality
        enhanced_prompt = f"{prompt}, professional, high quality, detailed, 8k"
        
        payload = {
            "inputs": enhanced_prompt,
            "parameters": {
                "width": width,
                "height": height,
                "num_inference_steps": 30,
                "guidance_scale": 7.5
            }
        }
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                # Save the image
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                
                # Cache the result
                self._save_to_cache(prompt, output_path)
                
                print(f"✓ Generated AI image: {output_path}")
                return output_path
            else:
                print(f"Hugging Face API error: {response.status_code} - {response.text}")
                raise Exception(f"API returned {response.status_code}")
                
        except Exception as e:
            print(f"Error with Hugging Face API: {e}")
            raise
    
    def _generate_stability_ai(
        self, 
        prompt: str, 
        output_path: str,
        width: int,
        height: int
    ) -> str:
        """Generate image using Stability AI API."""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        
        # Stability AI parameters
        data = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                },
                {
                    "text": "blurry, low quality, distorted, watermark, text",
                    "weight": -1
                }
            ],
            "cfg_scale": 7,
            "height": height,
            "width": width,
            "samples": 1,
            "steps": 30,
        }
        
        response = requests.post(
            self.endpoints["stability"],
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"Stability AI API error: {response.status_code} - {response.text}")
        
        data = response.json()
        
        # Save the image
        for artifact in data.get("artifacts", []):
            if artifact.get("finishReason") == "SUCCESS":
                image_data = base64.b64decode(artifact["base64"])
                with open(output_path, "wb") as f:
                    f.write(image_data)
                
                # Cache the result
                self._save_to_cache(prompt, output_path)
                
                print(f"Generated image with Stability AI: {output_path}")
                return output_path
        
        raise Exception("No successful image generated by Stability AI")
    
    def _generate_dalle(
        self, 
        prompt: str, 
        output_path: str,
        width: int,
        height: int
    ) -> str:
        """Generate image using OpenAI DALL-E API."""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # DALL-E 3 supports specific sizes
        # Map to closest supported size
        if width >= 1792 or height >= 1792:
            size = "1792x1024"
        elif width > height:
            size = "1792x1024"
        else:
            size = "1024x1024"
        
        data = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": "standard"
        }
        
        response = requests.post(
            self.endpoints["dalle"],
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"DALL-E API error: {response.status_code} - {response.text}")
        
        result = response.json()
        image_url = result["data"][0]["url"]
        
        # Download the image
        image_response = requests.get(image_url, timeout=30)
        with open(output_path, "wb") as f:
            f.write(image_response.content)
        
        # Resize if needed
        img = Image.open(output_path)
        if img.size != (width, height):
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            img.save(output_path)
        
        # Cache the result
        self._save_to_cache(prompt, output_path)
        
        print(f"Generated image with DALL-E: {output_path}")
        return output_path
    
    def _generate_placeholder(
        self, 
        prompt: str, 
        output_path: str,
        width: int,
        height: int
    ) -> str:
        """
        Generate a clean abstract gradient image based on prompt keywords.
        No text overlay - just beautiful gradients.
        """
        
        # Generate color scheme based on prompt keywords
        prompt_lower = prompt.lower()
        
        # Determine color palette based on content
        if any(word in prompt_lower for word in ['brain', 'neural', 'network', 'ai', 'technology', 'computer']):
            # Tech theme - blue/purple
            colors = [(30, 30, 60), (60, 80, 180), (100, 120, 255)]
        elif any(word in prompt_lower for word in ['justice', 'legal', 'law', 'court', 'scales']):
            # Legal theme - gold/dark blue
            colors = [(20, 30, 50), (100, 80, 40), (180, 150, 80)]
        elif any(word in prompt_lower for word in ['graph', 'chart', 'data', 'statistics', 'bar']):
            # Data theme - teal/green
            colors = [(20, 60, 80), (40, 120, 140), (60, 180, 200)]
        elif any(word in prompt_lower for word in ['world', 'map', 'global', 'international']):
            # Global theme - blue/green
            colors = [(20, 50, 70), (40, 100, 120), (60, 150, 180)]
        elif any(word in prompt_lower for word in ['future', 'innovation', 'research', 'science']):
            # Science theme - purple/pink
            colors = [(50, 20, 60), (120, 60, 140), (180, 100, 200)]
        else:
            # Default theme - warm gradient
            colors = [(40, 60, 100), (80, 100, 140), (120, 140, 180)]
        
        # Create multi-color gradient
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Create smooth gradient
        for i in range(height):
            progress = i / height
            
            if progress < 0.5:
                # First half - blend color 0 to color 1
                local_progress = progress * 2
                r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * local_progress)
                g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * local_progress)
                b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * local_progress)
            else:
                # Second half - blend color 1 to color 2
                local_progress = (progress - 0.5) * 2
                r = int(colors[1][0] + (colors[2][0] - colors[1][0]) * local_progress)
                g = int(colors[1][1] + (colors[2][1] - colors[1][1]) * local_progress)
                b = int(colors[1][2] + (colors[2][2] - colors[1][2]) * local_progress)
            
            draw.rectangle([(0, i), (width, i + 1)], fill=(r, g, b))
        
        # Save the image
        img.save(output_path, 'PNG')
        
        # Cache the result
        self._save_to_cache(prompt, output_path)
        
        print(f"Generated placeholder image: {output_path}")
        return output_path
    
    def _get_cache_key(self, prompt: str) -> str:
        """Generate a cache key from a prompt."""
        return hashlib.md5(prompt.encode()).hexdigest()
    
    def _check_cache(self, prompt: str, output_path: str) -> Optional[str]:
        """Check if an image for this prompt already exists in cache."""
        cache_dir = Path(output_path).parent / ".cache"
        cache_dir.mkdir(exist_ok=True)
        
        cache_key = self._get_cache_key(prompt)
        cache_file = cache_dir / f"{cache_key}.json"
        
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                    cached_image_path = cache_data.get("image_path")
                    
                    if cached_image_path and os.path.exists(cached_image_path):
                        # Copy cached image to output path
                        img = Image.open(cached_image_path)
                        img.save(output_path)
                        return output_path
            except Exception as e:
                print(f"Error reading cache: {e}")
        
        return None
    
    def _save_to_cache(self, prompt: str, image_path: str):
        """Save generated image info to cache."""
        try:
            cache_dir = Path(image_path).parent / ".cache"
            cache_dir.mkdir(exist_ok=True)
            
            cache_key = self._get_cache_key(prompt)
            cache_file = cache_dir / f"{cache_key}.json"
            
            cache_data = {
                "prompt": prompt,
                "image_path": image_path,
                "provider": self.provider
            }
            
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f)
        except Exception as e:
            print(f"Error saving to cache: {e}")
    
    def generate_multiple_images(
        self,
        prompts: List[str],
        output_dir: str,
        width: int = 1024,
        height: int = 576,
        prefix: str = "scene"
    ) -> List[str]:
        """
        Generate multiple images from a list of prompts.
        
        Args:
            prompts: List of text prompts
            output_dir: Directory to save images
            width: Image width
            height: Image height
            prefix: Filename prefix
            
        Returns:
            List of paths to generated images
        """
        
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        generated_paths = []
        
        for i, prompt in enumerate(prompts):
            output_path = os.path.join(output_dir, f"{prefix}_{i+1:03d}.png")
            
            try:
                image_path = self.generate_image(
                    prompt=prompt,
                    output_path=output_path,
                    width=width,
                    height=height
                )
                generated_paths.append(image_path)
                print(f"Generated image {i+1}/{len(prompts)}")
                
            except Exception as e:
                print(f"Error generating image {i+1}: {e}")
                # Generate placeholder on error
                image_path = self._generate_placeholder(
                    prompt=prompt,
                    output_path=output_path,
                    width=width,
                    height=height
                )
                generated_paths.append(image_path)
        
        return generated_paths


def generate_images_from_prompts(
    prompts: List[str],
    output_dir: str,
    provider: str = "placeholder",
    api_key: Optional[str] = None,
    width: int = 1024,
    height: int = 576
) -> List[str]:
    """
    Convenience function to generate images from prompts.
    
    Args:
        prompts: List of image prompts
        output_dir: Output directory for images
        provider: Image generation provider
        api_key: API key for the provider
        width: Image width
        height: Image height
        
    Returns:
        List of generated image paths
    """
    generator = AIImageGenerator(provider=provider, api_key=api_key)
    return generator.generate_multiple_images(
        prompts=prompts,
        output_dir=output_dir,
        width=width,
        height=height
    )
