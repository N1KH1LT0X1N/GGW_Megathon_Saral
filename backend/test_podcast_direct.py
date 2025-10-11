#!/usr/bin/env python3
"""
Direct test of podcast generator
"""
import sys
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

# Import the podcast generator
from app.services.podcast_generator import podcast_generator

# Test data
metadata = {
    "title": "Test Research Paper on Machine Learning",
    "authors": "Test Author"
}

paper_content = """
This paper introduces a novel approach to machine learning.
The methodology involves training neural networks with new techniques.
Results show significant improvements over baseline methods.
The discussion highlights key findings and future directions.
"""

print("Testing Podcast Generator...")
print(f"Model initialized: {podcast_generator.model is not None}")

try:
    print("\nGenerating podcast script...")
    dialogue = podcast_generator.generate_podcast_script(
        paper_content=paper_content,
        metadata=metadata,
        num_exchanges=3
    )
    
    print(f"\n✅ Success! Generated {len(dialogue)} dialogue segments:")
    for i, segment in enumerate(dialogue):
        print(f"\n{i+1}. {segment['speaker'].upper()}: {segment['text'][:100]}...")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
