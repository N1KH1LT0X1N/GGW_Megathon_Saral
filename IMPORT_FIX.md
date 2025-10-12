# Import Error Fix

## Issue
```
ImportError: cannot import name 'SarvamTTSClient' from 'app.services.sarvam_sdk'
```

## Cause
Wrong class name used in import. The actual class in `sarvam_sdk.py` is `SarvamTTS`, not `SarvamTTSClient`.

## Fix Applied
Changed import in `visual_storytelling.py`:

**Before:**
```python
from app.services.sarvam_sdk import SarvamTTSClient
tts_client = SarvamTTSClient(api_key=api_keys["sarvam_key"])
```

**After:**
```python
from app.services.sarvam_sdk import SarvamTTS
tts_client = SarvamTTS(api_key=api_keys["sarvam_key"])
```

## Status
✅ Fixed - The correct class name is now being imported.

**No server restart needed** - Python will pick up the change automatically on the next request.
