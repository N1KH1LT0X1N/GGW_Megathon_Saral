# 🔑 Bhashini API Key Structure

## Overview

The Bhashini service now supports **separate API keys** for each combination of:
- **Language** (7 languages)
- **Operation Type** (4 types)

This gives you **28 possible combinations** (7 languages × 4 operations).

---

## 📋 Structure

### Environment Variable Format:

```
BHASHINI_API_KEY_{LANGUAGE}_{OPERATION}
BHASHINI_API_ENDPOINT_{LANGUAGE}_{OPERATION}
```

### Components:

1. **LANGUAGE** (uppercase):
   - `EN` - English
   - `HI` - Hindi
   - `TA` - Tamil
   - `TE` - Telugu
   - `BN` - Bengali
   - `MR` - Marathi
   - `GU` - Gujarati

2. **OPERATION** (uppercase):
   - `TTS` - Text-to-Speech
   - `OCR` - Optical Character Recognition
   - `MT` - Machine Translation
   - `ASR` - Audio Speech Recognition

---

## 📝 Example Configuration

### For Podcast (TTS only):

```env
# English TTS
BHASHINI_API_KEY_EN_TTS=your_english_tts_api_key
BHASHINI_API_ENDPOINT_EN_TTS=https://your-endpoint.com/en/tts

# Hindi TTS
BHASHINI_API_KEY_HI_TTS=your_hindi_tts_api_key
BHASHINI_API_ENDPOINT_HI_TTS=https://your-endpoint.com/hi/tts

# Tamil TTS
BHASHINI_API_KEY_TA_TTS=your_tamil_tts_api_key
BHASHINI_API_ENDPOINT_TA_TTS=https://your-endpoint.com/ta/tts
```

### For All Operations (Full Setup):

```env
# English - All 4 Operations
BHASHINI_API_KEY_EN_TTS=en_tts_key
BHASHINI_API_ENDPOINT_EN_TTS=https://endpoint/en/tts

BHASHINI_API_KEY_EN_OCR=en_ocr_key
BHASHINI_API_ENDPOINT_EN_OCR=https://endpoint/en/ocr

BHASHINI_API_KEY_EN_MT=en_mt_key
BHASHINI_API_ENDPOINT_EN_MT=https://endpoint/en/mt

BHASHINI_API_KEY_EN_ASR=en_asr_key
BHASHINI_API_ENDPOINT_EN_ASR=https://endpoint/en/asr

# Hindi - All 4 Operations
BHASHINI_API_KEY_HI_TTS=hi_tts_key
BHASHINI_API_ENDPOINT_HI_TTS=https://endpoint/hi/tts

BHASHINI_API_KEY_HI_OCR=hi_ocr_key
BHASHINI_API_ENDPOINT_HI_OCR=https://endpoint/hi/ocr

BHASHINI_API_KEY_HI_MT=hi_mt_key
BHASHINI_API_ENDPOINT_HI_MT=https://endpoint/hi/mt

BHASHINI_API_KEY_HI_ASR=hi_asr_key
BHASHINI_API_ENDPOINT_HI_ASR=https://endpoint/hi/asr

# ... Continue for all 7 languages
```

---

## 🎯 What You Need for Podcasts

**Minimum Required:**
- Only TTS keys for languages you want to use
- Example: If you want English and Hindi podcasts, you need:
  - `BHASHINI_API_KEY_EN_TTS`
  - `BHASHINI_API_ENDPOINT_EN_TTS`
  - `BHASHINI_API_KEY_HI_TTS`
  - `BHASHINI_API_ENDPOINT_HI_TTS`

**Optional:**
- OCR keys (for future image text extraction)
- MT keys (for future translation features)
- ASR keys (for future speech recognition)

---

## 🔧 How It Works in Code

### 1. Service Initialization:
```python
# Loads all available combinations from .env
bhashini_service = BhashiniService()
# Output: "Bhashini configured for: EN_TTS, EN_OCR, HI_TTS... (12 total)"
```

### 2. Using TTS:
```python
# Request for Hindi TTS
audio_url = bhashini_service.text_to_speech(
    text="नमस्ते",
    gender="female",
    language="hi"  # Uses BHASHINI_API_KEY_HI_TTS
)
```

### 3. Using OCR:
```python
# Request for Tamil OCR
text = bhashini_service.extract_text_from_image(
    image_file_path="tamil_image.jpg",
    language="ta"  # Uses BHASHINI_API_KEY_TA_OCR
)
```

### 4. Using ASR:
```python
# Request for Telugu ASR
text = bhashini_service.recognize_speech(
    audio_file_path="telugu_audio.wav",
    language="te"  # Uses BHASHINI_API_KEY_TE_ASR
)
```

### 5. Using MT:
```python
# Request for Bengali MT
translated = bhashini_service.translate_text(
    text="Hello world",
    source_language="en",
    target_language="bn"  # Uses BHASHINI_API_KEY_BN_MT
)
```

---

## ✅ Validation

### Backend Startup Log:
After configuring keys, when you start the backend, you'll see:

```
INFO:app.services.bhashini_service:Bhashini configured for: EN_TTS, EN_OCR, HI_TTS, HI_MT, TA_TTS... (12 total)
```

This shows which combinations are available.

---

## ❌ What Changed (No More "Default" Keys)

### Old Structure (Removed):
```env
BHASHINI_API_ENDPOINT=default_endpoint
BHASHINI_ACCESS_TOKEN=default_token
BHASHINI_API_KEY_EN=english_key  # Single key per language
```

### New Structure (Current):
```env
BHASHINI_API_KEY_EN_TTS=english_tts_key  # Specific key per language + operation
BHASHINI_API_ENDPOINT_EN_TTS=endpoint
```

**Why?** Because you have different API keys for each operation type within each language.

---

## 📊 Full Matrix

If you configure ALL combinations:

| Language | TTS | OCR | MT | ASR | Total |
|----------|-----|-----|----|----|-------|
| English (EN) | ✅ | ✅ | ✅ | ✅ | 4 |
| Hindi (HI) | ✅ | ✅ | ✅ | ✅ | 4 |
| Tamil (TA) | ✅ | ✅ | ✅ | ✅ | 4 |
| Telugu (TE) | ✅ | ✅ | ✅ | ✅ | 4 |
| Bengali (BN) | ✅ | ✅ | ✅ | ✅ | 4 |
| Marathi (MR) | ✅ | ✅ | ✅ | ✅ | 4 |
| Gujarati (GU) | ✅ | ✅ | ✅ | ✅ | 4 |
| **Total** | | | | | **28** |

---

## 🚀 Quick Start

### Step 1: Copy your .env.example
```bash
cd backend
cp .env.example .env
```

### Step 2: Fill in TTS keys for podcast
```env
# Only add the languages you need
BHASHINI_API_KEY_EN_TTS=your_key_here
BHASHINI_API_ENDPOINT_EN_TTS=your_endpoint_here

BHASHINI_API_KEY_HI_TTS=your_key_here
BHASHINI_API_ENDPOINT_HI_TTS=your_endpoint_here
```

### Step 3: Restart backend
```bash
# Ctrl+C to stop
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Check logs
Look for: `Bhashini configured for: EN_TTS, HI_TTS (2 total)`

---

## 💡 Tips

1. **Start small**: Configure only TTS for one language first
2. **Test incrementally**: Add one language at a time
3. **Check logs**: Backend shows which keys loaded successfully
4. **Ignore unused**: Don't need to configure operations you won't use
5. **Case sensitive**: Use UPPERCASE for language and operation codes

---

## 🐛 Troubleshooting

### Issue: "No credentials found for HI_TTS"

**Solution:**
```env
# Check these are in your .env:
BHASHINI_API_KEY_HI_TTS=...
BHASHINI_API_ENDPOINT_HI_TTS=...
```

### Issue: Backend logs show 0 total configured

**Solution:**
- Check .env file exists in backend directory
- Verify no typos in variable names
- Ensure LANGUAGE and OPERATION are UPPERCASE
- Restart backend after editing .env

### Issue: Podcast works in English but not Hindi

**Solution:**
- Check HI_TTS keys are configured
- Verify endpoint URL is correct
- Test API key with curl manually
- Check backend logs for specific error

---

## 📚 Summary

**New System:**
- ✅ Granular control per language + operation
- ✅ Matches your AnuvaadHub credential structure
- ✅ No more "default" fallback
- ✅ Clear error messages for missing keys
- ✅ Supports all 4 Bhashini operations

**For Podcasts:**
- Only need TTS keys
- Configure languages you want
- System handles the rest automatically

---

**Ready to configure your API keys!** 🎉
