import os
import json
import logging
from typing import List, Dict, Any
from app.schemas.analysis_record import AnalysisRecord

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ANALYSIS_DIR = os.path.join(BASE_DIR, "outputs", "analysis")
RECORDS_PATH = os.path.join(ANALYSIS_DIR, "analysis_records.json")
CONFLICTS_PATH = os.path.join(ANALYSIS_DIR, "conflict_index.json")

os.makedirs(ANALYSIS_DIR, exist_ok=True)

class AnalysisRepository:
    """
    Manages persistence of Analysis Records.
    Saves and loads all analysis records (analysis_records.json) and
    manages the conflict-only index (conflict_index.json).
    """

    @classmethod
    def save_analysis_records(cls, records: List[AnalysisRecord]) -> None:
        """
        Saves all analysis records to disk and builds/updates the conflict_index.json.
        """
        os.makedirs(ANALYSIS_DIR, exist_ok=True)

        try:
            # 1. Serialize all records to dicts
            all_data = [r.model_dump() for r in records]
            with open(RECORDS_PATH, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Analysis Saved: Successfully written {len(records)} records to {RECORDS_PATH}")
        except Exception as e:
            logger.error(f"Analysis Repository: Failed to write master records file: {str(e)}")
            raise RuntimeError(f"Failed to save analysis records: {str(e)}") from e

        try:
            # 2. Filter and save conflicts index
            conflict_records = [r.model_dump() for r in records if r.relationship == "CONFLICT"]
            with open(CONFLICTS_PATH, "w", encoding="utf-8") as f:
                json.dump(conflict_records, f, ensure_ascii=False, indent=4)
            logger.info(f"Conflict Index Updated: Successfully written {len(conflict_records)} conflicts to {CONFLICTS_PATH}")
        except Exception as e:
            logger.error(f"Analysis Repository: Failed to write conflict index file: {str(e)}")
            raise RuntimeError(f"Failed to update conflict index: {str(e)}") from e

    @classmethod
    def load_analysis_records(cls) -> List[AnalysisRecord]:
        """
        Loads all analysis records from outputs/analysis/analysis_records.json.
        Returns an empty list if the file is missing or uninitialized.
        """
        if not os.path.exists(RECORDS_PATH):
            logger.info(f"Analysis Repository: Records file missing at {RECORDS_PATH}. Returning empty list.")
            return []

        try:
            with open(RECORDS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("analysis_records.json content must be a JSON array.")
                return [AnalysisRecord(**item) for item in data]
        except Exception as e:
            logger.error(f"Analysis Repository: Failed to load master records file: {str(e)}")
            raise RuntimeError(f"Failed to load analysis records: {str(e)}") from e

    @classmethod
    def load_conflicts(cls) -> List[AnalysisRecord]:
        """
        Loads only conflict records from outputs/analysis/conflict_index.json.
        Returns an empty list if the file is missing.
        """
        if not os.path.exists(CONFLICTS_PATH):
            logger.info(f"Analysis Repository: Conflict index file missing at {CONFLICTS_PATH}. Returning empty list.")
            return []

        try:
            with open(CONFLICTS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("conflict_index.json content must be a JSON array.")
                return [AnalysisRecord(**item) for item in data]
        except Exception as e:
            logger.error(f"Analysis Repository: Failed to load conflict index file: {str(e)}")
            raise RuntimeError(f"Failed to load conflicts: {str(e)}") from e
