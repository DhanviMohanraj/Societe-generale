import re
import logging
from datetime import datetime, timezone
from typing import List

from app.schemas.knowledge_record import KnowledgeRecord
from app.services import embedding_service, metadata_service

logger = logging.getLogger(__name__)

def build_canonical_text(ob: dict) -> str:
    """
    Constructs a clean natural-language canonical sentence from normalized fields:
    Subject + Action + Object + Condition + [Every] Frequency
    """
    subject = str(ob.get("subject", "")).strip()
    action = str(ob.get("action", "")).strip()
    obj = str(ob.get("object", "")).strip()
    condition = str(ob.get("condition", "")).strip()
    frequency = str(ob.get("frequency", "")).strip()

    parts = []
    if subject:
        parts.append(subject)
    if action:
        parts.append(action)
    if obj:
        parts.append(obj)
    if condition:
        parts.append(condition)
        
    if frequency:
        # Standardize prefixing for the frequency string (e.g. Every 90 Days)
        if frequency.lower() in ["monthly", "yearly", "weekly", "daily", "quarterly"]:
            parts.append(frequency)
        else:
            if not any(frequency.lower().startswith(word) for word in ["every", "each", "for", "in", "at"]):
                parts.append(f"Every {frequency}")
            else:
                parts.append(frequency)

    sentence = " ".join(parts)
    # Remove any duplicate spaces
    sentence = re.sub(r"\s+", " ", sentence).strip()
    return sentence

def generate_knowledge_records(policy_name: str, normalized_obligations: List[dict]) -> List[dict]:
    """
    Assembles stable knowledge records for a policy.
    - Generates stable policy_id and obligation_ids.
    - Generates canonical sentences.
    - Batch generates normalized embeddings via SentenceTransformers.
    - Validates each record against the KnowledgeRecord Pydantic model.
    """
    logger.info("Knowledge generation started")
    
    # 1. Resolve or generate stable policy ID
    policy_id = metadata_service.get_or_create_policy_id(policy_name)
    
    # 2. Construct canonical sentences
    canonical_texts = []
    for ob in normalized_obligations:
        canon_text = build_canonical_text(ob)
        canonical_texts.append(canon_text)
    logger.info("Canonical sentence generated")

    # 3. Batch generate normalized embeddings
    embeddings = embedding_service.get_embeddings(canonical_texts)
    logger.info("Embedding generated")

    # 4. Assemble records
    records = []
    now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    for idx, ob in enumerate(normalized_obligations):
        canon_text = canonical_texts[idx]
        embedding_val = embeddings[idx]
        ob_id = f"OBL-{idx + 1:03d}"

        record_dict = {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "obligation_id": ob_id,
            "canonical_text": canon_text,
            "subject": ob.get("subject", ""),
            "action": ob.get("action", ""),
            "object": ob.get("object", ""),
            "condition": ob.get("condition", ""),
            "frequency": ob.get("frequency", ""),
            "strength": ob.get("strength", ""),
            "topic": ob.get("topic", ""),
            "confidence": float(ob.get("confidence", 1.0)),
            "embedding": embedding_val,
            "embedding_dimension": 384,
            "embedding_model": "BAAI/bge-small-en-v1.5",
            "created_at": now_str
        }

        # 5. Schema Validation
        try:
            KnowledgeRecord(**record_dict)
            logger.info("Knowledge record created")
        except Exception as e:
            logger.error(f"Pydantic validation failed for KnowledgeRecord at index {idx}: {str(e)}")
            raise ValueError(f"Knowledge record validation failed: {str(e)}") from e

        records.append(record_dict)

    return records
