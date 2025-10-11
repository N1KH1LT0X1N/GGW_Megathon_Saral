import os
import fitz  # PyMuPDF
import re
import tempfile
import uuid
import shutil
from pathlib import Path
from typing import Dict, List, Tuple

def process_pdf_file(pdf_path: str, paper_id: str) -> Dict:
    """
    Process a PDF file to extract text, images, and metadata.
    
    Args:
        pdf_path: Path to the PDF file
        paper_id: Unique identifier for the paper
        
    Returns:
        Dictionary with metadata, extracted images, and text
    """
    # Create directory for extracted content
    extract_dir = f"temp/papers/{paper_id}/source"
    os.makedirs(extract_dir, exist_ok=True)
    
    # Create directory for images
    image_dir = os.path.join(extract_dir, "images")
    os.makedirs(image_dir, exist_ok=True)
    
    # Extract images and text from PDF
    doc = fitz.open(pdf_path)
    
    # Extract metadata
    metadata = extract_pdf_metadata(doc)
    
    # Extract text
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n\n"
    
    # Extract and save images
    image_files = extract_pdf_images(doc, image_dir)
    
    # Create a text file with the extracted content
    text_file_path = os.path.join(extract_dir, "extracted_text.txt")
    with open(text_file_path, "w", encoding="utf-8") as f:
        f.write(full_text)
    
    # Save a copy of the PDF
    pdf_copy_path = os.path.join(extract_dir, f"paper.pdf")
    shutil.copy(pdf_path, pdf_copy_path)
    
    # Create a structure compatible with the script generator
    return {
        "metadata": metadata,
        "text_file_path": text_file_path,
        "tex_file_path": text_file_path,  # Add this for compatibility with script generator
        "source_dir": extract_dir,
        "image_files": image_files,
        "pdf_path": pdf_copy_path,
        "status": "processed"
    }

def extract_pdf_metadata(doc: fitz.Document) -> Dict:
    """Extract metadata from the PDF document."""
    metadata = {
        "title": "Research Paper",
        "authors": "Author",
        "date": "2024"
    }
    
    # Try to get metadata from PDF
    if doc.metadata:
        # Title
        if doc.metadata.get("title"):
            metadata["title"] = doc.metadata.get("title")
        
        # Authors
        if doc.metadata.get("author"):
            metadata["authors"] = doc.metadata.get("author")
        
        # Date - try to extract from different fields
        date_fields = ["creationDate", "modDate"]
        for field in date_fields:
            if doc.metadata.get(field):
                date_str = doc.metadata.get(field)
                # Convert from PDF date format if needed (D:YYYYMMDD...)
                if date_str.startswith("D:"):
                    date_str = date_str[2:6]  # Extract just year
                metadata["date"] = date_str
                break
    
    # Fallback: Try to extract title from first page if metadata doesn't have it
    if metadata["title"] == "Research Paper":
        first_page = doc[0].get_text()
        lines = first_page.split('\n')
        if lines and len(lines) > 0:
            # First non-empty line might be the title
            for line in lines:
                if line.strip():
                    metadata["title"] = line.strip()
                    break
    
    return metadata

def extract_pdf_images(doc: fitz.Document, output_dir: str) -> List[str]:
    """
    Extract images from PDF and save them to disk.
    
    Args:
        doc: PyMuPDF document
        output_dir: Directory to save extracted images
        
    Returns:
        List of paths to saved image files
    """
    image_files = []
    image_count = 0
    
    for page_index, page in enumerate(doc):
        # Get images
        image_list = page.get_images(full=True)
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            
            # Extract image
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Get extension
            ext = base_image["ext"]
            if ext.lower() == "jpeg":
                ext = "jpg"
            
            # Save image
            image_filename = f"image_{page_index+1}_{img_index+1}.{ext}"
            image_path = os.path.join(output_dir, image_filename)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            
            image_files.append(image_path)
            image_count += 1
    
    # If no images found, try alternative extraction method for figures
    if image_count == 0:
        image_files = extract_figures_from_pdf(doc, output_dir)
    
    return image_files

def extract_figures_from_pdf(doc: fitz.Document, output_dir: str) -> List[str]:
    """
    Alternative method to extract figures as images from the PDF.
    This tries to identify figure regions and extract them as images.
    
    Args:
        doc: PyMuPDF document
        output_dir: Directory to save extracted figures
        
    Returns:
        List of paths to saved figure files
    """
    image_files = []
    
    # Try to find figures based on text patterns
    figure_patterns = [r"Figure \d+", r"Fig\. \d+", r"FIGURE \d+"]
    
    for page_index, page in enumerate(doc):
        text_blocks = page.get_text("dict")["blocks"]
        
        for block_index, block in enumerate(text_blocks):
            if "lines" in block:
                for line in block["lines"]:
                    if "spans" in line:
                        for span in line["spans"]:
                            text = span.get("text", "")
                            
                            # Check if this might be a figure caption
                            is_figure_caption = False
                            for pattern in figure_patterns:
                                if re.search(pattern, text):
                                    is_figure_caption = True
                                    break
                            
                            if is_figure_caption:
                                # Try to capture the area above this caption as a figure
                                # This is an approximation - figures are usually above captions
                                caption_rect = fitz.Rect(span["bbox"])
                                figure_rect = fitz.Rect(
                                    caption_rect.x0 - 20,
                                    caption_rect.y0 - 200,  # Look 200 points above
                                    caption_rect.x1 + 20,
                                    caption_rect.y0 - 10
                                )
                                
                                # Make sure the rect is within page bounds
                                figure_rect.intersect(page.rect)
                                
                                # Only proceed if the rect has sufficient area
                                if figure_rect.width > 100 and figure_rect.height > 100:
                                    # Render this region as an image
                                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=figure_rect)
                                    image_filename = f"figure_{page_index+1}_{block_index+1}.png"
                                    image_path = os.path.join(output_dir, image_filename)
                                    pix.save(image_path)
                                    image_files.append(image_path)
    
    return image_files

def extract_text_sections_from_pdf(doc: fitz.Document) -> Dict[str, str]:
    """
    Try to extract structured sections (intro, methods, results, etc.) from PDF.
    
    Args:
        doc: PyMuPDF document
        
    Returns:
        Dictionary mapping section names to their text content
    """
    sections = {
        "Introduction": "",
        "Methodology": "",
        "Results": "",
        "Discussion": "",
        "Conclusion": ""
    }
    
    # Common section heading patterns in academic papers
    section_patterns = {
        "Introduction": [r"introduction", r"1\.?\s+introduction"],
        "Methodology": [r"methodology", r"methods", r"experimental setup", r"materials and methods"],
        "Results": [r"results", r"findings", r"experimental results"],
        "Discussion": [r"discussion"],
        "Conclusion": [r"conclusion", r"conclusions", r"summary", r"final remarks"]
    }
    
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n\n"
    
    # Split text into lines
    lines = full_text.split("\n")
    
    current_section = None
    for i, line in enumerate(lines):
        line_lower = line.strip().lower()
        
        # Check if this line is a section heading
        for section, patterns in section_patterns.items():
            for pattern in patterns:
                if re.search(pattern, line_lower):
                    current_section = section
                    break
            if current_section:
                break
        
        # If we're in a section, add text to it
        if current_section and i < len(lines) - 1:
            sections[current_section] += lines[i+1] + "\n"
    
    return sections 