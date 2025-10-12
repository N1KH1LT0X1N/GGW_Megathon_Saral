"""
Podcast Script Generator Service
Generates interactive student-teacher dialogue for research papers
"""
import os
import logging
import google.generativeai as genai
from typing import List, Dict, Tuple
import re

logger = logging.getLogger(__name__)

class PodcastGenerator:
    """Generate podcast-style dialogues for research papers"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            logger.info("Initialized Gemini model: gemini-2.0-flash")
        else:
            logger.warning("GEMINI_API_KEY not configured")
            self.model = None
    
    def generate_podcast_script(
        self, 
        paper_content: str, 
        metadata: Dict,
        num_exchanges: int = 10,
        language: str = "en",
        complexity_level: str = "medium"
    ) -> List[Dict[str, str]]:
        """
        Generate a student-teacher podcast dialogue
        
        Args:
            paper_content: Full paper content or summary
            metadata: Paper metadata (title, authors, etc.)
            num_exchanges: Number of question-answer exchanges
            language: Language code (en=English, hi=Hindi, ta=Tamil, etc.)
            complexity_level: Complexity level ('easy', 'medium', 'advanced')
        
        Returns:
            List of dialogue segments with speaker and text
        """
        if not self.model:
            error_msg = "Gemini model not initialized. Check GEMINI_API_KEY in .env"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        title = metadata.get("title", "Research Paper")
        
        # Language names mapping
        language_names = {
            "en": "English",
            "hi": "Hindi",
            "ta": "Tamil",
            "te": "Telugu",
            "bn": "Bengali",
            "mr": "Marathi",
            "gu": "Gujarati"
        }
        lang_name = language_names.get(language, "English")
        
        language_instruction = f"\n**IMPORTANT: Generate the ENTIRE dialogue in {lang_name} language only.**\n" if language != "en" else ""
        
        # Complexity level instructions
        complexity_instructions = {
            'easy': """
**COMPLEXITY LEVEL: BEGINNER FRIENDLY**
- Use simple, everyday language
- Avoid technical jargon - explain any necessary terms in simple words
- Use analogies and real-world examples
- Student asks basic, fundamental questions
- Teacher explains like talking to a curious high school student
- Focus on core concepts and big picture ideas""",
            'medium': """
**COMPLEXITY LEVEL: INTERMEDIATE**
- Balance accessible explanations with some technical terminology
- Explain technical terms but assume basic familiarity
- Student asks informed questions showing some background knowledge
- Teacher provides moderate depth without oversimplifying
- Suitable for undergraduate students or educated professionals""",
            'advanced': """
**COMPLEXITY LEVEL: EXPERT**
- Use full technical and academic terminology
- Student asks sophisticated, probing questions
- Teacher discusses methodology, implications, and nuances in depth
- Assume domain expertise and research background
- Suitable for graduate students, researchers, and domain experts"""
        }
        
        complexity_instruction = complexity_instructions.get(complexity_level, complexity_instructions['medium'])
        
        prompt = f"""You are creating an engaging educational podcast script about a research paper.{language_instruction}
{complexity_instruction}

Paper Title: {title}

Create a natural conversation between:
1. **Student (Curious Learner)**: An enthusiastic student who asks insightful questions
2. **Teacher (Expert Professor)**: A knowledgeable professor who explains clearly

Guidelines:
- Make it conversational and engaging, like a real podcast
- Student asks questions a learner would naturally have
- Teacher explains concepts clearly with examples
- Each turn should be 20-30 words maximum (for TTS constraints)
- Use simple language, avoid special characters
- Include {num_exchanges} question-answer exchanges
- Start with Teacher introducing the paper
- End with Student summarizing key takeaways

Paper Content:
{paper_content[:3000]}

Format your response EXACTLY as:
Teacher: [opening statement]
Student: [first question]
Teacher: [answer]
Student: [follow-up question]
...

Generate the complete podcast script now:"""

        try:
            logger.info(f"Generating podcast for paper: {title[:50]}...")
            response = self.model.generate_content(prompt)
            script_text = response.text
            
            logger.info(f"Received response from Gemini API, length: {len(script_text)}")
            
            # Parse the script into dialogue segments
            dialogue = self._parse_dialogue(script_text)
            
            if not dialogue:
                logger.warning("No dialogue segments parsed from response")
                raise Exception("Failed to parse dialogue from AI response. Try again.")
            
            logger.info(f"Generated podcast with {len(dialogue)} segments")
            return dialogue
            
        except Exception as e:
            error_msg = f"Failed to generate podcast script: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Error type: {type(e).__name__}")
            raise Exception(error_msg)
    
    def _parse_dialogue(self, script_text: str) -> List[Dict[str, str]]:
        """Parse script text into structured dialogue"""
        dialogue = []
        
        # Split by speaker labels
        lines = script_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for Teacher: or Student: prefix
            if line.startswith("Teacher:"):
                text = line.replace("Teacher:", "").strip()
                if text:
                    dialogue.append({
                        "speaker": "teacher",
                        "text": self._clean_text(text),
                        "gender": "male"
                    })
            elif line.startswith("Student:"):
                text = line.replace("Student:", "").strip()
                if text:
                    dialogue.append({
                        "speaker": "student",
                        "text": self._clean_text(text),
                        "gender": "female"
                    })
        
        return dialogue
    
    def _clean_text(self, text: str) -> str:
        """Clean text for TTS compatibility"""
        # Remove quotes and special formatting
        text = text.replace('"', '').replace("'", "")
        text = text.replace('*', '').replace('_', '')
        
        # Remove markdown formatting
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        
        # Limit to 30 words for TTS constraint
        words = text.split()
        if len(words) > 30:
            text = " ".join(words[:30])
        
        return text.strip()
    
    def chunk_dialogue_for_tts(
        self, 
        dialogue: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """
        Ensure each dialogue segment meets TTS constraints
        Split long segments if needed
        """
        chunked = []
        
        for segment in dialogue:
            text = segment["text"]
            words = text.split()
            
            # If within limit, keep as is
            if len(words) <= 30:
                chunked.append(segment)
            else:
                # Split into chunks of 30 words
                for i in range(0, len(words), 30):
                    chunk_words = words[i:i+30]
                    chunked.append({
                        "speaker": segment["speaker"],
                        "text": " ".join(chunk_words),
                        "gender": segment["gender"]
                    })
        
        return chunked
    
    def generate_quick_summary_dialogue(
        self, 
        paper_summary: str,
        title: str
    ) -> List[Dict[str, str]]:
        """Generate a short 5-exchange dialogue for quick podcasts"""
        
        dialogue = [
            {
                "speaker": "teacher",
                "text": f"Welcome! Today we're discussing {title[:50]}",
                "gender": "male"
            },
            {
                "speaker": "student", 
                "text": "That sounds interesting! What is this paper about?",
                "gender": "female"
            },
            {
                "speaker": "teacher",
                "text": paper_summary[:150],
                "gender": "male"
            },
            {
                "speaker": "student",
                "text": "What makes this research important?",
                "gender": "female"
            },
            {
                "speaker": "teacher",
                "text": "This work advances our understanding and opens new research directions",
                "gender": "male"
            },
            {
                "speaker": "student",
                "text": "Thank you for explaining! I learned a lot today",
                "gender": "female"
            }
        ]
        
        return self.chunk_dialogue_for_tts(dialogue)

# Singleton instance
podcast_generator = PodcastGenerator()
