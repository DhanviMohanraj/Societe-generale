# AI-powered Policy Conflict & Staleness Detector - Backend Skeleton (Module 1)

This project implements the backend skeleton and local LLM integration for the AI-powered Policy Conflict & Staleness Detector.

## Tech Stack
- Python 3.12+
- FastAPI
- Ollama (`qwen2.5:7b`)
- PyMuPDF (for PDF validation)

## Setup & Running Instructions

### 1. Install & Start Ollama
Ensure you have Ollama installed locally. Pull the required model:
```bash
ollama pull qwen2.5:7b
```
Ensure the Ollama daemon is running (by default at `http://localhost:11434`).

### 2. Create Virtual Environment & Install Dependencies
Create a virtual environment and install packages:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 3. Run FastAPI Application
Start the uvicorn development server from the `backend` directory:
```bash
uvicorn app.main:app --reload
```

## Endpoints

- **GET /**: Health check endpoint. Returns `{"status": "running", "model": "qwen2.5:7b"}`.
- **POST /upload**: Accepts PDF file upload. Validates that file is a non-empty PDF, is under 10MB, and saves it in the `uploads/` directory. Returns `{"message": "Upload Successful", "filename": "..."}`.
- **POST /test-llm**: Test endpoint. Body `{"text": "..."}`. Appends the `EXTRACT_OBLIGATION_PROMPT`, calls Qwen2.5:7b via local Ollama, and returns response `{"response": "..."}`.
