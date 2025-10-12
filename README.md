# 🎓 SARAL AI - Research Democratization Platform

**Simplified And Automated Research Amplification and Learning**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)

Transform research papers into educational videos, podcasts, mind maps, and visual stories using AI.

**Quick Links:** [Live Demo](https://coming-soon) | [Chrome Extension](#-chrome-extension) | [Contact](mailto:democratise.research@gmail.com) | [WhatsApp Bot](https://wa.me/14155238886?text=join%20fallen-basket)

---

## 📋 Table of Contents

- [Overview](#-overview) | [Features](#-key-features) | [Installation](#️-installation) | [Configuration](#-configuration) | [Running](#️-running) | [Chrome Extension](#-chrome-extension) | [Troubleshooting](#-troubleshooting) | [API Docs](#-api-documentation) | [Contributing](#-contributing) | [License](#-license)

---

## ✨ Overview

```
Research Paper → AI Processing → 📹 Video | 🎙️ Podcast | 🗺️ Mindmap | 📖 Story
🔌 Chrome Extension: Process papers from any website!
```

**Key Capabilities:**
- 🎥 Educational videos with AI narration
- 🎙️ Natural podcast conversations
- 🗺️ Visual mind maps
- 📖 Cinematic storytelling videos
- 🔌 Chrome extension for instant processing
- 💬 WhatsApp bot support
- 🌐 Multi-language (English/Hindi/Gujarati)

---

## 🚀 Key Features

| Feature | Description |
|---------|-------------|
| **Video Generation** | AI scripts, professional slides, multi-language narration |
| **Podcast Creation** | Two-voice dialogues, natural conversations |
| **Mind Mapping** | Hierarchical concept visualization, SVG export |
| **Visual Stories** | Scene-by-scene narratives with text overlays |
| **Chrome Extension** | One-click processing from arXiv, Google Scholar |
| **WhatsApp Bot** | 24/7 research assistance via chat |
| **Batch Processing** | Handle multiple papers efficiently |

---

## 🎯 Use Cases

**Students:** Exam prep, quick paper understanding, visual learning  
**Educators:** Lecture content, teaching materials, multi-format resources  
**Researchers:** Conference presentations, accessible findings, outreach  
**Institutions:** Content libraries, online courses, research accessibility  
**Chrome Extension:** Process papers instantly from any research website

📄 **Tutorial:** [Download PDF](tutorial.pdf) for complete setup and usage guide

---

## 📦 System Requirements

**Backend:** Python 3.9+, LaTeX (pdflatex/MiKTeX), Poppler, FFmpeg, 4GB+ RAM  
**Frontend:** Node.js 16+, npm 8+, Modern browser  
**API Keys:** Google Gemini (required, free 200 req/day), Sarvam AI (optional, Hindi TTS), Hugging Face (optional, free AI images)

---

## 🏗️ Project Structure

```
GGW_Megathon_Saral/
├── chrome-extension/    # Browser extension (manifest.json, popup, content scripts)
├── backend/            # FastAPI server (routes, services, models)
│   ├── app/           # Main application (routes/, services/, models/)
│   └── temp/          # Generated files (papers, videos, podcasts, mindmaps)
└── frontend/          # React app (pages, components, contexts)
```

---

## ⚙️ Installation

### Prerequisites
**Windows:** [Python](https://python.org), [Node.js](https://nodejs.org), [MiKTeX](https://miktex.org), [Poppler](https://github.com/oschwartz10612/poppler-windows/releases/), [FFmpeg](https://ffmpeg.org)  
**macOS:** `brew install python@3.9 node poppler ffmpeg && brew install --cask mactex`  
**Linux:** `sudo apt install python3.9 nodejs npm poppler-utils ffmpeg texlive-full`

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/GGW_Megathon_Saral.git
cd GGW_Megathon_Saral

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

---

## 🔧 Configuration

Create `.env` in `backend/` directory:

```bash
GEMINI_API_KEY_1=AIzaSy...    # Get from https://aistudio.google.com/apikey
GEMINI_API_KEY_2=AIzaSy...    # Optional: for quota rotation
SARVAM_API_KEY=your_key       # Get from https://www.sarvam.ai/
HUGGINGFACE_API_KEY=hf_...    # Optional: https://huggingface.co/settings/tokens
```

**API Key Rotation:** Add multiple Gemini keys (`GEMINI_API_KEY_1`, `_2`, etc.) for automatic rotation when quota limits hit.  
**Web UI Setup:** Configure keys through the API Setup page after launching the app.

---

## ▶️ Running

**Backend (Terminal 1):**
```bash
cd backend && source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
→ Backend: [http://localhost:8000](http://localhost:8000) | API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

**Frontend (Terminal 2):**
```bash
cd frontend && npm start
```
→ Frontend: [http://localhost:3000](http://localhost:3000)

---

## 📚 Features Workflow

**Video Generation:** Upload paper → Generate script → Edit content → Assign images → Generate video (English/Hindi, adjustable complexity)  
**Podcast Creation:** Upload paper → Generate dialogue → Customize voices → Create MP3 (natural two-voice conversation)  
**Mind Mapping:** Upload paper → AI extracts concepts → Download SVG (hierarchical structure, relationships)  
**Visual Story:** Upload paper → Generate scenes → Create video with text overlays → Watch/download

---

## 🔌 Chrome Extension

### Installation
**Chrome Store:** Coming soon  
**Manual:** `chrome://extensions/` → Enable Developer mode → Load unpacked → Select `chrome-extension` folder

### Usage
1. **Right-click** any paper on arXiv/Google Scholar → "Generate Video/Podcast with SARAL"
2. **Extension popup** → Detects paper → One-click generation
3. **Highlight URL** → Right-click → "Process with SARAL"

### Features
Auto-detects papers on arXiv, Google Scholar, PubMed, ResearchGate, IEEE, Springer, ScienceDirect | One-click generation | Batch processing | Real-time notifications | Keyboard shortcut: `Ctrl+Shift+S`

### Settings
Configure backend URL (`http://localhost:8000`), complexity level, language, theme via extension popup

---

## 🔍 Troubleshooting

**Common Issues:**
- ImportError → `pip install -r requirements.txt` in venv
- PDF/LaTeX errors → Install poppler, MiKTeX/texlive, add to PATH
- FFmpeg not found → Install and add to PATH
- API key invalid → Check `.env` format (no quotes: `KEY=value`)
- Gemini quota → Add multiple keys: `GEMINI_API_KEY_1`, `_2`, etc.
- Port in use → Kill process or change port
- npm install fails → Delete `node_modules`, reinstall
- No audio in video → Verify Sarvam API key
- Extension issues → Reload from `chrome://extensions/`

**Get Help:** [GitHub Issues](https://github.com/yourusername/GGW_Megathon_Saral/issues) | [Email](mailto:democratise.research@gmail.com) | [WhatsApp Bot](https://wa.me/14155238886?text=join%20fallen-basket)

---

## 🛠️ Development

**Tech Stack:**  
Frontend: React 18.x, Tailwind CSS, Framer Motion, React Router, Axios  
Backend: FastAPI, Google Gemini API, Sarvam AI, MoviePy, FFmpeg, PyMuPDF, PIL

**Testing:** `npm test` (frontend), `pytest` (backend)  
**Customization:** Edit `tailwind.config.js` for themes, TTS service for voices, `slide_generator.py` for video templates

---

## 📡 API Documentation

**Base URL:** `http://localhost:8000/api`

**Key Endpoints:** `/papers/upload`, `/papers/arxiv`, `/scripts/generate`, `/slides/generate`, `/media/generate-audio`, `/media/generate-video`, `/podcast/generate`, `/mindmap/generate`, `/visual-storytelling/generate-storytelling-script`, `/visual-storytelling/generate-storytelling-video`

**Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) - Complete reference, testing, schemas

---

## 🤝 Contributing

**Report Bugs:** Open issue with description, steps to reproduce, error logs  
**Suggest Features:** Open issue with use case and benefits  
**Submit PRs:** Fork → Create branch → Commit → Push → Open PR  
**Code Style:** Python (PEP 8), JavaScript (ESLint), Conventional commits

---

## 📄 License

MIT License © 2025 SARAL AI Team - See [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgements

**AI & APIs:** [Google Gemini](https://ai.google.dev/), [Sarvam AI](https://sarvam.ai/), [Hugging Face](https://huggingface.co/)  
**Frameworks:** [FastAPI](https://fastapi.tiangolo.com/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [MoviePy](https://zulko.github.io/moviepy/), [FFmpeg](https://ffmpeg.org/)  
**Tools:** [arXiv](https://arxiv.org/), [LaTeX](https://www.latex-project.org/), [Poppler](https://poppler.freedesktop.org/)

---

## 📞 Contact

**Email:** democratise.research@gmail.com  
**WhatsApp Bot:** [Enable Bot](https://wa.me/14155238886?text=join%20fallen-basket)  
**GitHub Issues:** [Report Bugs](https://github.com/yourusername/GGW_Megathon_Saral/issues)

---

<div align="center">

⭐ **Star this repository if you found it helpful!**

Made with ❤️ by the SARAL AI Team | **Making Research Accessible to Everyone**

</div>
