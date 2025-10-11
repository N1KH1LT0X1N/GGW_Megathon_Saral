"""
Sarvam AI TTS Service
Handles text-to-speech using Sarvam AI's Bulbul v2 model
"""
import os
import requests
import logging
import base64
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class BhashiniService:
    """Service for Sarvam AI TTS integration"""
    
    def __init__(self):
        # Sarvam AI configuration
        self.api_key = os.getenv("SARVAM_API_KEY")
        self.endpoint = "https://api.sarvam.ai/text-to-speech"
        self.model = "bulbul:v2"
        
        # Voice mapping: teacher (male) and student (female)
        self.voice_map = {
            "teacher": "abhilash",  # Male voice
            "student": "anushka",   # Female voice
            "male": "abhilash",
            "female": "anushka"
        }
        
        # Language code mapping to Sarvam's BCP-47 format
        self.lang_map = {
            "en": "en-IN",
            "hi": "hi-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "bn": "bn-IN",
            "mr": "mr-IN",
            "gu": "gu-IN",
            "kn": "kn-IN",
            "ml": "ml-IN",
            "pa": "pa-IN",
            "od": "od-IN"
        }
        
        # Log configuration
        if self.api_key:
            logger.info(f"Sarvam AI TTS configured with model: {self.model}")
        else:
            logger.warning("SARVAM_API_KEY not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for Sarvam AI"""
        return {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def text_to_speech(self, text: str, gender: str = "female", language: str = "en") -> Optional[str]:
        """
        Convert text to speech using Sarvam AI's Bulbul v2 model
        
        Args:
            text: Text to convert (max 500 characters per Sarvam API limit)
            gender: Voice gender (male/female) or speaker role (teacher/student)
            language: Language code (en, hi, ta, te, bn, mr, gu)
        
        Returns:
            Base64 encoded audio content or None if failed
        """
        if not self.api_key:
            logger.error("SARVAM_API_KEY not configured")
            return None
        
        # Validate text length (Sarvam limit: 500 characters)
        if len(text) > 500:
            logger.warning(f"Text exceeds 500 characters ({len(text)}). Truncating...")
            text = text[:500]
        
        # Map language code to Sarvam format
        target_language_code = self.lang_map.get(language, "en-IN")
        
        # Get appropriate speaker voice
        speaker = self.voice_map.get(gender.lower(), "anushka")
        
        payload = {
            "text": text,
            "target_language_code": target_language_code,
            "speaker": speaker,
            "model": self.model,
            "enable_preprocessing": True
        }
        
        logger.info(f"Sarvam TTS Request - Language: {target_language_code}, Speaker: {speaker}")
        logger.info(f"Text length: {len(text)} characters")
        
        try:
            logger.info(f"Making request to: {self.endpoint}")
            logger.info(f"Request payload: {payload}")
            
            response = requests.post(
                self.endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=30
            )
            
            logger.info(f"TTS Response Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    logger.info(f"Response data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    
                    # Sarvam returns base64 encoded audio in 'audios' array
                    if "audios" in data and data["audios"]:
                        # Combine all audio chunks
                        combined_audio = "".join(data["audios"])
                        logger.info(f"TTS successful - Audio size: {len(combined_audio)} bytes (base64)")
                        return combined_audio
                    else:
                        logger.error(f"TTS response missing 'audios' field")
                        logger.error(f"Full response: {data}")
                        return None
                except Exception as json_error:
                    logger.error(f"Failed to parse JSON response: {str(json_error)}")
                    logger.error(f"Raw response: {response.text[:500]}")
                    return None
            else:
                logger.error(f"TTS API error: {response.status_code}")
                logger.error(f"Response text: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"TTS request failed (network error): {str(e)}")
            return None
        except Exception as e:
            logger.error(f"TTS request failed (unexpected error): {str(e)}")
            logger.exception(e)
            return None
    
    def translate_text(self, text: str, source_language: str = "en", target_language: str = "hi") -> Optional[str]:
        """
        Translate text using Bhashini MT (Machine Translation) API
        
        Args:
            text: Text to translate (max 50 words)
            source_language: Source language code
            target_language: Target language code
        
        Returns:
            Translated text or None if failed
        """
        # Get language-specific MT endpoint
        api_endpoint = self._get_endpoint(target_language, "MT")
        
        if not api_endpoint:
            logger.error(f"Bhashini MT not configured for language: {target_language}")
            return None
        
        # Validate constraints
        word_count = len(text.split())
        if word_count > 50:
            logger.warning(f"Text exceeds 50 words ({word_count}). Truncating...")
            words = text.split()[:50]
            text = " ".join(words)
        
        payload = {
            "input_text": text
        }
        
        try:
            # Use endpoint directly - it already contains the full path
            response = requests.post(
                api_endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=30,
                verify=False
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    translated = data.get("data", {}).get("output_text")
                    logger.info(f"Translation successful")
                    return translated
                else:
                    logger.error(f"Translation failed: {data.get('error')}")
                    return None
            else:
                logger.error(f"MT API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Translation request failed: {str(e)}")
            return None
    
    def _clean_text_for_tts(self, text: str) -> str:
        """Remove special characters for TTS compatibility"""
        # Keep only alphanumeric, spaces, and basic punctuation
        import re
        # Replace common special chars with spoken equivalents
        text = text.replace("%", " percent")
        text = text.replace("&", " and")
        text = text.replace("@", " at")
        text = text.replace("#", " number")
        text = text.replace("$", " dollars")
        
        # Remove remaining special characters
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        
        return text.strip()
    
    def download_audio(self, audio_url: str, output_path: str) -> bool:
        """
        Download audio file from S3 URL
        
        Args:
            audio_url: S3 URL of the audio file
            output_path: Local path to save the audio file
        
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.get(audio_url, timeout=60, verify=False)
            
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                logger.info(f"Audio downloaded: {output_path}")
                return True
            else:
                logger.error(f"Audio download failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Audio download error: {str(e)}")
            return False
    
    def recognize_speech(self, audio_file_path: str, language: str = "en") -> Optional[str]:
        """
        Convert speech to text using Bhashini ASR (Audio Speech Recognition) API
        
        Args:
            audio_file_path: Path to WAV audio file (max 20 seconds, <5MB)
            language: Language code (en, hi, ta, te, bn, mr, gu)
        
        Returns:
            Recognized text or None if failed
        """
        # Get language-specific ASR endpoint
        api_endpoint = self._get_endpoint(language, "ASR")
        
        if not api_endpoint:
            logger.error(f"Bhashini ASR not configured for language: {language}")
            return None
        
        try:
            with open(audio_file_path, 'rb') as audio_file:
                files = {'audio_file': audio_file}
                
                # Use endpoint directly - it already contains the full path
                response = requests.post(
                    api_endpoint,
                    files=files,
                    timeout=60,
                    verify=False
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        recognized_text = data.get("data", {}).get("recognized_text")
                        logger.info(f"ASR successful for {language}")
                        return recognized_text
                    else:
                        logger.error(f"ASR failed: {data.get('error')}")
                        return None
                else:
                    logger.error(f"ASR API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"ASR request failed: {str(e)}")
            return None
    
    def extract_text_from_image(self, image_file_path: str, language: str = "en") -> Optional[str]:
        """
        Extract text from image using Bhashini OCR (Optical Character Recognition) API
        
        Args:
            image_file_path: Path to image file (jpg/png/jpeg, <5MB)
            language: Language code (en, hi, ta, te, bn, mr, gu)
        
        Returns:
            Extracted text or None if failed
        """
        # Get language-specific OCR endpoint
        api_endpoint = self._get_endpoint(language, "OCR")
        
        if not api_endpoint:
            logger.error(f"Bhashini OCR not configured for language: {language}")
            return None
        
        try:
            with open(image_file_path, 'rb') as image_file:
                files = {'file': image_file}
                
                # Use endpoint directly - it already contains the full path
                response = requests.post(
                    api_endpoint,
                    files=files,
                    timeout=60,
                    verify=False
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        decoded_text = data.get("data", {}).get("decoded_text")
                        logger.info(f"OCR successful for {language}")
                        return decoded_text
                    else:
                        logger.error(f"OCR failed: {data.get('error')}")
                        return None
                else:
                    logger.error(f"OCR API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"OCR request failed: {str(e)}")
            return None

# Singleton instance
bhashini_service = BhashiniService()
