from pydantic import BaseModel, Field, field_validator
from typing import List

class KnowledgeRecord(BaseModel):
    policy_id: str = Field(..., description="Stable policy ID, e.g., POL-001.")
    policy_name: str = Field(..., description="Filename of the original policy PDF.")
    obligation_id: str = Field(..., description="Stable obligation ID, e.g., OBL-001.")
    canonical_text: str = Field(..., description="Canonical natural sentence.")
    subject: str = Field(default="", description="Canonical subject.")
    action: str = Field(default="", description="Canonical action verb.")
    object: str = Field(default="", description="Canonical object.")
    condition: str = Field(default="", description="Canonical condition.")
    frequency: str = Field(default="", description="Canonical frequency.")
    strength: str = Field(default="", description="Canonical strength.")
    topic: str = Field(default="", description="Canonical topic.")
    confidence: float = Field(..., description="LLM extraction confidence.")
    embedding: List[float] = Field(..., description="Semantic embedding list.")
    embedding_dimension: int = Field(..., description="Dimension size of the embedding.")
    embedding_model: str = Field(..., description="Model identifier, e.g. BAAI/bge-small-en-v1.5.")
    created_at: str = Field(..., description="Creation ISO timestamp.")

    @field_validator("canonical_text")
    @classmethod
    def validate_canonical_text(cls, v: str) -> str:
        if not v or not str(v).strip():
            raise ValueError("Canonical text cannot be empty.")
        return str(v).strip()

    @field_validator("embedding")
    @classmethod
    def validate_embedding(cls, v: List[float], info) -> List[float]:
        # Validate BGE embedding length (should be 384)
        if len(v) != 384:
            raise ValueError(f"Embedding length must be exactly 384 dimensions, got: {len(v)}")
        # Check datatype of all elements
        if not all(isinstance(x, float) for x in v):
            raise ValueError("All elements in embedding must be floats.")
        return v
