# Saral Backend

This backend is a FastAPI service that converts academic papers into presentations and videos. This update modernizes dependencies and simplifies setup.

## Prerequisites
- Python 3.11 (see `.python-version`)
- Windows packages:
  - Poppler (for pdf2image). Install from: https://github.com/oschwartz10612/poppler-windows/releases/
    - Add the `bin` folder to PATH, or set `POPPLER_PATH` in `.env`
  - LaTeX (for slide compilation), e.g., MiKTeX or TeX Live, and ensure `pdflatex` is on PATH
  - FFmpeg (for video/audio). Download: https://ffmpeg.org/download.html and add to PATH

## Setup
1. Create a virtual environment and install dependencies
```
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

2. Configure environment variables
- Copy `.env.example` to `.env` and fill values:
  - GOOGLE_CLIENT_ID
  - JWT_SECRET
  - GEMINI_API_KEY
  - SARVAM_API_KEY
  - OPENAI_API_KEY (optional)
  - POPPLER_PATH (optional for Windows if not in PATH)

3. Run the API
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open http://localhost:8000/docs for the Swagger UI.

## Notes
- This codebase uses Pydantic v2. Use `model_dump()` instead of `dict()` on models.
- Local storage is under `temp/`. Delete it if you want a clean slate.
- For slide generation, ensure pdflatex and poppler are installed; otherwise, slide/image endpoints will fail gracefully.
