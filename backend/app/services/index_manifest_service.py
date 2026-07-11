import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INDEX_DIR = os.path.join(BASE_DIR, "outputs", "index")
MAPPING_PATH = os.path.join(INDEX_DIR, "vector_mapping.json")
MANIFEST_PATH = os.path.join(INDEX_DIR, "index_manifest.json")

os.makedirs(INDEX_DIR, exist_ok=True)

class IndexManifestService:
    """
    Manages loading and saving vector mapping metadata and the index health manifest.
    """

    @classmethod
    def save_vector_mapping(cls, mapping: Dict[str, str]) -> str:
        """
        Saves the index-to-obligation-ID mapping to vector_mapping.json.
        """
        os.makedirs(INDEX_DIR, exist_ok=True)
        try:
            with open(MAPPING_PATH, "w", encoding="utf-8") as f:
                json.dump(mapping, f, ensure_ascii=False, indent=4)
            logger.info(f"Vector Mapping Saved: Successfully written to {MAPPING_PATH}")
            return os.path.relpath(MAPPING_PATH, BASE_DIR).replace("\\", "/")
        except Exception as e:
            logger.error(f"Failed to save vector mapping to disk: {str(e)}")
            raise RuntimeError(f"Failed to save vector mapping: {str(e)}") from e

    @classmethod
    def load_vector_mapping(cls) -> Dict[str, str]:
        """
        Loads the index-to-obligation-ID mapping from vector_mapping.json.
        """
        if not os.path.exists(MAPPING_PATH):
            logger.error(f"Vector mapping file missing at {MAPPING_PATH}.")
            raise FileNotFoundError(f"Vector mapping file not found at: {MAPPING_PATH}")

        try:
            with open(MAPPING_PATH, "r", encoding="utf-8") as f:
                mapping = json.load(f)
                if not isinstance(mapping, dict):
                    raise ValueError("Vector mapping content must be a dictionary.")
                return mapping
        except Exception as e:
            logger.error(f"Failed to read vector mapping: {str(e)}")
            raise RuntimeError(f"Failed to load vector mapping: {str(e)}") from e

    @classmethod
    def save_manifest(
        cls,
        embedding_model: str,
        vector_dimension: int,
        total_vectors: int,
        policies_indexed: List[str]
    ) -> str:
        """
        Saves or updates the index health manifest JSON.
        Tracks index metadata, dimensions, versioning, and indexed policy list.
        """
        os.makedirs(INDEX_DIR, exist_ok=True)

        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        # Define manifest structure
        manifest = {
            "index_version": "1.0",
            "embedding_model": embedding_model,
            "vector_dimension": vector_dimension,
            "total_vectors": total_vectors,
            "policies_indexed": policies_indexed,
            "created_at": now_str,
            "updated_at": now_str
        }

        # Keep original creation timestamp if it already exists
        if os.path.exists(MANIFEST_PATH):
            try:
                with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                    old_manifest = json.load(f)
                    if isinstance(old_manifest, dict) and "created_at" in old_manifest:
                        manifest["created_at"] = old_manifest["created_at"]
            except Exception:
                pass

        try:
            with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=4)
            logger.info(f"Manifest Saved: Successfully written to {MANIFEST_PATH}")
            return os.path.relpath(MANIFEST_PATH, BASE_DIR).replace("\\", "/")
        except Exception as e:
            logger.error(f"Failed to save manifest file: {str(e)}")
            raise RuntimeError(f"Failed to save manifest: {str(e)}") from e

    @classmethod
    def load_manifest(cls) -> Dict[str, Any]:
        """
        Loads the index health manifest from disk.
        """
        if not os.path.exists(MANIFEST_PATH):
            logger.error(f"Index manifest file missing at {MANIFEST_PATH}.")
            raise FileNotFoundError(f"Index manifest file not found at: {MANIFEST_PATH}")

        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
                if not isinstance(manifest, dict):
                    raise ValueError("Index manifest content must be a dictionary.")
                return manifest
        except Exception as e:
            logger.error(f"Failed to load manifest file: {str(e)}")
            raise RuntimeError(f"Failed to load manifest: {str(e)}") from e
