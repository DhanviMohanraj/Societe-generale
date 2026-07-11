import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GOV_DIR = os.path.join(BASE_DIR, "outputs", "governance")

SNAPSHOT_PATH = os.path.join(GOV_DIR, "governance_snapshot.json")
POLICY_GOV_PATH = os.path.join(GOV_DIR, "policy_governance.json")
STATS_PATH = os.path.join(GOV_DIR, "enterprise_statistics.json")
RECS_PATH = os.path.join(GOV_DIR, "recommendations.json")

os.makedirs(GOV_DIR, exist_ok=True)

class AnalyticsRepository:
    """
    Manages loading and saving governance snapshot, statistics, 
    policy governance, and recommendation files from and to outputs/governance/.
    """

    @classmethod
    def _ensure_directory(cls) -> None:
        os.makedirs(GOV_DIR, exist_ok=True)

    @classmethod
    def save_snapshot(cls, snapshot_data: Dict[str, Any]) -> None:
        cls._ensure_directory()
        try:
            with open(SNAPSHOT_PATH, "w", encoding="utf-8") as f:
                json.dump(snapshot_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Analytics Repository: Saved governance snapshot to {SNAPSHOT_PATH}")
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to save snapshot: {str(e)}")
            raise RuntimeError(f"Storage error saving snapshot: {str(e)}") from e

    @classmethod
    def load_snapshot(cls) -> Dict[str, Any]:
        if not os.path.exists(SNAPSHOT_PATH):
            logger.info("Analytics Repository: Snapshot file missing. Returning empty structure.")
            return {}
        try:
            with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to load snapshot: {str(e)}")
            raise RuntimeError(f"Storage error loading snapshot: {str(e)}") from e

    @classmethod
    def save_statistics(cls, stats_data: Dict[str, Any]) -> None:
        cls._ensure_directory()
        try:
            with open(STATS_PATH, "w", encoding="utf-8") as f:
                json.dump(stats_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Analytics Repository: Saved enterprise statistics to {STATS_PATH}")
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to save statistics: {str(e)}")
            raise RuntimeError(f"Storage error saving statistics: {str(e)}") from e

    @classmethod
    def load_statistics(cls) -> Dict[str, Any]:
        if not os.path.exists(STATS_PATH):
            logger.info("Analytics Repository: Statistics file missing. Returning empty dict.")
            return {}
        try:
            with open(STATS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to load statistics: {str(e)}")
            raise RuntimeError(f"Storage error loading statistics: {str(e)}") from e

    @classmethod
    def save_policy_governance(cls, policy_data: List[Dict[str, Any]]) -> None:
        cls._ensure_directory()
        try:
            with open(POLICY_GOV_PATH, "w", encoding="utf-8") as f:
                json.dump(policy_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Analytics Repository: Saved policy governance list to {POLICY_GOV_PATH}")
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to save policy governance: {str(e)}")
            raise RuntimeError(f"Storage error saving policy governance: {str(e)}") from e

    @classmethod
    def load_policy_governance(cls) -> List[Dict[str, Any]]:
        if not os.path.exists(POLICY_GOV_PATH):
            logger.info("Analytics Repository: Policy governance file missing. Returning empty list.")
            return []
        try:
            with open(POLICY_GOV_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to load policy governance: {str(e)}")
            raise RuntimeError(f"Storage error loading policy governance: {str(e)}") from e

    @classmethod
    def save_recommendations(cls, rec_data: List[Dict[str, Any]]) -> None:
        cls._ensure_directory()
        try:
            with open(RECS_PATH, "w", encoding="utf-8") as f:
                json.dump(rec_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Analytics Repository: Saved recommendations to {RECS_PATH}")
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to save recommendations: {str(e)}")
            raise RuntimeError(f"Storage error saving recommendations: {str(e)}") from e

    @classmethod
    def load_recommendations(cls) -> List[Dict[str, Any]]:
        if not os.path.exists(RECS_PATH):
            logger.info("Analytics Repository: Recommendations file missing. Returning empty list.")
            return []
        try:
            with open(RECS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Analytics Repository: Failed to load recommendations: {str(e)}")
            raise RuntimeError(f"Storage error loading recommendations: {str(e)}") from e
