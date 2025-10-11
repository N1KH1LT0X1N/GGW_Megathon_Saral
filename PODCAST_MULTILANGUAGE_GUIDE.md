# 🎙️ Multi-Language Podcast Feature Guide

## Overview

The podcast feature now supports **7 languages** with:
- 🌍 Language-specific dialogue generation
- 🗣️ Language-specific TTS (Text-to-Speech)
- 🎵 Interactive web-based audio player
- ⏯️ Play/Pause/Skip controls

---

## 🌐 Supported Languages

| Language | Code | Flag |
|----------|------|------|
| English | `en` | 🇬🇧 |
| Hindi | `hi` | 🇮🇳 |
| Tamil | `ta` | 🇮🇳 |
| Telugu | `te` | 🇮🇳 |
| Bengali | `bn` | 🇮🇳 |
| Marathi | `mr` | 🇮🇳 |
| Gujarati | `gu` | 🇮🇳 |

---

## 🔧 Setup

### 1. Configure Language + Operation Type API Keys

Edit `backend/.env` and add your Bhashini API credentials for each **language + operation type** combination:

```env
# English - All Operations
BHASHINI_API_KEY_EN_TTS=your_english_tts_key
BHASHINI_API_ENDPOINT_EN_TTS=https://your-english-tts-endpoint

BHASHINI_API_KEY_EN_OCR=your_english_ocr_key
BHASHINI_API_ENDPOINT_EN_OCR=https://your-english-ocr-endpoint

BHASHINI_API_KEY_EN_MT=your_english_mt_key
BHASHINI_API_ENDPOINT_EN_MT=https://your-english-mt-endpoint

BHASHINI_API_KEY_EN_ASR=your_english_asr_key
BHASHINI_API_ENDPOINT_EN_ASR=https://your-english-asr-endpoint

# Hindi - All Operations
BHASHINI_API_KEY_HI_TTS=your_hindi_tts_key
BHASHINI_API_ENDPOINT_HI_TTS=https://your-hindi-tts-endpoint

BHASHINI_API_KEY_HI_OCR=your_hindi_ocr_key
BHASHINI_API_ENDPOINT_HI_OCR=https://your-hindi-ocr-endpoint

# ... and so on for all languages
```

**Operation Types:**
- **TTS**: Text-to-Speech (used for podcast audio)
- **OCR**: Optical Character Recognition
- **MT**: Machine Translation
- **ASR**: Audio Speech Recognition

**Note:** You only need to add keys for the operations you plan to use. For podcasts, you only need TTS keys.

---

## 🎯 How It Works

### Frontend Flow:

1. **User selects language** from visual language selector
2. **User uploads paper** (arXiv, PDF, or LaTeX)
3. **System generates dialogue** in selected language using Gemini AI
4. **Bhashini TTS** converts dialogue to audio in that language
5. **Web player** allows playing audio directly in browser

### Backend Flow:

```
User Request (language: "hi")
        ↓
Load Hindi API credentials
        ↓
Generate Hindi dialogue (Gemini)
        ↓
Convert to Hindi audio (Bhashini TTS)
        ↓
Return audio URLs to frontend
```

---

## 🎨 UI Features

### Language Selector

Beautiful flag-based language selector:
```
🇬🇧 English    🇮🇳 Hindi    🇮🇳 Tamil    🇮🇳 Telugu
🇮🇳 Bengali   🇮🇳 Marathi  🇮🇳 Gujarati
```

### Audio Player

**Main Player:**
- 🎵 Now Playing display
- ⏮️ Previous segment
- ⏸️ Pause
- ⏭️ Next segment
- Shows current segment number

**Episode List:**
- All segments listed
- Click any segment to play
- Visual indicator for playing segment
- Speaker labels (Teacher/Student)
- Full text display

---

## 💻 Usage Example

### 1. Start Servers

```bash
# Backend
cd c:/python/GGW_Megathon_Saral/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd c:/python/GGW_Megathon_Saral/frontend
npm start
```

### 2. Generate Podcast

1. Go to: http://localhost:3000/podcast
2. **Select language**: Click on Hindi flag 🇮🇳
3. **Upload paper**: Choose arXiv URL, PDF, or LaTeX
4. **Generate**: Click "Generate Podcast"
5. **Wait**: ~3-5 minutes for complete generation

### 3. Play Audio

Once generated:
- Click ▶️ on any segment to play
- Use ⏮️ ⏸️ ⏭️ controls in main player
- Audio auto-plays next segment when finished
- Download individual files or all at once

---

## 🔍 API Reference

### Generate Script with Language

```http
POST /api/podcast/{paper_id}/generate-script
Content-Type: application/json

{
  "num_exchanges": 8,
  "language": "hi"
}
```

**Response:**
```json
{
  "paper_id": "abc123",
  "dialogue": [
    {
      "speaker": "teacher",
      "text": "नमस्ते! आज हम एक शोध पत्र पर चर्चा करेंगे...",
      "gender": "male"
    },
    {
      "speaker": "student",
      "text": "यह दिलचस्प लगता है! यह पेपर किस बारे में है?",
      "gender": "female"
    }
  ],
  "language": "hi",
  "status": "success"
}
```

### Generate Audio

```http
POST /api/podcast/{paper_id}/generate-audio
```

Uses the language from the stored script data automatically.

---

## 🎛️ Customization

### Change Dialogue Length

In `PodcastGeneration.jsx`, line 34:
```javascript
num_exchanges: 8  // Change to 5-15
```

### Add New Language

1. **Backend** - Add to `bhashini_service.py`:
```python
self.api_keys = {
    "en": os.getenv("BHASHINI_API_KEY_EN"),
    "hi": os.getenv("BHASHINI_API_KEY_HI"),
    "kn": os.getenv("BHASHINI_API_KEY_KN"),  # Kannada
}
```

2. **Frontend** - Add to `PodcastGeneration.jsx`:
```javascript
const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },  // New!
];
```

3. **Podcast Generator** - Update in `podcast_generator.py`:
```python
language_names = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada"  # New!
}
```

---

## 🐛 Troubleshooting

### Language-Specific Audio Not Working

**Check:**
1. API keys are set for that language in `.env`
2. Restart backend after adding keys
3. Check backend logs for specific errors

**Solution:**
```bash
# View logs
INFO:app.services.bhashini_service:Bhashini configured for languages: en, hi, ta
```

Should show your configured languages.

### Dialogue Not in Selected Language

**Issue:** Gemini generates English even when Hindi is selected

**Solution:** The prompt includes language instructions, but Gemini might default to English. To force it:
- Ensure language parameter is passed correctly
- Check backend logs for language value
- Consider using a language-specific Gemini model

### Audio Player Not Working

**Check:**
1. Backend running on port 8000
2. Audio files downloaded successfully
3. Browser console for errors
4. CORS settings allow audio streaming

---

## 📊 Performance

| Step | Time | Language Impact |
|------|------|-----------------|
| Script Generation | 30-60s | No change |
| TTS per Segment | 10-15s | May vary by language |
| Total (8 segments) | 2-3 min | Same for all |

---

## 🔒 Security Notes

- API keys stored in `.env` (never commit!)
- Audio files stored temporarily
- Automatic cleanup after 24 hours (configure in backend)
- CORS restricted to allowed origins

---

## 🚀 Advanced Features

### Batch Language Generation

Generate podcasts in multiple languages:

```python
languages = ["en", "hi", "ta"]
for lang in languages:
    generate_podcast(paper_id, language=lang)
```

### Custom Voices

Modify `gender` parameter in dialogue:
```json
{
  "speaker": "teacher",
  "text": "...",
  "gender": "male"  // or "female"
}
```

### Audio Merging

Merge all segments into single file (not implemented):
```bash
ffmpeg -i "concat:001_teacher.wav|002_student.wav" -c copy full_podcast.wav
```

---

## 📝 Example `.env` Configuration

```env
# Gemini for script generation
GEMINI_API_KEY=your_gemini_key

# English - TTS for Podcast
BHASHINI_API_KEY_EN_TTS=en_tts_key_abc123
BHASHINI_API_ENDPOINT_EN_TTS=https://api.bhashini.ai/tts/en

# Hindi - TTS for Podcast
BHASHINI_API_KEY_HI_TTS=hi_tts_key_def456
BHASHINI_API_ENDPOINT_HI_TTS=https://api.bhashini.ai/tts/hi

# Tamil - TTS for Podcast
BHASHINI_API_KEY_TA_TTS=ta_tts_key_ghi789
BHASHINI_API_ENDPOINT_TA_TTS=https://api.bhashini.ai/tts/ta

# Optional: Other operations
BHASHINI_API_KEY_EN_OCR=en_ocr_key
BHASHINI_API_ENDPOINT_EN_OCR=https://api.bhashini.ai/ocr/en

BHASHINI_API_KEY_HI_MT=hi_mt_key
BHASHINI_API_ENDPOINT_HI_MT=https://api.bhashini.ai/mt/hi
```

**Key Format:** `BHASHINI_API_KEY_{LANGUAGE}_{OPERATION}`  
**Endpoint Format:** `BHASHINI_API_ENDPOINT_{LANGUAGE}_{OPERATION}`  

where:
- `{LANGUAGE}` = EN, HI, TA, TE, BN, MR, GU (uppercase)
- `{OPERATION}` = TTS, OCR, MT, ASR (uppercase)

---

## ✅ Summary

**Features Implemented:**
- ✅ 7 language support
- ✅ Language-specific API keys
- ✅ Visual language selector
- ✅ Web-based audio player
- ✅ Play/Pause/Skip controls
- ✅ Auto-play next segment
- ✅ Now Playing display
- ✅ Download all audio
- ✅ Responsive design
- ✅ Dark mode support

**Next Steps:**
1. Configure your Bhashini API keys for desired languages
2. Restart backend server
3. Test with different languages
4. Share multilingual podcasts with users!

🎉 Enjoy creating podcasts in multiple languages!
