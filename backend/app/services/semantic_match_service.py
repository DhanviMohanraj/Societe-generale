import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.schemas.semantic_match import SemanticMatch
from app.schemas.knowledge_record import KnowledgeRecord

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SIMILARITY_DIR = os.path.join(BASE_DIR, "outputs", "similarity")
MATCHES_PATH = os.path.join(SIMILARITY_DIR, "candidate_matches.json")

os.makedirs(SIMILARITY_DIR, exist_ok=True)

class SemanticMatchService:
    """
    Handles formatting and persistence of Semantic Match Records.
    Enforces schemas, validates values, and manages candidate_matches.json.
    """

    @classmethod
    def build_match_record(
        cls,
        match_idx: int,
        source: KnowledgeRecord,
        target: KnowledgeRecord,
        similarity: float
    ) -> SemanticMatch:
        """
        Creates a validated SemanticMatch instance from two KnowledgeRecord objects.
        """
        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        return SemanticMatch(
            match_id=f"MATCH-{match_idx:03d}",
            source_policy_id=source.policy_id,
            source_policy_name=source.policy_name,
            source_obligation_id=source.obligation_id,
            source_text=source.canonical_text,
            target_policy_id=target.policy_id,
            target_policy_name=target.policy_name,
            target_obligation_id=target.obligation_id,
            target_text=target.canonical_text,
            similarity=float(similarity),
            embedding_model=source.embedding_model,
            retrieved_at=now_str,
            status="PENDING_ANALYSIS"
        )

    @classmethod
    def save_candidate_matches(cls, matches: List[SemanticMatch]) -> str:
        """
        Saves a list of SemanticMatch objects to outputs/similarity/candidate_matches.json.
        Enforces schema validation and checks for duplicate match IDs.
        """
        os.makedirs(SIMILARITY_DIR, exist_ok=True)

        # Validate that there are no duplicate match IDs
        seen_ids = set()
        for match in matches:
            if match.match_id in seen_ids:
                logger.error(f"Semantic Match Service: Duplicate match_id detected: {match.match_id}")
                raise ValueError(f"Duplicate match_id detected: {match.match_id}")
            seen_ids.add(match.match_id)

        try:
            # Serialize Pydantic objects to list of dicts
            data = [m.model_dump() for m in matches]
            with open(MATCHES_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            logger.info(f"Similarity File Saved: Matches written to {MATCHES_PATH}")
            return os.path.relpath(MATCHES_PATH, BASE_DIR).replace("\\", "/")
        except Exception as e:
            logger.error(f"Failed to save candidate matches to disk: {str(e)}")
            raise RuntimeError(f"Failed to save candidate matches: {str(e)}") from e

    @classmethod
    def load_candidate_matches(cls) -> List[SemanticMatch]:
        """
        Loads all candidate matches from outputs/similarity/candidate_matches.json.
        """
        if not os.path.exists(MATCHES_PATH):
            logger.info(f"Candidate matches file missing at {MATCHES_PATH}. Returning empty list.")
            return []

        try:
            with open(MATCHES_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("candidate_matches.json must be a JSON array of matches.")
                return [SemanticMatch(**item) for item in data]
        except Exception as e:
            logger.error(f"Failed to load candidate matches file: {str(e)}")
            raise RuntimeError(f"Failed to load candidate matches: {str(e)}") from e
