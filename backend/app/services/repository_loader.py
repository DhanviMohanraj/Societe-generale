import logging
from typing import List
from app.schemas.knowledge_record import KnowledgeRecord
from app.services.repository_service import RepositoryService
from app.services.loader_service import LoaderService

logger = logging.getLogger(__name__)

class RepositoryLoader:
    @classmethod
    def load_knowledge_records(cls) -> List[KnowledgeRecord]:
        """
        Loads every knowledge record through the repository.
        Never accesses folders directly.
        Returns a list of KnowledgeRecord schema objects.
        """
        logger.info("Repository Loader: Loading active policies from repository.")
        try:
            # Load policies, excluding deleted ones (i.e. ACTIVE and ARCHIVED)
            policies = RepositoryService.get_policies(include_deleted=False)
        except Exception as e:
            logger.error(f"Failed to get policies from repository: {str(e)}")
            raise RuntimeError(f"Failed to get policies from repository: {str(e)}") from e

        if not policies:
            logger.warning("Repository Loader: No active or archived policies found.")
            return []

        all_records: List[KnowledgeRecord] = []
        for policy in policies:
            knowledge_file_rel = policy.get("knowledge_file")
            if not knowledge_file_rel:
                logger.warning(f"Policy {policy.get('policy_id')} is missing a knowledge file reference. Skipping.")
                continue

            logger.info(f"Repository Loader: Loading knowledge file '{knowledge_file_rel}' for policy {policy.get('policy_id')}.")
            try:
                records_list = LoaderService.load_knowledge_file(knowledge_file_rel)
                for record_dict in records_list:
                    # Validate against Pydantic schema
                    record = KnowledgeRecord(**record_dict)
                    all_records.append(record)
            except Exception as e:
                logger.error(f"Failed to load knowledge records for policy {policy.get('policy_id')}: {str(e)}")
                raise RuntimeError(f"Error loading knowledge records for policy {policy.get('policy_id')}: {str(e)}") from e

        logger.info(f"Repository Loader Completed. Loaded {len(all_records)} knowledge records.")
        return all_records
