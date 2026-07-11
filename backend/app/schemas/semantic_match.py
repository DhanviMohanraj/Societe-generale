from pydantic import BaseModel, Field, field_validator
from typing import List

class SemanticMatch(BaseModel):
    match_id: str = Field(..., description="Unique ID for the match, e.g. MATCH-001.")
    source_policy_id: str = Field(..., description="ID of the source policy.")
    source_policy_name: str = Field(..., description="Name of the source policy file.")
    source_obligation_id: str = Field(..., description="ID of the source obligation.")
    source_text: str = Field(..., description="Canonical text of the source obligation.")
    target_policy_id: str = Field(..., description="ID of the target policy.")
    target_policy_name: str = Field(..., description="Name of the target policy file.")
    target_obligation_id: str = Field(..., description="ID of the target obligation.")
    target_text: str = Field(..., description="Canonical text of the target obligation.")
    similarity: float = Field(..., description="Cosine similarity score.")
    embedding_model: str = Field(..., description="Embedding model used for comparison.")
    retrieved_at: str = Field(..., description="ISO timestamp of the match retrieval.")
    status: str = Field(default="PENDING_ANALYSIS", description="Analysis status of the match.")

    @field_validator("match_id")
    @classmethod
    def validate_match_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("match_id cannot be empty.")
        return v.strip()

    @field_validator("similarity")
    @classmethod
    def validate_similarity(cls, v: float) -> float:
        # Cosine similarity for unit normalized vectors is theoretically in [-1.0, 1.0].
        # But we expect similarity scores to be between 0.0 and 1.0 (since they are close match pairs).
        # We allow a small epsilon for float precision, e.g. up to 1.01, and clamp it.
        if not (-1.01 <= v <= 1.01):
            raise ValueError(f"Similarity score must be between -1.0 and 1.0, got {v}")
        if v > 1.0:
            return 1.0
        if v < -1.0:
            return -1.0
        return v

    @field_validator("source_text", "target_text")
    @classmethod
    def validate_texts(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text content cannot be empty.")
        return v.strip()

    @field_validator("source_obligation_id", "target_obligation_id", "source_policy_id", "target_policy_id")
    @classmethod
    def validate_ids(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID cannot be empty.")
        return v.strip()

class SemanticMatchList(BaseModel):
    matches: List[SemanticMatch] = Field(..., description="List of semantic matches.")
