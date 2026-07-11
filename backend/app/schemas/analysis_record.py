from pydantic import BaseModel, Field, field_validator
from typing import List, Literal

class ReasoningTrace(BaseModel):
    semantic_similarity: float = Field(..., description="Cosine similarity score from FAISS comparison.")
    llm_observation: str = Field(..., description="LLM general observation of comparison.")
    decision_basis: str = Field(..., description="Basis/justification for the relationship decision.")

    @field_validator("llm_observation", "decision_basis")
    @classmethod
    def validate_trace_strings(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Trace text fields cannot be empty.")
        return v.strip()


class AnalysisRecord(BaseModel):
    analysis_id: str = Field(..., description="Unique sequential analysis identifier, e.g., ANL-001.")
    match_id: str = Field(..., description="Unique match identifier from similarity matching.")
    source_policy_id: str = Field(..., description="Source policy ID.")
    target_policy_id: str = Field(..., description="Target policy ID.")
    source_obligation_id: str = Field(..., description="Source obligation ID.")
    target_obligation_id: str = Field(..., description="Target obligation ID.")
    source_text: str = Field(..., description="Text of the source obligation.")
    target_text: str = Field(..., description="Text of the target obligation.")
    semantic_similarity: float = Field(..., description="Semantic similarity score.")
    relationship: Literal["CONFLICT", "DUPLICATE", "OVERLAP", "COMPLEMENTARY", "INDEPENDENT"] = Field(
        ..., description="Classified relationship between obligations."
    )
    confidence: float = Field(..., description="LLM decision confidence (0.0 to 1.0).")
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(
        ..., description="Impact severity of the relationship."
    )
    reason: str = Field(..., description="Analysis explanation/reason.")
    recommendation: str = Field(..., description="Recommended resolution action.")
    reasoning_trace: ReasoningTrace = Field(..., description="Reasoning trace data structure.")
    llm_model: str = Field(..., description="LLM model identifier used for comparison.")
    created_at: str = Field(..., description="ISO 8601 timestamp of analysis creation.")
    status: str = Field(default="PENDING_ANALYSIS", description="State of the analysis record.")

    @field_validator("analysis_id", "match_id")
    @classmethod
    def validate_ids(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID fields cannot be empty.")
        return v.strip()

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Confidence score must be between 0.0 and 1.0, got {v}")
        return v

    @field_validator("reason", "recommendation")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text fields cannot be empty.")
        return v.strip()
