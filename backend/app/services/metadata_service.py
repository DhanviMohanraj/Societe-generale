import os
import json
from datetime import datetime, timezone

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
METADATA_DIR = os.path.join(BASE_DIR, "outputs", "metadata")
REGISTRY_PATH = os.path.join(METADATA_DIR, "registry.json")

# Ensure directory is created automatically on load
os.makedirs(METADATA_DIR, exist_ok=True)

def _load_registry() -> dict:
    if not os.path.exists(REGISTRY_PATH):
        return {}
    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_registry(registry: dict):
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=4)

def get_or_create_policy_id(policy_name: str) -> str:
    """
    Retrieves the policy_id if it exists, or creates the next stable
    sequential ID (e.g. POL-001) if it is new.
    """
    registry = _load_registry()
    policy_key = policy_name.lower().strip()

    # Match based on case-insensitive policy name
    for key, data in registry.items():
        if key == policy_key or data.get("policy_name", "").lower() == policy_key:
            return data["policy_id"]

    # Generate next sequential ID
    count = len(registry)
    new_id = f"POL-{count + 1:03d}"

    # Reserve the ID in registry
    now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    registry[policy_key] = {
        "policy_id": new_id,
        "policy_name": policy_name,
        "created_at": now_str
    }
    _save_registry(registry)
    return new_id

def save_policy_metadata(
    policy_name: str,
    obligation_count: int,
    knowledge_file: str,
    embedding_model: str = "BAAI/bge-small-en-v1.5",
    embedding_dimension: int = 384
) -> dict:
    """
    Saves policy metadata records, updating both the shared master registry
    and writing a standalone policy metadata file for modular consumption.
    """
    policy_id = get_or_create_policy_id(policy_name)
    registry = _load_registry()
    
    policy_key = policy_name.lower().strip()
    entry = registry.get(policy_key, {})

    now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    created_at = entry.get("created_at", now_str)

    metadata = {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "obligation_count": obligation_count,
        "embedding_model": embedding_model,
        "embedding_dimension": embedding_dimension,
        "knowledge_file": knowledge_file,
        "created_at": created_at,
        "updated_at": now_str
    }

    # Save to master registry
    registry[policy_key] = metadata
    _save_registry(registry)

    # Save to standalone policy metadata file
    base_name = os.path.splitext(policy_name)[0]
    meta_file = os.path.join(METADATA_DIR, f"{base_name}_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=4)

    return metadata
