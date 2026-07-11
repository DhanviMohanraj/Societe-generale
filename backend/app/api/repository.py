import logging
from fastapi import APIRouter, HTTPException, Query, status, Body
from typing import List, Dict, Any
from app.schemas.repository import Repository, RepositoryPolicy, RepositoryStatistics
from app.services.repository_service import RepositoryService
from app.services.registry_service import RegistryService
from app.services.search_service import SearchService

router = APIRouter(prefix="/repository", tags=["Repository"])
logger = logging.getLogger(__name__)

@router.get("", response_model=Repository, status_code=status.HTTP_200_OK)
def get_repository_summary_route(
    policy_id: str = Query(default=None, description="Filter by policy_id"),
    policy_name: str = Query(default=None, description="Filter by policy_name (substring)"),
    topic: str = Query(default=None, description="Filter by topic in knowledge records (substring)"),
    status: str = Query(default=None, description="Filter by status (ACTIVE, ARCHIVED, DELETED)"),
    embedding_model: str = Query(default=None, description="Filter by embedding model (substring)")
):
    """
    GET /repository
    Returns the repository version, last updated timestamp, total policies count,
    the list of policies (filtered if parameters are provided), and summary statistics.
    """
    try:
        # If any search/filter query parameters are passed, use SearchService
        if any([policy_id, policy_name, topic, status, embedding_model]):
            logger.info("Retrieving repository summary with filters.")
            registry = RegistryService.load_registry()
            matched_policies = SearchService.search_policies(
                policy_id=policy_id,
                policy_name=policy_name,
                topic=topic,
                status=status,
                embedding_model=embedding_model
            )
            stats = RepositoryService.calculate_statistics(registry)
            return {
                "repository_version": registry.get("repository_version", "1.0"),
                "last_updated": registry.get("last_updated", ""),
                "total_policies": len([p for p in matched_policies if p["status"] != "DELETED"]),
                "policies": matched_policies,
                "statistics": stats
            }
        
        # Default behavior: return unfiltered active/archived summary
        return RepositoryService.get_repository_summary()
    except Exception as e:
        logger.error(f"Error retrieving repository summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal repository error: {str(e)}"
        )


@router.get("/policies", response_model=List[RepositoryPolicy], status_code=status.HTTP_200_OK)
def get_all_policies_route(
    include_deleted: bool = Query(default=False, description="Include policies marked as DELETED.")
):
    """
    GET /repository/policies
    Returns all registered policies. By default, ignores deleted ones.
    """
    try:
        return RepositoryService.get_policies(include_deleted=include_deleted)
    except Exception as e:
        logger.error(f"Error retrieving policies list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal repository error: {str(e)}"
        )


@router.get("/policy/{policy_id}", response_model=RepositoryPolicy, status_code=status.HTTP_200_OK)
def get_policy_route(policy_id: str):
    """
    GET /repository/policy/{policy_id}
    Returns details of a single policy.
    """
    try:
        policy = RepositoryService.get_policy(policy_id)
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy with ID '{policy_id}' was not found in the repository."
            )
        return policy
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving policy {policy_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal repository error: {str(e)}"
        )


@router.get("/statistics", response_model=RepositoryStatistics, status_code=status.HTTP_200_OK)
def get_statistics_route():
    """
    GET /repository/statistics
    Returns dynamic repository statistics.
    """
    try:
        return RepositoryService.calculate_statistics()
    except Exception as e:
        logger.error(f"Error calculating repository statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal repository error: {str(e)}"
        )


@router.post("/rebuild", response_model=Repository, status_code=status.HTTP_200_OK)
def rebuild_registry_route():
    """
    POST /repository/rebuild
    Scans the outputs/knowledge directory, recalculates checksums and metadata,
    rebuilds the registry from scratch, and returns the updated repository.
    """
    try:
        rebuilt_registry = RegistryService.rebuild_registry()
        # Fetch active policies for summary output
        active_policies = [p for p in rebuilt_registry["policies"] if p["status"] != "DELETED"]
        stats = RepositoryService.calculate_statistics(rebuilt_registry)
        
        return {
            "repository_version": rebuilt_registry.get("repository_version", "1.0"),
            "last_updated": rebuilt_registry.get("last_updated", ""),
            "total_policies": stats["total_policies"],
            "policies": active_policies,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Error rebuilding registry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild repository registry: {str(e)}"
        )


@router.put("/policy/{policy_id}/status", response_model=RepositoryPolicy, status_code=status.HTTP_200_OK)
def update_policy_status_route(
    policy_id: str,
    status_value: str = Query(..., alias="status", description="New status value (ACTIVE, ARCHIVED, DELETED)")
):
    """
    PUT /repository/policy/{policy_id}/status
    Updates the status of a registered policy. Supports ACTIVE, ARCHIVED, or DELETED.
    """
    try:
        status_upper = status_value.upper()
        if status_upper not in {"ACTIVE", "ARCHIVED", "DELETED"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status value: {status_value}. Must be one of ACTIVE, ARCHIVED, DELETED."
            )

        success = RegistryService.update_status(policy_id, status_upper)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy with ID '{policy_id}' was not found."
            )
        
        return RepositoryService.get_policy(policy_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating policy status for {policy_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update policy status: {str(e)}"
        )


@router.delete("/policy/{policy_id}", status_code=status.HTTP_200_OK)
def delete_policy_route(policy_id: str):
    """
    DELETE /repository/policy/{policy_id}
    Logically removes a policy from the repository registry by setting its status to DELETED.
    Does not delete any physical files.
    """
    try:
        success = RegistryService.remove_policy(policy_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy with ID '{policy_id}' was not found in the repository."
            )
        return {"message": f"Policy '{policy_id}' successfully marked as DELETED."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting policy {policy_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete policy: {str(e)}"
        )
