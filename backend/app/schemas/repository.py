from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

class RepositoryPolicy(BaseModel):
    policy_id: str = Field(..., description="Stable unique policy identifier, e.g., POL-001.")
    policy_name: str = Field(..., description="Filename of the original policy PDF.")
    knowledge_file: str = Field(..., description="Relative path to the knowledge JSON file.")
    normalized_file: str = Field(..., description="Relative path to the normalized obligations JSON file.")
    text_file: str = Field(..., description="Relative path to the extracted text file.")
    embedding_model: str = Field(..., description="Embedding model identifier, e.g. BAAI/bge-small-en-v1.5.")
    embedding_dimension: int = Field(..., description="Dimension size of the embedding.")
    obligation_count: int = Field(..., description="Total obligations inside this policy.")
    created_at: str = Field(..., description="ISO 8601 creation timestamp.")
    updated_at: str = Field(..., description="ISO 8601 last update timestamp.")
    status: str = Field(default="ACTIVE", description="Status of the policy: ACTIVE, ARCHIVED, or DELETED.")
    checksum: str = Field(..., description="SHA-256 checksum of the knowledge file.")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"ACTIVE", "ARCHIVED", "DELETED"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}, got: {v}")
        return v

    @field_validator("obligation_count")
    @classmethod
    def validate_obligation_count(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Obligation count cannot be negative.")
        return v


class RepositoryStatistics(BaseModel):
    total_policies: int = Field(..., description="Total policies registered.")
    total_obligations: int = Field(..., description="Total obligations across all active/archived policies.")
    embedding_models: List[str] = Field(..., description="List of unique embedding models used.")
    average_obligations_per_policy: float = Field(..., description="Average obligations per policy.")
    last_updated: str = Field(..., description="ISO 8601 timestamp of the last registry modification.")


class Repository(BaseModel):
    repository_version: str = Field(default="1.0", description="Version of the repository registry format.")
    last_updated: str = Field(..., description="ISO 8601 timestamp of the last update.")
    total_policies: int = Field(..., description="Total active/archived policies count.")
    policies: List[RepositoryPolicy] = Field(..., description="List of registered policies.")
    statistics: Optional[RepositoryStatistics] = Field(None, description="Repository statistics calculated dynamically.")
