import logging
import threading
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from app.schemas.pipeline import PipelineStartResponse, PipelineStatusResponse
from app.services.pipeline_service import PipelineService, progress_tracker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline", tags=["Pipeline Orchestrator"])


def _run_in_thread(filename: str):
    """Runs the full pipeline in a background thread so the HTTP request returns immediately."""
    try:
        PipelineService.run_pipeline(filename)
    except Exception as e:
        # Error is already stored in progress_tracker by run_pipeline; just log here
        logger.error(f"Background pipeline thread finished with error: {e}")


@router.post(
    "/run/{filename:path}",
    response_model=PipelineStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def run_pipeline_route(filename: str, background_tasks: BackgroundTasks):
    """
    POST /pipeline/run/{filename}

    Immediately returns 202 Accepted and kicks off the full pipeline in a
    background thread.  Poll GET /pipeline/status for live progress.

    Steps (executed in order):
      1. Extraction   2. Normalization  3. Vectorization  4. Repository
      5. Similarity   6. Analysis       7. Knowledge Graph 8. Governance
    """
    # Prevent two simultaneous runs
    current = progress_tracker.get_progress()
    if current["current_step"] not in ("Idle", "Completed") and not current["current_step"].startswith("Failed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pipeline run is already in progress. Check /pipeline/status.",
        )

    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"

    logger.info(f"Pipeline run requested for: {filename} — launching background thread")

    # Reset state immediately so the frontend can start polling
    progress_tracker.update("Starting", 0)

    # Use a daemon thread so it doesn't block server shutdown
    thread = threading.Thread(
        target=_run_in_thread,
        args=(filename,),
        daemon=True,
        name=f"pipeline-{filename}",
    )
    thread.start()

    return PipelineStartResponse(
        status="started",
        policy=filename,
        message=f"Pipeline started for '{filename}'. Poll GET /pipeline/status for progress.",
    )


@router.get("/status", response_model=PipelineStatusResponse, status_code=status.HTTP_200_OK)
def get_pipeline_status_route():
    """
    GET /pipeline/status
    Returns the in-memory progress of the currently executing (or last run) pipeline.
    """
    try:
        return progress_tracker.get_progress()
    except Exception as e:
        logger.error(f"Failed to fetch pipeline status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve pipeline status: {e}",
        )
