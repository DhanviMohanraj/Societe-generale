import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status, Body
from pydantic import BaseModel, Field, field_validator
import numpy as np

from app.schemas.semantic_match import SemanticMatch, SemanticMatchList
from app.services.repository_loader import RepositoryLoader
from app.services.faiss_service import FAISSService
from app.services.index_manifest_service import IndexManifestService
from app.services.semantic_match_service import SemanticMatchService
from app.services.similarity_service import SimilarityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/similarity", tags=["Similarity"])

class SimilarityFindRequest(BaseModel):
    top_k: int = Field(default=5, description="Number of top neighbors to retrieve.")
    threshold: float = Field(default=0.80, description="Similarity threshold for filtering.")

    @field_validator("top_k")
    @classmethod
    def validate_top_k(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("top_k must be a positive integer greater than zero.")
        return v

    @field_validator("threshold")
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError("threshold must be a float between 0.0 and 1.0 inclusive.")
        return v


@router.post("/build-index", status_code=status.HTTP_200_OK)
def build_index_route():
    """
    POST /similarity/build-index
    Rebuilds the FAISS index from all active/archived repository knowledge records.
    Saves the index file, vector mappings, and index manifest.
    """
    try:
        # 1. Load all records from repository loader
        records = RepositoryLoader.load_knowledge_records()
        if not records:
            logger.error("Build Index: Cannot build index. Repository has no knowledge records.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot build index because the repository contains no active knowledge records. Please extract and vectorize policies first."
            )

        # 2. Check for dimension and model consistency
        first_model = records[0].embedding_model
        first_dim = records[0].embedding_dimension
        
        # Check if there are any records with empty embeddings
        for idx, r in enumerate(records):
            if not r.embedding:
                logger.error(f"Build Index: Obligation {r.obligation_id} in policy {r.policy_id} contains an empty embedding.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Obligation '{r.obligation_id}' in policy '{r.policy_id}' is missing embedding vectors."
                )
            if len(r.embedding) != first_dim:
                logger.error(f"Build Index: Embedding dimension mismatch at index {idx}: {len(r.embedding)} vs {first_dim}.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Embedding dimension mismatch in repository. Obligation '{r.obligation_id}' has {len(r.embedding)} dimensions, expected {first_dim}."
                )
            if r.embedding_model != first_model:
                logger.error(f"Build Index: Embedding model mismatch at index {idx}: '{r.embedding_model}' vs '{first_model}'.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Embedding model mismatch in repository. Obligation '{r.obligation_id}' uses model '{r.embedding_model}', expected '{first_model}'."
                )

        # 3. Build numpy array of embeddings (N x D)
        embeddings_arr = np.array([r.embedding for r in records], dtype=np.float32)

        # 4. Create and save FAISS index
        index = FAISSService.build_index(embeddings_arr)
        FAISSService.save_index(index)
        logger.info("FAISS Index Built")

        # 5. Save vector mapping (maps index -> policy_id:obligation_id)
        # Note: mapping keys must be strings for JSON format
        mapping = {str(idx): f"{r.policy_id}:{r.obligation_id}" for idx, r in enumerate(records)}
        IndexManifestService.save_vector_mapping(mapping)
        logger.info("Vector Mapping Saved")

        # 6. Save index manifest
        policies_indexed = sorted(list(set(r.policy_id for r in records)))
        IndexManifestService.save_manifest(
            embedding_model=first_model,
            vector_dimension=first_dim,
            total_vectors=len(records),
            policies_indexed=policies_indexed
        )
        logger.info("Manifest Saved")
        logger.info("Completed")

        return {
            "status": "completed",
            "total_vectors": len(records),
            "policies_indexed": len(policies_indexed)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Build Index: Failed to build index: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build index: {str(e)}"
        )


@router.post("/find", response_model=List[SemanticMatch], status_code=status.HTTP_200_OK)
def find_similar_obligations_route(
    payload: SimilarityFindRequest = Body(...)
):
    """
    POST /similarity/find
    Loads the FAISS index and finds similar candidate matches across policies.
    Saves results to outputs/similarity/candidate_matches.json and returns matches.
    """
    try:
        # 1. Load all records from repository loader
        records = RepositoryLoader.load_knowledge_records()
        if not records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active knowledge records found in the repository. Cannot perform similarity search."
            )

        # 2. Run similarity service search
        try:
            logger.info("Similarity Search Started")
            matches = SimilarityService.find_similar_obligations(
                records=records,
                top_k=payload.top_k,
                threshold=payload.threshold
            )
        except RuntimeError as e:
            # Handle missing files or other configuration issues
            logger.error(f"Find route similarity service error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

        # 3. Save matches to candidate_matches.json
        try:
            SemanticMatchService.save_candidate_matches(matches)
        except Exception as e:
            logger.error(f"Failed to save candidate matches: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write candidate matches: {str(e)}"
            )

        logger.info("Candidate Matches Generated")
        logger.info("Completed")
        return matches

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Find Route: Unexpected failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/matches", response_model=List[SemanticMatch], status_code=status.HTTP_200_OK)
def get_matches_route():
    """
    GET /similarity/matches
    Returns all candidate semantic matches currently stored on disk.
    """
    try:
        matches = SemanticMatchService.load_candidate_matches()
        return matches
    except Exception as e:
        logger.error(f"Get Matches Route: Failed to load matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve candidate matches: {str(e)}"
        )
