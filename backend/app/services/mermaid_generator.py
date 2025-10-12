"""
Mermaid Mind Map Generator Module

This module converts structured analysis data into Mermaid mind map syntax.
"""

from typing import Dict, List
import re


class MermaidGenerator:
    """Generates Mermaid mind map diagrams from structured data."""
    
    def __init__(self):
        """Initialize the Mermaid generator."""
        self.section_icons = {
            'introduction': 'fa fa-book',
            'methodology': 'fa fa-cogs', 
            'results': 'fa fa-chart-bar',
            'conclusions': 'fa fa-flag-checkered'
        }
    
    def sanitize_text(self, text: str) -> str:
        """
        Sanitize text for Mermaid compatibility.
        
        Args:
            text: Input text to sanitize
            
        Returns:
            Sanitized text safe for Mermaid
        """
        # Remove or replace characters that can break Mermaid syntax
        text = text.replace('"', "'")  # Replace double quotes with single quotes
        text = text.replace('\n', ' ')  # Replace newlines with spaces
        text = text.replace('\r', ' ')  # Replace carriage returns with spaces
        
        # Remove parentheses and brackets as they have special meaning in Mermaid
        text = text.replace('(', '')  # Remove opening parenthesis
        text = text.replace(')', '')  # Remove closing parenthesis
        text = text.replace('[', '')  # Remove opening bracket
        text = text.replace(']', '')  # Remove closing bracket
        
        # Remove other special characters that can break Mermaid
        text = text.replace('`', "'")  # Replace backticks
        text = text.replace('#', 'No.')  # Replace hash symbols
        text = text.replace('&', 'and')  # Replace ampersands
        text = text.replace('<', '')  # Remove angle brackets
        text = text.replace('>', '')  # Remove angle brackets
        text = text.replace('{', '')  # Remove curly braces
        text = text.replace('}', '')  # Remove curly braces
        
        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Limit length to avoid overly long nodes (optional)
        if len(text) > 100:
            text = text[:97] + '...'
        
        return text
    
    def generate_section_content(self, section_name: str, key_points: List[str]) -> str:
        """
        Generate Mermaid syntax for a single section.
        
        Args:
            section_name: Name of the section (e.g., 'introduction')
            key_points: List of key points for the section
            
        Returns:
            Mermaid syntax string for the section
        """
        # Capitalize section name for display
        display_name = section_name.capitalize()
        icon = self.section_icons.get(section_name, 'fa fa-circle')
        
        # Start with section header
        section_lines = [f"      {display_name}"]
        section_lines.append(f"        ::icon({icon})")
        
        # Add key points
        for point in key_points:
            sanitized_point = self.sanitize_text(point)
            if sanitized_point:  # Only add non-empty points
                section_lines.append(f"        {sanitized_point}")
        
        return '\n'.join(section_lines)
    
    def generate_mindmap(self, analysis_data: Dict) -> str:
        """
        Generate complete Mermaid mind map from analysis data.
        
        Args:
            analysis_data: Structured analysis data from Gemini
            
        Returns:
            Complete Mermaid mind map syntax
        """
        try:
            # Extract title and sanitize it thoroughly
            raw_title = analysis_data.get('title', 'Research Paper')
            title = self.sanitize_text(raw_title)
            
            # Fallback if title becomes empty after sanitization
            if not title or len(title.strip()) == 0:
                title = 'Research Paper'
            
            # Start building the mind map
            mindmap_lines = [
                "mindmap",
                f"  root(({title}))"
            ]
            
            # Add each section in order
            section_order = ['introduction', 'methodology', 'results', 'conclusions']
            sections = analysis_data.get('sections', {})
            
            for section_name in section_order:
                if section_name in sections:
                    section_data = sections[section_name]
                    key_points = section_data.get('key_points', [])
                    
                    if key_points:  # Only add section if it has key points
                        section_content = self.generate_section_content(section_name, key_points)
                        mindmap_lines.append(section_content)
            
            return '\n'.join(mindmap_lines)
            
        except Exception as e:
            raise Exception(f"Error generating Mermaid mind map: {str(e)}")
    
    def validate_mindmap_syntax(self, mindmap_text: str) -> bool:
        """
        Basic validation of Mermaid mind map syntax.
        
        Args:
            mindmap_text: Mermaid syntax to validate
            
        Returns:
            True if syntax appears valid, False otherwise
        """
        try:
            # Basic checks
            if not mindmap_text.strip().startswith('mindmap'):
                return False
            
            if 'root((' not in mindmap_text:
                return False
            
            # Check for balanced parentheses in root
            root_start = mindmap_text.find('root((')
            if root_start != -1:
                root_end = mindmap_text.find('))', root_start)
                if root_end == -1:
                    return False
            
            return True
            
        except Exception:
            return False
    
    def get_mindmap_preview(self, mindmap_text: str, max_lines: int = 20) -> str:
        """
        Get a preview of the mind map for logging/debugging.
        
        Args:
            mindmap_text: Complete Mermaid syntax
            max_lines: Maximum number of lines to show
            
        Returns:
            Preview string
        """
        lines = mindmap_text.split('\n')
        if len(lines) <= max_lines:
            return mindmap_text
        
        preview_lines = lines[:max_lines]
        preview_lines.append(f"... ({len(lines) - max_lines} more lines)")
        
        return '\n'.join(preview_lines)
    
    def count_nodes(self, mindmap_text: str) -> int:
        """
        Count the number of nodes in the mind map.
        
        Args:
            mindmap_text: Mermaid syntax
            
        Returns:
            Number of nodes (excluding root)
        """
        lines = mindmap_text.split('\n')
        node_count = 0
        
        for line in lines:
            # Count lines that represent nodes (not root, not icons, not empty)
            stripped = line.strip()
            if (stripped and 
                not stripped.startswith('mindmap') and 
                not stripped.startswith('root((') and 
                not stripped.startswith('::icon(') and
                not stripped.startswith(')')):
                node_count += 1
        
        return node_count
