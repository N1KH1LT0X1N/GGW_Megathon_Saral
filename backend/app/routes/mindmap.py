"""
Mind Map Generation Routes

FastAPI router for generating mind maps from arXiv research papers, PDFs, and LaTeX files.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import tempfile
import os
import fitz  # PyMuPDF
import shutil

from app.services.arxiv_fetcher import ArxivFetcher
from app.services.gemini_mindmap_processor import GeminiMindmapProcessor
from app.services.mermaid_generator import MermaidGenerator

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize services (these will be reused across requests)
arxiv_fetcher = ArxivFetcher()
gemini_processor = GeminiMindmapProcessor()
mermaid_generator = MermaidGenerator()


class MindmapRequest(BaseModel):
    """Request model for mindmap generation"""
    arxiv_url: str
    complexity_level: Optional[str] = "medium"  # 'easy', 'medium', 'advanced'

    class Config:
        json_schema_extra = {
            "example": {
                "arxiv_url": "https://arxiv.org/abs/2301.00001",
                "complexity_level": "medium"
            }
        }


class MindmapMetadata(BaseModel):
    """Metadata for generated mindmap"""
    arxiv_id: str
    authors: list[str]
    published: Optional[str]
    categories: list[str]
    processing_time_seconds: float
    node_count: int


class MindmapResponse(BaseModel):
    """Response model for successful mindmap generation"""
    status: str
    title: str
    mermaid_diagram: str
    metadata: MindmapMetadata
    analysis_summary: str


class ValidateUrlRequest(BaseModel):
    """Request model for URL validation"""
    arxiv_url: str


class ValidateUrlResponse(BaseModel):
    """Response model for URL validation"""
    status: str
    arxiv_id: Optional[str] = None
    message: str


@router.get("/health")
async def health_check():
    """
    Health check endpoint for mindmap service.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ArXiv Mind Map Generator"
    }


@router.post("/generate-mindmap", response_model=MindmapResponse)
async def generate_mindmap(request: MindmapRequest):
    """
    Generate a mind map from an arXiv research paper.
    
    Args:
        request: Contains arxiv_url
        
    Returns:
        MindmapResponse with the generated Mermaid diagram and metadata
        
    Raises:
        HTTPException: If generation fails
    """
    start_time = datetime.utcnow()
    
    try:
        arxiv_url = request.arxiv_url
        
        if not arxiv_url or not isinstance(arxiv_url, str):
            raise HTTPException(
                status_code=400,
                detail="arxiv_url must be a non-empty string"
            )
        
        # Step 1: Fetch paper from arXiv
        logger.info(f"Fetching paper from: {arxiv_url}")
        paper_data = arxiv_fetcher.fetch_paper_content(arxiv_url)
        
        # Step 2: Analyze paper with Gemini (with complexity level)
        logger.info(f"Analyzing paper: {paper_data['metadata']['title']} with complexity: {request.complexity_level}")
        analysis_data = gemini_processor.analyze_paper(paper_data, complexity_level=request.complexity_level)
        
        # Step 3: Generate Mermaid mind map
        logger.info("Generating Mermaid mind map")
        mermaid_diagram = mermaid_generator.generate_mindmap(analysis_data)
        
        # Validate the generated mind map
        if not mermaid_generator.validate_mindmap_syntax(mermaid_diagram):
            raise Exception("Generated mind map has invalid syntax")
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Prepare response
        response_data = MindmapResponse(
            status="success",
            title=analysis_data.get('title', paper_data['metadata']['title']),
            mermaid_diagram=mermaid_diagram,
            metadata=MindmapMetadata(
                arxiv_id=paper_data['arxiv_id'],
                authors=paper_data['metadata']['authors'],
                published=paper_data['metadata']['published'].isoformat() if paper_data['metadata']['published'] else None,
                categories=paper_data['metadata']['categories'],
                processing_time_seconds=round(processing_time, 2),
                node_count=mermaid_generator.count_nodes(mermaid_diagram)
            ),
            analysis_summary=gemini_processor.get_analysis_summary(analysis_data)
        )
        
        logger.info(f"Successfully generated mind map for: {response_data.title}")
        return response_data
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Failed to generate mind map: {str(e)}",
                "processing_time_seconds": round(processing_time, 2)
            }
        )
    
    finally:
        # Clean up temporary files
        try:
            arxiv_fetcher.cleanup()
        except Exception as e:
            logger.warning(f"Cleanup warning: {str(e)}")


@router.post("/validate-url", response_model=ValidateUrlResponse)
async def validate_arxiv_url(request: ValidateUrlRequest):
    """
    Validate arXiv URL format without processing the paper.
    
    Args:
        request: Contains arxiv_url
        
    Returns:
        ValidateUrlResponse indicating if URL is valid
    """
    try:
        arxiv_url = request.arxiv_url
        arxiv_id = arxiv_fetcher.extract_arxiv_id(arxiv_url)
        
        if arxiv_id:
            return ValidateUrlResponse(
                status="valid",
                arxiv_id=arxiv_id,
                message="URL format is valid"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid arXiv URL format"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation error: {str(e)}"
        )


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n\n"
        doc.close()
        return full_text
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_latex(latex_content: str) -> str:
    """Extract meaningful text from LaTeX source."""
    import re
    
    # Remove comments
    latex_content = re.sub(r'%.*?\n', '\n', latex_content)
    
    # Remove common LaTeX commands but keep content
    latex_content = re.sub(r'\\(title|author|section|subsection|subsubsection|paragraph)\{([^}]+)\}', r'\2', latex_content)
    
    # Remove other commands
    latex_content = re.sub(r'\\[a-zA-Z]+(\[[^\]]*\])?(\{[^}]*\})*', '', latex_content)
    
    # Remove math mode
    latex_content = re.sub(r'\$.*?\$', '', latex_content)
    latex_content = re.sub(r'\\\[.*?\\\]', '', latex_content, flags=re.DOTALL)
    latex_content = re.sub(r'\\\(.*?\\\)', '', latex_content)
    
    # Remove special characters
    latex_content = re.sub(r'[{}~\\]', ' ', latex_content)
    
    # Clean up whitespace
    latex_content = re.sub(r'\s+', ' ', latex_content)
    
    return latex_content.strip()


def extract_metadata_from_pdf(pdf_path: str) -> Dict:
    """Extract metadata from PDF."""
    try:
        doc = fitz.open(pdf_path)
        metadata = {
            "title": "Research Paper",
            "authors": ["Unknown Author"],
            "categories": ["General"],
            "published": None
        }
        
        if doc.metadata:
            if doc.metadata.get("title"):
                metadata["title"] = doc.metadata.get("title")
            if doc.metadata.get("author"):
                metadata["authors"] = [doc.metadata.get("author")]
        
        # Try to get title from first page if not in metadata
        if metadata["title"] == "Research Paper":
            first_page = doc[0].get_text()
            lines = [l.strip() for l in first_page.split('\n') if l.strip()]
            if lines:
                metadata["title"] = lines[0]
        
        doc.close()
        return metadata
    except Exception as e:
        logger.warning(f"Failed to extract PDF metadata: {str(e)}")
        return {
            "title": "Research Paper",
            "authors": ["Unknown Author"],
            "categories": ["General"],
            "published": None
        }


def extract_metadata_from_latex(latex_content: str) -> Dict:
    """Extract metadata from LaTeX source."""
    import re
    
    metadata = {
        "title": "Research Paper",
        "authors": ["Unknown Author"],
        "categories": ["General"],
        "published": None
    }
    
    # Extract title
    title_match = re.search(r'\\title\{([^}]+)\}', latex_content)
    if title_match:
        metadata["title"] = title_match.group(1).strip()
    
    # Extract authors
    author_match = re.search(r'\\author\{([^}]+)\}', latex_content)
    if author_match:
        authors_str = author_match.group(1)
        # Simple split by 'and' or commas
        authors = re.split(r'\s+and\s+|,', authors_str)
        metadata["authors"] = [a.strip() for a in authors if a.strip()]
    
    return metadata


@router.post("/generate-mindmap-from-file")
async def generate_mindmap_from_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    complexity_level: Optional[str] = Form("medium")
):
    """
    Generate a mind map from an uploaded PDF or LaTeX file.
    
    Args:
        file: Uploaded PDF or LaTeX file
        title: Optional custom title
        complexity_level: Complexity level ('easy', 'medium', 'advanced')
        
    Returns:
        MindmapResponse with the generated Mermaid diagram and metadata
    """
    start_time = datetime.utcnow()
    temp_file_path = None
    
    try:
        # Validate file type
        filename = file.filename.lower()
        if not (filename.endswith('.pdf') or filename.endswith('.tex') or filename.endswith('.latex')):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and LaTeX (.tex) files are supported"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
            temp_file_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        # Extract text and metadata based on file type
        if filename.endswith('.pdf'):
            logger.info(f"Processing PDF file: {filename}")
            full_text = extract_text_from_pdf(temp_file_path)
            metadata = extract_metadata_from_pdf(temp_file_path)
        else:  # LaTeX file
            logger.info(f"Processing LaTeX file: {filename}")
            latex_content = content.decode('utf-8')
            full_text = extract_text_from_latex(latex_content)
            metadata = extract_metadata_from_latex(latex_content)
        
        # Override title if provided
        if title:
            metadata["title"] = title
        
        # Create paper_data structure
        paper_data = {
            "metadata": metadata,
            "full_text": full_text,
            "arxiv_id": "uploaded-file"
        }
        
        # Step 1: Analyze paper with Gemini (with complexity level)
        logger.info(f"Analyzing paper: {metadata['title']} with complexity: {complexity_level}")
        analysis_data = gemini_processor.analyze_paper(paper_data, complexity_level=complexity_level)
        
        # Step 2: Generate Mermaid mind map
        logger.info("Generating Mermaid mind map")
        mermaid_diagram = mermaid_generator.generate_mindmap(analysis_data)
        
        # Validate the generated mind map
        if not mermaid_generator.validate_mindmap_syntax(mermaid_diagram):
            raise Exception("Generated mind map has invalid syntax")
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Prepare response
        response_data = {
            "status": "success",
            "title": analysis_data.get('title', metadata['title']),
            "mermaid_diagram": mermaid_diagram,
            "metadata": {
                "arxiv_id": "uploaded-file",
                "authors": metadata['authors'],
                "published": metadata.get('published'),
                "categories": metadata['categories'],
                "processing_time_seconds": round(processing_time, 2),
                "node_count": mermaid_generator.count_nodes(mermaid_diagram)
            },
            "analysis_summary": gemini_processor.get_analysis_summary(analysis_data)
        }
        
        logger.info(f"Successfully generated mind map for: {response_data['title']}")
        return response_data
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mind map: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {str(e)}")
