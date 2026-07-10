import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.upload import router as upload_router

# Initialize the FastAPI application
app = FastAPI(
    title="AI-powered Policy Conflict & Staleness Detector",
    description="FastAPI Backend for detecting policy conflicts and staleness (Module 1).",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development. Can be restricted to React host in prod.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Register routers
app.include_router(health_router)
app.include_router(upload_router)

# Startup event to ensure uploads directory exists
@app.on_event("startup")
def startup_event():
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)
