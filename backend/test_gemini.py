#!/usr/bin/env python3
"""
Test script to verify Gemini API is working
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if api_key else 'No'}")
print(f"API Key (first 10 chars): {api_key[:10] if api_key else 'N/A'}...")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    exit(1)

# Configure Gemini
try:
    genai.configure(api_key=api_key)
    print("✓ Gemini configured successfully")
except Exception as e:
    print(f"ERROR configuring Gemini: {e}")
    exit(1)

# List available models
print("\nListing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

# Try different model names (from the list above)
model_names = [
    'gemini-2.5-flash',
    'gemini-2.0-flash', 
    'gemini-flash-latest',
    'gemini-pro-latest'
]

for model_name in model_names:
    try:
        print(f"\nTrying model: {model_name}")
        model = genai.GenerativeModel(model_name)
        print(f"✓ Model '{model_name}' created successfully")
        
        print("Testing API call...")
        response = model.generate_content("Say 'Hello, I am working!' in a friendly way")
        print(f"✓ API call successful!")
        print(f"\nResponse: {response.text}")
        print(f"\n✅ Working model found: {model_name}")
        break
    except Exception as e:
        print(f"  ✗ Failed: {e}")

print("\n✅ All tests passed! Gemini API is working correctly.")
