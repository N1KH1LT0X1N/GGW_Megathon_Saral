"""
ArXiv Paper Fetcher Module

This module handles fetching research papers from arXiv and extracting text content.
"""

# Python 3.13 compatibility fix for missing cgi module
import sys
if sys.version_info >= (3, 13):
    from app.services import cgi_compat
    sys.modules['cgi'] = cgi_compat.cgi

import arxiv
import pdfplumber
import requests
import tempfile
import os
from typing import Dict, Optional
import re


class ArxivFetcher:
    """Handles fetching and processing arXiv papers."""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def extract_arxiv_id(self, arxiv_url: str) -> Optional[str]:
        """
        Extract arXiv ID from various URL formats.
        
        Args:
            arxiv_url: URL like https://arxiv.org/abs/2301.00001 or just the ID
            
        Returns:
            arXiv ID or None if invalid
        """
        # Handle direct ID input
        if not arxiv_url.startswith('http'):
            return arxiv_url
        
        # Extract ID from URL patterns
        patterns = [
            r'arxiv\.org/abs/([0-9]+\.[0-9]+)',
            r'arxiv\.org/pdf/([0-9]+\.[0-9]+)',
            r'arxiv\.org/abs/([a-z-]+/[0-9]+)',
            r'arxiv\.org/pdf/([a-z-]+/[0-9]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, arxiv_url)
            if match:
                return match.group(1)
        
        return None
    
    def fetch_paper_metadata(self, arxiv_id: str) -> Dict:
        """
        Fetch paper metadata from arXiv.
        
        Args:
            arxiv_id: arXiv paper ID
            
        Returns:
            Dictionary with paper metadata
        """
        try:
            search = arxiv.Search(id_list=[arxiv_id])
            paper = next(search.results())
            
            return {
                'title': paper.title,
                'authors': [author.name for author in paper.authors],
                'abstract': paper.summary,
                'published': paper.published,
                'categories': paper.categories,
                'pdf_url': paper.pdf_url
            }
        except Exception as e:
            raise Exception(f"Failed to fetch paper metadata: {str(e)}")
    
    def download_pdf(self, pdf_url: str) -> str:
        """
        Download PDF from URL to temporary file.
        
        Args:
            pdf_url: URL to the PDF file
            
        Returns:
            Path to downloaded PDF file
        """
        try:
            response = requests.get(pdf_url, stream=True)
            response.raise_for_status()
            
            pdf_path = os.path.join(self.temp_dir, "paper.pdf")
            with open(pdf_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return pdf_path
        except Exception as e:
            raise Exception(f"Failed to download PDF: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text content from PDF file.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text content
        """
        try:
            text_content = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
            
            return '\n\n'.join(text_content)
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def fetch_paper_content(self, arxiv_url: str) -> Dict:
        """
        Main method to fetch complete paper content.
        
        Args:
            arxiv_url: arXiv URL or ID
            
        Returns:
            Dictionary with metadata and full text content
        """
        try:
            # Extract arXiv ID
            arxiv_id = self.extract_arxiv_id(arxiv_url)
            if not arxiv_id:
                raise ValueError("Invalid arXiv URL or ID format")
            
            # Fetch metadata
            metadata = self.fetch_paper_metadata(arxiv_id)
            
            # Download and extract PDF content
            pdf_path = self.download_pdf(metadata['pdf_url'])
            full_text = self.extract_text_from_pdf(pdf_path)
            
            # Clean up temporary file
            os.remove(pdf_path)
            
            return {
                'metadata': metadata,
                'full_text': full_text,
                'arxiv_id': arxiv_id
            }
            
        except Exception as e:
            raise Exception(f"Error processing arXiv paper: {str(e)}")
    
    def cleanup(self):
        """Clean up temporary directory."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
