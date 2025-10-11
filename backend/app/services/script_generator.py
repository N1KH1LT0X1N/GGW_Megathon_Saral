import google.generativeai as genai
import re
import unicodedata
from typing import Dict, List
import os

def extract_paper_metadata(file_path):
    """Extract paper metadata from LaTeX or PDF text file."""
    metadata = {
        "title": "Research Paper",
        "authors": "Author", 
        "date": "2024"
    }
    
    # Check if it's a text file (likely from PDF) or a TeX file
    if file_path.endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # For text files from PDF, try to extract title from first non-empty line
            lines = content.split('\n')
            for line in lines[:10]:  # Look only in first 10 lines
                if line.strip():
                    metadata["title"] = line.strip()
                    break
            
            # Try to find author information in next few lines
            author_found = False
            for line in lines[1:20]:  # Look in lines 1-20
                # Skip empty lines
                if not line.strip():
                    continue
                
                # If we find words like "abstract" or sections, stop looking
                if re.search(r'\babstract\b|\bintroduction\b|\bsection\b', line.lower()):
                    break
                
                # Check for common author patterns
                if not author_found and not line.startswith(('http', 'www', '@')):
                    if ',' in line or 'university' in line.lower() or 'department' in line.lower():
                        metadata["authors"] = line.strip()
                        author_found = True
            
        except Exception as e:
            print(f"Error extracting metadata from text file: {e}")
        
        return metadata
    
    # Original TeX file processing
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        title_match = re.search(r'\\title\{([^}]+)\}', content)
        if title_match:
            metadata["title"] = title_match.group(1).strip()
        
        author_match = re.search(r'\\author\{([^}]+)\}', content)
        if author_match:
            metadata["authors"] = author_match.group(1).strip()
        
        date_match = re.search(r'\\date\{([^}]+)\}', content)
        if date_match:
            metadata["date"] = date_match.group(1).strip()
            
    except Exception as e:
        print(f"Error extracting metadata from LaTeX file: {e}")
    
    return metadata

def extract_text_from_file(file_path):
    """Extract clean text from LaTeX or text file."""
    # Check if it's a text file (likely from PDF) or a TeX file
    if file_path.endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except Exception as e:
            print(f"Error extracting text from text file: {e}")
            return ""
    
    # Original TeX file processing
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove LaTeX commands and comments
        content = re.sub(r'%.*?\n', '\n', content)
        content = re.sub(r'\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})*', ' ', content)
        content = re.sub(r'\{[^}]*\}', ' ', content)
        content = re.sub(r'\s+', ' ', content)
        
        return content.strip()
    except Exception as e:
        print(f"Error extracting text from LaTeX file: {e}")
        return ""

def clean_text(text):
    """Clean unicode characters from text."""
    # Replace common unicode quotes and dashes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'") 
    text = text.replace('–', '-').replace('—', '-')
    
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    
    return text

def generate_full_script_with_gemini(api_key, input_text):
    """Generate presentation script using Gemini API with improved prompts from app_1.py"""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Enhanced prompt based on app_1.py
    prompt = f"""
Create a script for a 3-5 minute educational video based on this research paper.
STRUCTURE:
Create scripts for exactly these 5 sections:
**Introduction**
**Methodology**
**Results**
**Discussion**
**Conclusion**
Important rules:
1. Each section MUST start with its exact heading as shown above
2. Keep content clear and focused - about 2-3 paragraphs per section
3. Focus on explaining the research in simple terms
4. Avoid technical jargon where possible
5. Make it engaging for a general audience
6. DO NOT include any video/animation directions or [Narrator:] tags
7. Make sure that you do not use contracted words, for example: we'll, we're.
Here’s the paper text to base the script on:
Research Paper Content:
{input_text}

Please generate the complete presentation script with clear section headers:
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating script with Gemini: {e}")
        raise

def generate_bullet_points_with_gemini(api_key, section_text):
    """Generate bullet points for a section using improved prompts."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
Convert this presentation script into 3-5 clear, concise bullet points for a slide.

REQUIREMENTS:
- Each bullet point should be one clear, complete thought
- Use action-oriented language when possible
- Make bullet points parallel in structure
- Avoid sub-bullets or nested items
- Keep each bullet to 1-2 lines maximum
- Use specific, concrete language rather than vague terms

GOOD EXAMPLES:
• "Machine learning models achieved 95% accuracy on test data"
• "New algorithm reduces processing time by 40% compared to existing methods"
• "Results show significant improvement in patient outcomes"

Script text to convert:
{section_text}

Generate exactly 3-5 bullet points in this format:
• Point 1
• Point 2  
• Point 3
• Point 4 (if needed)
• Point 5 (if needed)
"""

    try:
        response = model.generate_content(prompt)
        bullet_text = response.text.strip()
        
        # Extract bullet points more robustly
        bullets = []
        for line in bullet_text.split('\n'):
            line = line.strip()
            if line and (line.startswith('•') or line.startswith('-') or line.startswith('*') or line.startswith('·')):
                bullet = re.sub(r'^[•\-*·]\s*', '', line).strip()
                if bullet:
                    bullets.append(bullet)
        
        # Fallback: split by sentences if no bullets found
        if not bullets and section_text:
            sentences = [s.strip() for s in section_text.split('.') if s.strip()]
            bullets = sentences[:4]  # Take first 4 sentences as bullets
        
        # Ensure we have at least one bullet
        if not bullets:
            bullets = ["Key information from this section"]
        
        return bullets[:5]  # Limit to 5 bullets maximum
        
    except Exception as e:
        print(f"Error generating bullet points: {e}")
        return ["Key information from this section"]

def generate_all_bullet_points_with_gemini(api_key, sections_scripts):
    """Generate bullet points for all sections using a single prompt."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    print(f"Generating bullet points for {len(sections_scripts)} sections using single prompt")
    
    # Prepare sections text for the prompt
    sections_text = ""
    section_names = []
    for section_name, script_text in sections_scripts.items():
        if script_text and script_text.strip():
            sections_text += f"\n## {section_name}\n{script_text}\n"
            section_names.append(section_name)
    
    print(f"Sections to process: {section_names}")
    
    prompt = f"""You are a research summarization assistant helping to create presentation-ready slide bullet points from academic paper sections.

TASK: For each section provided, generate 3–5 concise, informative bullet points summarizing its key content.

BULLET POINT GUIDELINES:
• Each bullet must express one clear, complete idea
• Use action-oriented and parallel sentence structures within each section
• Avoid vague terms, sub-bullets, or complex phrasing
• Limit each bullet to 1–2 lines max
• Focus on the most important findings, methods, or conclusions
• Use specific, concrete language over generalities

INPUT: {sections_text}

OUTPUT FORMAT (strictly follow this layout):

[SECTION_NAME]
• Bullet point 1  
• Bullet point 2  
• Bullet point 3  
• Bullet point 4 (if applicable)  
• Bullet point 5 (if applicable)

[NEXT_SECTION_NAME]
• Bullet point 1  
• Bullet point 2  
• Bullet point 3  
• Bullet point 4 (if applicable)  
• Bullet point 5 (if applicable)

Process all sections in the input and generate bullet points accordingly."""

    try:
        print("Sending request to Gemini API for bullet point generation...")
        
        # Check if API key is configured
        if not api_key:
            raise ValueError("API key is not provided")
            
        response = model.generate_content(prompt)
        
        # Check if response is valid
        if not response or not hasattr(response, 'text'):
            raise ValueError("Invalid response from Gemini API")
            
        bullet_text = response.text.strip() if response.text else ""
        print(f"Received response from Gemini API (length: {len(bullet_text)} chars)")
        
        if not bullet_text:
            raise ValueError("Empty response from Gemini API")
        
        # Debug: Print first 200 chars of response
        print(f"Response preview: {bullet_text[:200]}...")
        
        # Parse the response to extract bullet points for each section
        sections_bullets = {}
        current_section = None
        
        for line in bullet_text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            # Check if line is a section header (multiple formats supported)
            section_name = None
            
            # Format 1: [SECTION_NAME]
            if line.startswith('[') and line.endswith(']'):
                section_name = line[1:-1].strip()
                print(f"Found bracket section header: '{section_name}'")
            
            # Format 2: **SECTION_NAME** (markdown bold)
            elif line.startswith('**') and line.endswith('**') and len(line) > 4:
                section_name = line[2:-2].strip()
                print(f"Found markdown section header: '{section_name}'")
            
            # Format 3: ## SECTION_NAME (markdown heading)
            elif line.startswith('##'):
                section_name = line[2:].strip()
                print(f"Found markdown heading: '{section_name}'")
            
            # Format 4: SECTION_NAME: (with colon)
            elif ':' in line and len(line.split(':')[0].strip()) < 20:
                section_name = line.split(':')[0].strip()
                print(f"Found colon section header: '{section_name}'")
            
            if section_name:
                # Normalize section name to match our standard names
                section_matched = False
                for standard_name in sections_scripts.keys():
                    if (standard_name.lower() in section_name.lower() or 
                        section_name.lower() in standard_name.lower() or
                        standard_name.lower().replace(' ', '') == section_name.lower().replace(' ', '')):
                        current_section = standard_name
                        sections_bullets[current_section] = []
                        print(f"Matched to standard section: {current_section}")
                        section_matched = True
                        break
                
                if not section_matched:
                    print(f"Warning: Could not match section '{section_name}' to any standard section")
                    print(f"Available sections: {list(sections_scripts.keys())}")
                    
            elif line and current_section and (line.startswith('•') or line.startswith('-') or line.startswith('*') or line.startswith('·')):
                bullet = re.sub(r'^[•\-*·]\s*', '', line).strip()
                if bullet:
                    sections_bullets[current_section].append(bullet)
                    print(f"Added bullet to {current_section}: {bullet[:50]}...")
        
        print(f"Parsed bullets for sections: {list(sections_bullets.keys())}")
        
        # Ensure all sections have bullets, use fallback if needed
        for section_name in sections_scripts.keys():
            if section_name not in sections_bullets or not sections_bullets[section_name]:
                print(f"Using fallback for section: {section_name}")
                # Fallback: generate bullets from section text
                script_text = sections_scripts[section_name]
                if script_text and script_text.strip():
                    sentences = [s.strip() for s in script_text.split('.') if s.strip()]
                    sections_bullets[section_name] = sentences[:4] if sentences else ["Key information from this section"]
                else:
                    sections_bullets[section_name] = ["Key information from this section"]
            
            # Limit to 5 bullets maximum
            sections_bullets[section_name] = sections_bullets[section_name][:5]
            print(f"Section {section_name}: {len(sections_bullets[section_name])} bullets")
        
        print("Successfully generated bullet points for all sections")
        return sections_bullets
        
    except Exception as e:
        print(f"Error generating all bullet points: {type(e).__name__}: {str(e)}")
        print(f"Error occurred at line: {e.__traceback__.tb_lineno if e.__traceback__ else 'unknown'}")
        
        # Additional debugging for specific error types
        if "API" in str(e).upper() or "QUOTA" in str(e).upper() or "RATE" in str(e).upper():
            print("API-related error detected. This might be due to:")
            print("- API key issues")
            print("- Rate limiting")
            print("- Service unavailability")
        elif "RESPONSE" in str(e).upper() or "TEXT" in str(e).upper():
            print("Response parsing error detected. The AI response might not be in expected format.")
        
        # Fallback: generate individual bullet points
        print("Falling back to sentence-based bullet generation...")
        sections_bullets = {}
        for section_name, script_text in sections_scripts.items():
            try:
                if script_text and script_text.strip():
                    # Clean the script text first
                    clean_script = re.sub(r'\s+', ' ', script_text.strip())
                    sentences = [s.strip() for s in clean_script.split('.') if s.strip() and len(s.strip()) > 10]
                    sections_bullets[section_name] = sentences[:4] if sentences else ["Key information from this section"]
                else:
                    sections_bullets[section_name] = ["Key information from this section"]
                print(f"Generated {len(sections_bullets[section_name])} fallback bullets for {section_name}")
            except Exception as fallback_error:
                print(f"Error in fallback for {section_name}: {fallback_error}")
                sections_bullets[section_name] = ["Key information from this section"]
                
        print("Used fallback bullet generation for all sections")
        return sections_bullets

def split_script_into_sections(full_script):
    """Split the generated script into sections."""
    sections = {
        "Introduction": "",
        "Methodology": "", 
        "Results": "",
        "Discussion": "",
        "Conclusion": ""
    }
    
    current_section = None
    lines = full_script.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line is a section header
        for section_name in sections.keys():
            if section_name.lower() in line.lower() and (
                line.startswith('#') or
                line.startswith('**') or
                line.isupper() or
                ':' in line
            ):
                current_section = section_name
                break
        else:
            # Add content to current section
            if current_section:
                sections[current_section] += line + " "
    
    # Clean up sections
    for section in sections:
        sections[section] = sections[section].strip()
        if not sections[section]:
            sections[section] = f"Content for {section} section needs to be added."
    
    return sections

def clean_script_for_tts_and_video(script_text):
    """Clean script text for TTS and video generation."""
    # Remove markdown formatting
    script_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', script_text)
    script_text = re.sub(r'\*([^*]+)\*', r'\1', script_text)
    script_text = re.sub(r'#+\s*', '', script_text)
    
    # Remove special characters that might cause TTS issues
    script_text = re.sub(r'[^\w\s.,!?;:\-()"]', ' ', script_text)
    script_text = re.sub(r'\s+', ' ', script_text)
    
    return script_text.strip()

def generate_title_introduction(title, authors, date):
    """Generate introduction script for title slide."""
    # If there are multiple authors separated by ',' or 'and', use "First Author et al."
    if ',' in authors:
        first_author = authors.split(',')[0].strip()
        authors = f"{first_author} et al."
    return f"""
Welcome to this presentation on "{title}".
This research was conducted by {authors} and published in {date}.
Today, we'll explore the key findings and contributions of this important work.
Let's begin by understanding the problem this research addresses.
"""
