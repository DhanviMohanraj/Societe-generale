from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.llm_service import ask_llm
from app.utils.prompts import EXTRACT_OBLIGATION_PROMPT

router = APIRouter()

class TestLLMRequest(BaseModel):
    text: str = Field(..., description="The policy text to process.")

@router.get("/", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check endpoint that verifies the service is running and
    documents the local model being used.
    """
    return {
        "status": "running",
        "model": "qwen2.5:7b"
    }

@router.post("/test-llm", status_code=status.HTTP_200_OK)
def test_llm(payload: TestLLMRequest):
    """
    Test endpoint to verify local Ollama LLM integration.
    Appends the obligation extraction prompt to the provided text.
    """
    # Check for empty request/text
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The input text cannot be empty."
        )

    # Combine text and prompt
    combined_prompt = f"{payload.text}\n\n{EXTRACT_OBLIGATION_PROMPT}"

    try:
        response_text = ask_llm(combined_prompt)
        return {"response": response_text}
    except RuntimeError as e:
        # Catch LLM/Ollama service issues
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"LLM Service Unavailable: {str(e)}"
        )
