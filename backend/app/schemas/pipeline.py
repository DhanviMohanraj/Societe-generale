from pydantic import BaseModel, Field
from typing import List, Optional

class PipelineStartResponse(BaseModel):
    status: str = Field(..., description="'started' once the pipeline has been kicked off in the background.")
    policy: str = Field(..., description="Filename of the policy being processed.")
    message: str = Field(..., description="Human-readable message.")

class PipelineRunResponse(BaseModel):
    status: str = Field(..., description="Overall status (e.g. 'completed', 'failed')")
    policy: str = Field(..., description="Filename of the policy processed.")
    processed_modules: List[str] = Field(..., description="List of modules processed.")
    governance_score: int = Field(..., description="Calculated governance score.")
    risk_level: str = Field(..., description="Overall risk level.")

class PipelineStatusResponse(BaseModel):
    current_step: str = Field(..., description="Name of the current step running or completed.")
    completed: int = Field(..., description="Number of completed steps.")
    total: int = Field(..., description="Total number of steps.")
    percentage: int = Field(..., description="Progress percentage.")
    error: Optional[str] = Field(None, description="Error message if the pipeline failed.")
