# 🎙️ Podcast Feature Setup Guide

## Overview

The Podcast Feature generates interactive student-teacher conversations about research papers using:
- **Gemini AI** for dialogue script generation
- **Bhashini API** for Indian language text-to-speech (TTS)

---

## Prerequisites

1. ✅ Backend and Frontend servers running
2. ✅ GEMINI_API_KEY configured
3. ⚠️ **Bhashini API credentials** (you have these)

---

## Step 1: Configure Bhashini API

Edit `backend/.env` and add your Bhashini credentials:

```env
# Bhashini API (for Podcast TTS)
BHASHINI_API_ENDPOINT=https://your-anuvaadhub-api-endpoint
BHASHINI_ACCESS_TOKEN=your_access_token_here
```

**Where to get these:**
- You mentioned you have Bhashini API access from AnuvaadHub
- **API Endpoint**: The endpoint URL you received from AnuvaadHub
- **Access Token**: Your access token from AnuvaadHub dashboard

---

## Step 2: Restart Backend Server

After updating `.env`:

```bash
cd c:/python/GGW_Megathon_Saral/backend
# Stop current server (Ctrl+C)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 3: Test the Feature

1. **Open Frontend**: http://localhost:3000
2. **Click** "Generate Podcast" button on homepage
3. **Choose your input method**:
   - **arXiv URL**: Enter URL (e.g., `https://arxiv.org/abs/2301.12345`)
   - **PDF File**: Upload a research paper PDF
   - **LaTeX ZIP**: Upload LaTeX source code
4. **Wait** for podcast generation:
   - Uploading/processing paper (~30-60 seconds)
   - Generating dialogue (~1 minute)
   - Creating audio with Bhashini (~2-3 minutes for 8 segments)

---

## How It Works

### Backend Flow:

1. **Paper Upload** → Accepts arXiv URL, PDF file, or LaTeX ZIP
2. **Script Generation** → Creates presentation scripts from paper content
3. **Podcast Script** → Generates student-teacher dialogue using Gemini AI
4. **Audio Generation** → Converts each dialogue segment to audio using Bhashini TTS

### Dialogue Structure:

```
Teacher: [Introduces the paper topic]
Student: [Asks curious question]
Teacher: [Explains concept clearly]
Student: [Follow-up question]
...
```

---

## API Endpoints

### Generate Podcast Script
```http
POST /api/podcast/{paper_id}/generate-script
Body: { "num_exchanges": 8 }
```

### Generate Audio
```http
POST /api/podcast/{paper_id}/generate-audio
```

### Get Podcast Status
```http
GET /api/podcast/{paper_id}/status
```

### Stream Audio
```http
GET /api/podcast/{paper_id}/audio/{filename}
```

---

## Bhashini TTS Constraints

The implementation automatically handles these constraints:

| Constraint | Limit | Implementation |
|------------|-------|----------------|
| Max words | 30 words/segment | Auto-chunks dialogue |
| Special chars | Not allowed | Auto-cleaned |
| File format | WAV | Bhashini returns WAV |
| Gender | Male/Female | Teacher=Male, Student=Female |

---

## Customization

### Change Number of Exchanges

In `PodcastGeneration.jsx`, line 53:
```javascript
num_exchanges: 8  // Change to desired number (5-12 recommended)
```

### Change Speaker Genders

In `backend/app/services/podcast_generator.py`, update:
```python
dialogue.append({
    "speaker": "teacher",
    "text": text,
    "gender": "male"  # Change to "female" if needed
})
```

### Adjust Dialogue Style

Modify the prompt in `podcast_generator.py` line 40-70 to change:
- Conversation style
- Question types
- Explanation depth
- Language complexity

---

## Troubleshooting

### "Bhashini API not configured"
**Solution**: Add `BHASHINI_API_ENDPOINT` and `BHASHINI_ACCESS_TOKEN` to `.env`

### "TTS failed for segment X"
**Causes**:
- Special characters in text (auto-cleaned, but check logs)
- Bhashini API quota exceeded
- Network timeout

**Solution**: Check backend logs for specific error

### Audio not playing
**Solution**: Ensure backend is running on port 8000 and audio files are downloaded

### "Podcast script not found"
**Solution**: Generate scripts first, then podcast script

---

## Example Usage

```bash
# 1. Start Backend
cd c:/python/GGW_Megathon_Saral/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start Frontend
cd c:/python/GGW_Megathon_Saral/frontend
npm start

# 3. Open browser and generate podcast
# Visit: http://localhost:3000
# Click: "Generate Podcast" button

# Option A: arXiv URL
# - Select "arXiv URL" tab
# - Enter: https://arxiv.org/abs/2401.12345

# Option B: PDF File
# - Select "PDF File" tab
# - Upload your research paper PDF

# Option C: LaTeX ZIP
# - Select "LaTeX ZIP" tab
# - Upload your LaTeX source ZIP

# Wait: ~3-5 minutes for complete podcast generation
```

---

## File Structure

```
backend/
├── app/
│   ├── routes/
│   │   └── podcast.py          # Podcast API routes
│   └── services/
│       ├── bhashini_service.py # Bhashini API integration
│       └── podcast_generator.py # Dialogue generation
└── temp/
    └── podcasts/
        └── {paper_id}/
            ├── script.json      # Dialogue script
            ├── 000_teacher.wav  # Audio files
            └── 001_student.wav

frontend/
├── src/
│   └── pages/
│       └── PodcastGeneration.jsx # Podcast UI
```

---

## Advanced Features

### Multi-language Support

To add Hindi dialogue:

1. Update `podcast_generator.py` to generate Hindi text
2. Configure Bhashini language parameter
3. Update TTS call with language code

### Download Complete Podcast

The UI has a "Download All" button that downloads all audio segments.

### Auto-play Feature

Podcast player auto-plays segments sequentially.

---

## API Testing

Use the interactive API docs:

```
http://localhost:8000/docs
```

Navigate to **"Podcast"** section to test endpoints.

---

## Input Methods

The podcast feature supports **three ways** to submit papers:

### 1. arXiv URL
- **Format**: `https://arxiv.org/abs/XXXX.XXXXX`
- **Pros**: Quick, automatic metadata extraction
- **Use when**: Paper is published on arXiv

### 2. PDF File
- **Format**: `.pdf` file
- **Pros**: Works with any research paper PDF
- **Use when**: You have a published PDF but not on arXiv

### 3. LaTeX Source (ZIP)
- **Format**: `.zip` file containing LaTeX source
- **Pros**: Best text extraction, preserves formatting
- **Use when**: You have the LaTeX source code

**Note**: All three methods use the same podcast generation pipeline after upload.

---

## Performance Notes

- **Dialogue Generation**: ~30-60 seconds (Gemini API)
- **TTS per segment**: ~10-15 seconds (Bhashini)
- **Total for 8 segments**: ~2-3 minutes
- **Concurrent requests**: Limited by Bhashini API rate limits

---

## Next Steps

1. ✅ Configure Bhashini API credentials
2. ✅ Restart backend server
3. ✅ Test with sample arXiv paper
4. ✅ Customize dialogue style if needed
5. ✅ Share podcasts with users!

---

## Support

**Issues?**
- Check backend logs: Look for errors in terminal
- Verify API keys: Test Bhashini endpoint with curl
- Check constraints: Ensure dialogue segments meet TTS limits

**Want to improve?**
- Add more personas (3+ speakers)
- Support more languages
- Add background music
- Merge audio files into single MP3

---

## Summary

You now have a complete podcast feature that:
- ✅ Accepts **arXiv URLs, PDF files, and LaTeX source**
- ✅ Generates intelligent student-teacher dialogues using Gemini AI
- ✅ Converts text to natural speech using Bhashini TTS
- ✅ Provides interactive playback UI with auto-play
- ✅ Downloads individual or all audio files
- ✅ Supports multiple languages (extensible)

Just add your Bhashini API credentials and you're ready to go! 🎉
