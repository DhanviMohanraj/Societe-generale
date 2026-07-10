from pydantic import BaseModel, Field, field_validator
from typing import List

class Obligation(BaseModel):
    subject: str = Field(default="", description="The entity bound by the obligation.")
    action: str = Field(default="", description="The required action.")
    object: str = Field(default="", description="The target of the action.")
    condition: str = Field(default="", description="Conditions applicable to the obligation.")
    frequency: str = Field(default="", description="How often the obligation must be performed.")
    strength: str = Field(default="", description="Strength level: Mandatory, Recommended, Optional, Prohibited.")
    topic: str = Field(default="", description="The overall category or topic.")
    confidence: float = Field(..., description="LLM extraction confidence, between 0.0 and 1.0.")

    @field_validator("strength")
    @classmethod
    def validate_strength(cls, v: str) -> str:
        # Normalize and validate the strength value
        val = str(v).strip().title() if v else ""
        valid_strengths = {"Mandatory", "Recommended", "Optional", "Prohibited"}
        if val not in valid_strengths:
            raise ValueError(f"Strength must be one of {valid_strengths}, got: '{v}'")
        return val

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        # Check if confidence is within the [0, 1] range
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Confidence must be between 0.0 and 1.0 inclusive, got: {v}")
        return v

class ObligationList(BaseModel):
    obligations: List[Obligation]
