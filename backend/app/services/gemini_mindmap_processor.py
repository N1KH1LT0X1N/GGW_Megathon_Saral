"""
Gemini API Integration Module for Mind Map Generation

This module handles communication with Google's Gemini API to analyze research papers
and extract structured information for mind map generation.
"""

import google.generativeai as genai
import json
import os
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class GeminiMindmapProcessor:
    """Handles Gemini API integration for paper analysis."""
    
    def __init__(self):
        """Initialize Gemini API client."""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        # List available models first
        try:
            models = list(genai.list_models())
            print("📋 Available Gemini models:")
            for model in models:
                if 'generateContent' in model.supported_generation_methods:
                    print(f"   - {model.name}")
        except Exception as e:
            print(f"⚠️  Could not list models: {e}")
        
        # Try different model names in order of preference (using latest available models)
        model_names = [
            'models/gemini-2.5-flash',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
            'models/gemini-1.5-flash-001',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-pro-001', 
            'models/gemini-1.5-pro',
            'models/gemini-pro'
        ]
        
        self.model = None
        for model_name in model_names:
            try:
                self.model = genai.GenerativeModel(model_name)
                print(f"✅ Using Gemini model: {model_name}")
                break
            except Exception as e:
                print(f"❌ Model {model_name} not available: {e}")
                continue
        
        if self.model is None:
            raise Exception("No compatible Gemini model found. Please check your API key and model availability.")
    
    def create_analysis_prompt(self, paper_title: str, paper_text: str) -> str:
        """
        Create a comprehensive prompt for Gemini to analyze the research paper.
        
        Args:
            paper_title: Title of the research paper
            paper_text: Full text content of the paper
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""
You are an expert research analyst. Please analyze the following research paper and create a structured mind map outline.

Paper Title: {paper_title}

Paper Content:
{paper_text[:15000]}  # Limit to avoid token limits

Please analyze this research paper and create a structured mind map with the following requirements:

1. Divide the content into exactly 4 main sections:
   - Introduction
   - Methodology  
   - Results
   - Conclusions

2. For each section, identify 3-5 key points that capture the most important information
3. Each key point must be a SINGLE KEYWORD or SHORT PHRASE (2-4 words maximum)
4. Focus on the most significant concepts, methods, and findings
5. Use technical terms that are essential to understanding the paper
6. Keep it simple and clean - no sentences, just keywords

Return your analysis as a JSON object with this exact structure:
{{
    "title": "Research Paper Title",
    "sections": {{
        "introduction": {{
            "key_points": [
                "Problem keyword",
                "Solution keyword", 
                "Contribution keyword"
            ]
        }},
        "methodology": {{
            "key_points": [
                "Core approach keyword",
                "Algorithm keyword",
                "Architecture keyword"
            ]
        }},
        "results": {{
            "key_points": [
                "Main result keyword",
                "Performance keyword",
                "Benchmark keyword"
            ]
        }},
        "conclusions": {{
            "key_points": [
                "Achievement keyword",
                "Significance keyword",
                "Future work keyword"
            ]
        }}
    }}
}}

CRITICAL REQUIREMENTS:
- Each key point must be 1-4 words maximum
- Use the most important technical terms and concepts
- Focus on distinctive and essential keywords only
- No sentences, no explanations, just keywords
- Return ONLY the JSON object, no additional text
"""
        return prompt
    
    def analyze_paper(self, paper_data: Dict) -> Dict:
        """
        Analyze research paper using Gemini API.
        
        Args:
            paper_data: Dictionary containing paper metadata and full text
            
        Returns:
            Structured analysis data
        """
        try:
            # Create analysis prompt
            prompt = self.create_analysis_prompt(
                paper_data['metadata']['title'],
                paper_data['full_text']
            )
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Extract and parse JSON from response
            response_text = response.text.strip()
            
            # Clean up response text to extract JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # Parse JSON response
            try:
                analysis_data = json.loads(response_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    raise ValueError("Could not extract valid JSON from Gemini response")
            
            # Validate the structure
            self._validate_analysis_structure(analysis_data)
            
            return analysis_data
            
        except Exception as e:
            raise Exception(f"Error analyzing paper with Gemini: {str(e)}")
    
    def _validate_analysis_structure(self, data: Dict) -> None:
        """
        Validate that the analysis data has the expected structure.
        
        Args:
            data: Analysis data to validate
            
        Raises:
            ValueError: If structure is invalid
        """
        required_keys = ['title', 'sections']
        if not all(key in data for key in required_keys):
            raise ValueError("Analysis data missing required keys")
        
        required_sections = ['introduction', 'methodology', 'results', 'conclusions']
        if not all(section in data['sections'] for section in required_sections):
            raise ValueError("Analysis data missing required sections")
        
        for section in required_sections:
            if 'key_points' not in data['sections'][section]:
                raise ValueError(f"Section '{section}' missing 'key_points'")
            
            key_points = data['sections'][section]['key_points']
            if not isinstance(key_points, list) or len(key_points) == 0:
                raise ValueError(f"Section '{section}' has invalid or empty key_points")
    
    def get_analysis_summary(self, analysis_data: Dict) -> str:
        """
        Get a summary of the analysis for logging/debugging.
        
        Args:
            analysis_data: Structured analysis data
            
        Returns:
            Summary string
        """
        title = analysis_data.get('title', 'Unknown')
        total_points = sum(
            len(section.get('key_points', []))
            for section in analysis_data.get('sections', {}).values()
        )
        
        return f"Analyzed '{title}' with {total_points} total key points across 4 sections"
