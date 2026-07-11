from pydantic import BaseModel, Field, field_validator
from typing import List

class NormalizedObligation(BaseModel):
    subject: str = Field(default="", description="The canonicalized subject.")
    action: str = Field(default="", description="The canonicalized action verb.")
    object: str = Field(default="", description="The canonicalized object.")
    condition: str = Field(default="", description="The canonicalized condition.")
    frequency: str = Field(default="", description="The canonicalized frequency.")
    strength: str = Field(default="", description="The canonicalized strength level.")
    topic: str = Field(default="", description="The canonicalized topic.")
    confidence: float = Field(..., description="Extraction confidence, between 0.0 and 1.0.")

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: str) -> str:
        valid_strengths = {"Mandatory", "Recommended", "Optional", "Prohibited"}
        if v not in valid_strengths:
            raise ValueError(f"Strength must be one of {valid_strengths}, got: '{v}'")
        return v

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Confidence must be between 0.0 and 1.0 inclusive, got: {v}")
        return v

class NormalizedObligationList(BaseModel):
    obligations: List[NormalizedObligation]
