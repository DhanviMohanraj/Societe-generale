import logging
import os
from typing import Dict, Any, List, Optional
from app.services.registry_service import RegistryService

logger = logging.getLogger(__name__)

class RepositoryService:
    @classmethod
    def get_repository_summary(cls) -> Dict[str, Any]:
        """Returns version, last_updated, total_policies, policies, and statistics."""
        registry = RegistryService.load_registry()
        # Filter out DELETED policies for standard summaries/list
        active_policies = [p for p in registry["policies"] if p["status"] != "DELETED"]
        stats = cls.calculate_statistics(registry)
        
        return {
            "repository_version": registry.get("repository_version", "1.0"),
            "last_updated": registry.get("last_updated", ""),
            "total_policies": stats["total_policies"],
            "policies": active_policies,
            "statistics": stats
        }

    @classmethod
    def get_policies(cls, include_deleted: bool = False) -> List[Dict[str, Any]]:
        """Returns all registered policies."""
        registry = RegistryService.load_registry()
        if include_deleted:
            return registry["policies"]
        return [p for p in registry["policies"] if p["status"] != "DELETED"]

    @classmethod
    def get_policy(cls, policy_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single policy by its ID (including check for existence)."""
        registry = RegistryService.load_registry()
        for p in registry["policies"]:
            if p["policy_id"] == policy_id:
                return p
        return None

    @classmethod
    def get_policy_ids(cls) -> List[str]:
        """Returns list of active policy IDs."""
        policies = cls.get_policies(include_deleted=False)
        return [p["policy_id"] for p in policies]

    @classmethod
    def calculate_statistics(cls, registry: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates and updates repository statistics dynamically."""
        if registry is None:
            registry = RegistryService.load_registry()

        # Statistics should count only ACTIVE and ARCHIVED policies
        target_policies = [p for p in registry["policies"] if p["status"] in ("ACTIVE", "ARCHIVED")]
        
        total_policies = len(target_policies)
        total_obligations = sum(p.get("obligation_count", 0) for p in target_policies)
        
        # Get unique list of embedding models
        models_set = set()
        for p in target_policies:
            model = p.get("embedding_model")
            if model:
                models_set.add(model)
        embedding_models = sorted(list(models_set))

        # Calculate average obligations per policy
        avg_obligations = 0.0
        if total_policies > 0:
            avg_obligations = round(total_obligations / total_policies, 2)

        stats = {
            "total_policies": total_policies,
            "total_obligations": total_obligations,
            "embedding_models": embedding_models,
            "average_obligations_per_policy": avg_obligations,
            "last_updated": registry.get("last_updated", "")
        }
        
        logger.info("Statistics Updated dynamically.")
        return stats
