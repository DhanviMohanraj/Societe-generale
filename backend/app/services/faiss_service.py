import os
import logging
import faiss
import numpy as np
from typing import Tuple

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX_DIR = os.path.join(BASE_DIR, "outputs", "index")
INDEX_PATH = os.path.join(INDEX_DIR, "policy_index.faiss")

os.makedirs(INDEX_DIR, exist_ok=True)

class FAISSService:
    """
    Low-level wrapper service for FAISS operations.
    Handles indexing, persistence, and nearest-neighbor search.
    Does not contain business logic.
    """

    @classmethod
    def build_index(cls, embeddings: np.ndarray) -> faiss.IndexFlatIP:
        """
        Creates a FAISS IndexFlatIP (Inner Product) index.
        Applies L2 normalization to the input embeddings so that the Inner Product
        is equivalent to Cosine Similarity.
        """
        if embeddings.size == 0:
            logger.error("FAISS Service: Received empty embeddings array for indexing.")
            raise ValueError("Cannot build FAISS index with empty embeddings array.")

        dimension = embeddings.shape[1]
        logger.info(f"FAISS Index Built: Dimension={dimension}, Total Vectors={embeddings.shape[0]}")
        
        # Clone array and convert to float32
        embeddings_norm = embeddings.copy().astype(np.float32)
        
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(embeddings_norm)
        
        # IndexFlatIP uses Inner Product search
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings_norm)
        
        return index

    @classmethod
    def save_index(cls, index: faiss.IndexFlatIP) -> str:
        """Saves the FAISS index binary to disk."""
        os.makedirs(INDEX_DIR, exist_ok=True)
        try:
            faiss.write_index(index, INDEX_PATH)
            logger.info(f"FAISS Service: Index saved successfully to {INDEX_PATH}.")
            return os.path.relpath(INDEX_PATH, BASE_DIR).replace("\\", "/")
        except Exception as e:
            logger.error(f"FAISS Service: Failed to write index to disk: {str(e)}")
            raise RuntimeError(f"Failed to save FAISS index: {str(e)}") from e

    @classmethod
    def load_index(cls) -> faiss.IndexFlatIP:
        """Loads the FAISS index binary from disk."""
        if not os.path.exists(INDEX_PATH):
            logger.error(f"FAISS Service: Index file missing at {INDEX_PATH}.")
            raise FileNotFoundError(f"FAISS index file not found at: {INDEX_PATH}")

        try:
            index = faiss.read_index(INDEX_PATH)
            logger.info(f"FAISS Service: Index loaded successfully from {INDEX_PATH}.")
            return index
        except Exception as e:
            logger.error(f"FAISS Service: Failed to read index from disk (corrupted index): {str(e)}")
            raise RuntimeError(f"Corrupted or invalid FAISS index: {str(e)}") from e

    @classmethod
    def search_index(
        cls,
        index: faiss.IndexFlatIP,
        query_vectors: np.ndarray,
        top_k: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Performs similarity search against the FAISS index.
        Normalizes the query vectors before searching to compute cosine similarity scores.
        Returns:
            Tuple[similarities, indices]
        """
        if query_vectors.size == 0:
            logger.error("FAISS Service: Received empty query vectors for search.")
            raise ValueError("Query vectors cannot be empty.")

        # L2 Normalize the query vectors
        query_vectors_norm = query_vectors.copy().astype(np.float32)
        faiss.normalize_L2(query_vectors_norm)

        logger.info(f"FAISS Service: Executing search for {query_vectors_norm.shape[0]} query vectors, top_k={top_k}.")
        similarities, indices = index.search(query_vectors_norm, top_k)
        return similarities, indices
