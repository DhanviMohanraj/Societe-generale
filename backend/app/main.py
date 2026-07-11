import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.upload import router as upload_router
from app.api.obligations import router as obligations_router
from app.api.normalize import router as normalize_router
from app.api.vectorize import router as vectorize_router
from app.api.repository import router as repository_router
from app.api.similarity import router as similarity_router
from app.api.analysis import router as analysis_router
from app.api.graph import router as graph_router
from app.api.governance import router as governance_router
from app.services.embedding_service import EmbeddingService

# Initialize the FastAPI application
app = FastAPI(
    title="AI-powered Policy Conflict & Staleness Detector",
    description="FastAPI Backend for detecting policy conflicts and staleness (Modules 1-4).",
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
app.include_router(obligations_router)
app.include_router(normalize_router)
app.include_router(vectorize_router)
app.include_router(repository_router)
app.include_router(similarity_router)
app.include_router(analysis_router)
app.include_router(graph_router)
app.include_router(governance_router)

# Startup event to ensure uploads directory exists and preload the model
@app.on_event("startup")
def startup_event():
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)
    # Pre-load embedding model Singleton
    try:
        EmbeddingService.get_model()
    except Exception as e:
        print(f"Startup Warning: Could not preload embedding model: {e}")
        
    # Rebuild the registry to ensure it is in sync with the files on disk
    try:
        from app.services.registry_service import RegistryService
        RegistryService.rebuild_registry()
    except Exception as e:
        print(f"Startup Warning: Could not rebuild repository registry: {e}")

