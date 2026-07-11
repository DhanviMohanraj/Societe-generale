import os
import json
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.services.metadata_service import get_or_create_policy_id

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REGISTRY_DIR = os.path.join(BASE_DIR, "outputs", "registry")
REGISTRY_PATH = os.path.join(REGISTRY_DIR, "registry.json")

os.makedirs(REGISTRY_DIR, exist_ok=True)

class RegistryService:
    @staticmethod
    def calculate_checksum(filepath: str) -> str:
        """Calculates the SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @classmethod
    def load_registry(cls) -> Dict[str, Any]:
        """Loads the registry from disk. Creates a new one if missing or corrupted."""
        if not os.path.exists(REGISTRY_PATH):
            logger.info("Registry file missing. Initializing new registry.")
            return cls.initialize_empty_registry()
        
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                registry = json.load(f)
                if not isinstance(registry, dict) or "policies" not in registry:
                    raise ValueError("Invalid registry structure.")
                logger.info("Registry Loaded successfully.")
                return registry
        except Exception as e:
            logger.warning(f"Registry corrupted or invalid ({e}). Re-initializing empty registry.")
            return cls.initialize_empty_registry()

    @classmethod
    def initialize_empty_registry(cls) -> Dict[str, Any]:
        """Creates an empty registry structure."""
        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        registry = {
            "repository_version": "1.0",
            "last_updated": now_str,
            "total_policies": 0,
            "policies": []
        }
        cls.save_registry(registry)
        return registry

    @classmethod
    def save_registry(cls, registry: Dict[str, Any]) -> None:
        """Saves the registry to disk."""
        try:
            with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
                json.dump(registry, f, ensure_ascii=False, indent=4)
            logger.info("Registry Updated and Repository Saved successfully.")
        except Exception as e:
            logger.error(f"Failed to save registry to disk: {str(e)}")
            raise e

    @classmethod
    def register_policy(cls, knowledge_filename: str) -> Dict[str, Any]:
        """
        Registers a new policy or updates an existing policy.
        knowledge_filename is the basename, e.g. 'password_policy_knowledge.json'
        or the full path. We will extract base_name.
        """
        # Resolve standardized names
        base_name = os.path.splitext(os.path.basename(knowledge_filename))[0]
        if base_name.endswith("_knowledge"):
            base_name = base_name[:-10]
        if base_name.endswith("_normalized"):
            base_name = base_name[:-11]

        pdf_filename = f"{base_name}.pdf"
        
        # Absolute paths for validation
        knowledge_abs = os.path.abspath(os.path.join(BASE_DIR, "outputs", "knowledge", f"{base_name}_knowledge.json"))
        normalized_abs = os.path.abspath(os.path.join(BASE_DIR, "outputs", "normalized_obligations", f"{base_name}_normalized.json"))
        text_abs = os.path.abspath(os.path.join(BASE_DIR, "outputs", "extracted_text", f"{base_name}.txt"))

        if not os.path.exists(knowledge_abs):
            raise FileNotFoundError(f"Knowledge file does not exist: {knowledge_abs}")
        
        # Calculate checksum and read contents
        checksum = cls.calculate_checksum(knowledge_abs)
        
        obligation_count = 0
        embedding_model = "BAAI/bge-small-en-v1.5"
        embedding_dimension = 384

        try:
            with open(knowledge_abs, "r", encoding="utf-8") as f:
                records = json.load(f)
                if isinstance(records, list) and len(records) > 0:
                    obligation_count = len(records)
                    first_record = records[0]
                    embedding_model = first_record.get("embedding_model", embedding_model)
                    embedding_dimension = first_record.get("embedding_dimension", embedding_dimension)
        except Exception as e:
            logger.warning(f"Could not read knowledge file {knowledge_abs} to count obligations: {e}")

        # Standard relative paths to store in registry
        knowledge_rel = os.path.relpath(knowledge_abs, BASE_DIR).replace("\\", "/")
        normalized_rel = os.path.relpath(normalized_abs, BASE_DIR).replace("\\", "/") if os.path.exists(normalized_abs) else f"outputs/normalized_obligations/{base_name}_normalized.json"
        text_rel = os.path.relpath(text_abs, BASE_DIR).replace("\\", "/") if os.path.exists(text_abs) else f"outputs/extracted_text/{base_name}.txt"

        # Retrieve/create Policy ID
        policy_id = get_or_create_policy_id(pdf_filename)

        registry = cls.load_registry()
        
        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        
        # Check if policy is already registered
        existing_policy = None
        for p in registry["policies"]:
            if p["policy_id"] == policy_id or p["policy_name"].lower() == pdf_filename.lower():
                existing_policy = p
                break

        if existing_policy:
            # Update existing
            existing_policy["knowledge_file"] = knowledge_rel
            existing_policy["normalized_file"] = normalized_rel
            existing_policy["text_file"] = text_rel
            existing_policy["embedding_model"] = embedding_model
            existing_policy["embedding_dimension"] = embedding_dimension
            existing_policy["obligation_count"] = obligation_count
            existing_policy["checksum"] = checksum
            existing_policy["updated_at"] = now_str
            existing_policy["status"] = "ACTIVE"  # Reactivate if it was deleted/archived
            logger.info(f"Policy {policy_id} Updated in registry.")
        else:
            # Create new
            new_policy = {
                "policy_id": policy_id,
                "policy_name": pdf_filename,
                "knowledge_file": knowledge_rel,
                "normalized_file": normalized_rel,
                "text_file": text_rel,
                "embedding_model": embedding_model,
                "embedding_dimension": embedding_dimension,
                "obligation_count": obligation_count,
                "created_at": now_str,
                "updated_at": now_str,
                "status": "ACTIVE",
                "checksum": checksum
            }
            registry["policies"].append(new_policy)
            logger.info(f"Policy Registered: {policy_id} ({pdf_filename})")

        # Update metadata
        registry["last_updated"] = now_str
        registry["total_policies"] = sum(1 for p in registry["policies"] if p["status"] in ("ACTIVE", "ARCHIVED"))
        
        cls.save_registry(registry)
        return existing_policy or registry["policies"][-1]

    @classmethod
    def remove_policy(cls, policy_id: str) -> bool:
        """Sets a policy's status to DELETED. Never physically deletes files."""
        return cls.update_status(policy_id, "DELETED")

    @classmethod
    def update_status(cls, policy_id: str, status: str) -> bool:
        """Updates a policy's status (ACTIVE, ARCHIVED, or DELETED)."""
        allowed = {"ACTIVE", "ARCHIVED", "DELETED"}
        if status not in allowed:
            raise ValueError(f"Invalid status: {status}. Must be one of {allowed}")

        registry = cls.load_registry()
        updated = False

        for p in registry["policies"]:
            if p["policy_id"] == policy_id:
                p["status"] = status
                p["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                updated = True
                logger.info(f"Policy {policy_id} status updated to {status}.")
                break

        if updated:
            registry["last_updated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            registry["total_policies"] = sum(1 for p in registry["policies"] if p["status"] in ("ACTIVE", "ARCHIVED"))
            cls.save_registry(registry)

        return updated

    @classmethod
    def rebuild_registry(cls) -> Dict[str, Any]:
        """Rebuilds the registry from outputs/knowledge/ directory."""
        logger.info("Starting Registry Rebuild from outputs/knowledge/")
        knowledge_dir = os.path.join(BASE_DIR, "outputs", "knowledge")
        
        # Reset registry to base
        registry = cls.initialize_empty_registry()
        
        if not os.path.exists(knowledge_dir):
            logger.warning("outputs/knowledge/ directory does not exist. Created empty registry.")
            return registry

        files = [f for f in os.listdir(knowledge_dir) if f.endswith("_knowledge.json")]
        
        for file in files:
            try:
                cls.register_policy(file)
            except Exception as e:
                logger.error(f"Failed to register policy file during rebuild: {file}. Error: {e}")

        # Reload updated registry to return
        return cls.load_registry()
