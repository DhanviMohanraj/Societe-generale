import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.analysis_record import AnalysisRecord
from app.services.analysis_service import AnalysisService
from app.services.analysis_repository import AnalysisRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/run", status_code=status.HTTP_200_OK)
def run_analysis_route(
    force: bool = Query(default=False, description="Force rerun of LLM reasoning, ignoring cache.")
):
    """
    POST /analysis/run
    Executes the LLM comparison pipeline over candidate obligation matches.
    Stores analysis_records.json and conflict_index.json on disk.
    Returns processing summary.
    """
    try:
        summary = AnalysisService.run_analysis(force=force)
        return summary
    except FileNotFoundError as e:
        logger.warning(f"Run Analysis: Missing input data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        logger.error(f"Run Analysis: Validation failure on LLM response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"LLM decision validation failed: {str(e)}"
        )
    except RuntimeError as e:
        logger.error(f"Run Analysis: Pipeline runtime error: {str(e)}")
        # Check if it was an Ollama connection error
        if "ollama" in str(e).lower() or "llm" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI Reasoning Service is unavailable: {str(e)}"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal analysis engine error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Run Analysis: Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected engine error: {str(e)}"
        )


@router.get("", response_model=List[AnalysisRecord], status_code=status.HTTP_200_OK)
def get_analysis_records_route():
    """
    GET /analysis
    Retrieves all generated Analysis Records.
    """
    try:
        records = AnalysisRepository.load_analysis_records()
        return records
    except Exception as e:
        logger.error(f"Get Analysis: Failed to load records: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analysis records: {str(e)}"
        )


@router.get("/conflicts", response_model=List[AnalysisRecord], status_code=status.HTTP_200_OK)
def get_conflicts_route():
    """
    GET /analysis/conflicts
    Retrieves conflict-only Analysis Records from conflict_index.json.
    """
    try:
        conflicts = AnalysisRepository.load_conflicts()
        return conflicts
    except Exception as e:
        logger.error(f"Get Conflicts: Failed to load conflicts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve conflicts: {str(e)}"
        )
