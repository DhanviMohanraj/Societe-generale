import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Singleton service class to manage loading and inference of the local
    sentence-transformers BGE embedding model.
    """
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Loads and returns the SentenceTransformer model (Singleton)."""
        if cls._model is None:
            logger.info("Initializing embedding model: BAAI/bge-small-en-v1.5 ...")
            try:
                # Load BAAI/bge-small-en-v1.5 locally
                cls._model = SentenceTransformer("BAAI/bge-small-en-v1.5")
                logger.info("Model BAAI/bge-small-en-v1.5 loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load local embedding model: {str(e)}")
                raise RuntimeError(f"Embedding model unavailable: {str(e)}") from e
        return cls._model

def get_embedding(text: str) -> List[float]:
    """
    Generates a normalized embedding for a single string of text.
    
    Args:
        text (str): Input text to embed.
        
    Returns:
        List[float]: Normalized 384-dimensional float vector.
    """
    model = EmbeddingService.get_model()
    try:
        # Encode with normalize_embeddings=True to get unit-length normalized vectors
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise RuntimeError(f"Failed to generate embedding: {str(e)}") from e

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates normalized embeddings for a list of strings in batch.
    
    Args:
        texts (List[str]): List of input text strings to embed.
        
    Returns:
        List[List[float]]: List of normalized 384-dimensional float vectors.
    """
    if not texts:
        return []
    model = EmbeddingService.get_model()
    try:
        embeddings = model.encode(texts, normalize_embeddings=True)
        return [emb.tolist() for emb in embeddings]
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        raise RuntimeError(f"Failed to generate batch embeddings: {str(e)}") from e
