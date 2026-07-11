import logging
from typing import Dict, Any, List, Optional
from app.services.repository_service import RepositoryService
from app.services.loader_service import LoaderService

logger = logging.getLogger(__name__)

class SearchService:
    @classmethod
    def search_policies(
        cls,
        policy_id: Optional[str] = None,
        policy_name: Optional[str] = None,
        topic: Optional[str] = None,
        status: Optional[str] = None,
        embedding_model: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches and filters registered policies by multiple criteria.
        Returns matching policies.
        """
        # Load all policies (including all statuses, so we can filter by status if requested)
        # If status filter is not provided, we default to non-deleted active/archived policies
        include_deleted = (status is not None and status.upper() == "DELETED")
        policies = RepositoryService.get_policies(include_deleted=include_deleted or (status is None))

        results = []

        for p in policies:
            # 1. Match policy_id
            if policy_id and p.get("policy_id", "").lower() != policy_id.lower():
                continue

            # 2. Match policy_name
            if policy_name and policy_name.lower() not in p.get("policy_name", "").lower():
                continue

            # 3. Match status
            if status:
                if p.get("status", "").lower() != status.lower():
                    continue
            else:
                # If no status filter is specified, exclude DELETED policies by default
                if p.get("status") == "DELETED":
                    continue

            # 4. Match embedding_model
            if embedding_model and embedding_model.lower() not in p.get("embedding_model", "").lower():
                continue

            # 5. Match topic
            if topic:
                # If topic is specified, we must load the knowledge file and inspect the records
                knowledge_file = p.get("knowledge_file")
                if not knowledge_file:
                    continue
                try:
                    records = LoaderService.load_knowledge_file(knowledge_file)
                    # Check if any record has the topic (case-insensitive substring match)
                    topic_matched = False
                    for record in records:
                        rec_topic = record.get("topic", "")
                        if rec_topic and topic.lower() in rec_topic.lower():
                            topic_matched = True
                            break
                    if not topic_matched:
                        continue
                except Exception as e:
                    logger.warning(f"Could not load knowledge file {knowledge_file} for topic search: {e}")
                    continue

            # If all checks passed, add to results
            results.append(p)

        logger.info(f"Policy search completed. Found {len(results)} matches.")
        return results
