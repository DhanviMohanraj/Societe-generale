import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status

from app.services.governance_snapshot_service import GovernanceSnapshotService
from app.services.analytics_repository import AnalyticsRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/governance", tags=["Policy Governance Analytics"])

@router.post("/build", status_code=status.HTTP_200_OK)
def build_governance_route():
    """
    POST /governance/build
    Triggers the end-to-end policy governance compilation pipeline.
    Loads graph and analysis files, computes statistics/scores, generates recommendations
    and overall governance snapshot, and saves all outputs.
    """
    try:
        summary = GovernanceSnapshotService.compile_governance_snapshot()
        return summary
    except FileNotFoundError as e:
        logger.warning(f"Build Governance: Missing inputs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        logger.error(f"Build Governance: Validation failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Governance validation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Build Governance: Unexpected analytics failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Governance engine error: {str(e)}"
        )


@router.get("", status_code=status.HTTP_200_OK)
def get_governance_snapshot_route():
    """
    GET /governance
    Returns the complete enterprise Governance Snapshot.
    """
    try:
        snapshot = AnalyticsRepository.load_snapshot()
        if not snapshot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Governance snapshot is not built yet. Please run POST /governance/build first."
            )
        return snapshot
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Governance Snapshot: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load snapshot: {str(e)}"
        )


@router.get("/policies", status_code=status.HTTP_200_OK)
def get_policy_summaries_route():
    """
    GET /governance/policies
    Returns list of all individual policy summaries.
    """
    try:
        snapshot = AnalyticsRepository.load_snapshot()
        if not snapshot or "policy_summaries" not in snapshot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Governance summaries are not built yet. Please run POST /governance/build first."
            )
        return snapshot["policy_summaries"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Policy Summaries: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load policy summaries: {str(e)}"
        )


@router.get("/statistics", status_code=status.HTTP_200_OK)
def get_enterprise_statistics_route():
    """
    GET /governance/statistics
    Returns enterprise-wide graph and analytics statistics.
    """
    try:
        stats = AnalyticsRepository.load_statistics()
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enterprise statistics are not built yet. Please run POST /governance/build first."
            )
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Enterprise Statistics: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load statistics: {str(e)}"
        )


@router.get("/recommendations", status_code=status.HTTP_200_OK)
def get_recommendations_route():
    """
    GET /governance/recommendations
    Returns the complete list of policy-level recommendations.
    """
    try:
        recs = AnalyticsRepository.load_recommendations()
        if not recs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendations are not built yet. Please run POST /governance/build first."
            )
        return recs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Recommendations: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load recommendations: {str(e)}"
        )


@router.get("/policy/{policy_id}", status_code=status.HTTP_200_OK)
def get_policy_report_route(policy_id: str):
    """
    GET /governance/policy/{policy_id}
    Returns detailed governance report for a single policy.
    """
    try:
        snapshot = AnalyticsRepository.load_snapshot()
        if not snapshot or "policy_summaries" not in snapshot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Governance data is not built yet. Please run POST /governance/build first."
            )
        
        policy_summaries = snapshot["policy_summaries"]
        policy_report = next((p for p in policy_summaries if p["policy_id"] == policy_id), None)
        
        if not policy_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Governance report for policy '{policy_id}' not found."
            )
            
        return policy_report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Policy Governance Report: Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load policy report: {str(e)}"
        )
