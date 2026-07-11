import re
import logging
from app.schemas.normalized_obligation import NormalizedObligation
from app.services.canonicalization_service import (
    map_value,
    ACTION_MAP,
    SUBJECT_MAP,
    OBJECT_MAP,
    FREQUENCY_MAP,
    STRENGTH_MAP,
    TOPIC_MAP
)

logger = logging.getLogger(__name__)

# Update the action map to also explicitly include negation examples for direct lookup mapping
ACTION_MAP.update({
    "not be shared": "Share",
    "never be shared": "Share",
    "must not rotate": "Rotate",
    "shall not rotate": "Rotate",
    "shall not require periodic password rotation": "Rotate",
    "require periodic password rotation": "Rotate",
    "periodic password rotation": "Rotate",
})

NEGATION_KEYWORDS = ["not", "never", "no", "shall not", "must not", "prohibited", "forbidden"]

def has_negation(text: str) -> bool:
    """Helper to detect if negation keywords are present in raw text."""
    if not text:
        return False
    t = str(text).strip().lower()
    for keyword in NEGATION_KEYWORDS:
        # Match as word boundary or exact match
        if re.search(r'\b' + re.escape(keyword) + r'\b', t) or keyword in t:
            return True
    return False

def clean_negation_from_action(action: str) -> str:
    """Removes negation phrases from the action verb string."""
    act = str(action).strip().lower()
    negation_phrases = [
        "shall not require", "must not require", "shall not", "must not", 
        "prohibited from", "prohibited", "forbidden", "not be", "not", "never be", "never"
    ]
    for phrase in negation_phrases:
        if phrase in act:
            act = act.replace(phrase, "").strip()
            
    # Clean up duplicate whitespace
    act = re.sub(r"\s+", " ", act).strip()
    return act

def normalize_single_obligation(raw: dict) -> dict:
    """Normalizes fields of a single raw obligation to their canonical format."""
    raw_subject = raw.get("subject", "")
    raw_action = raw.get("action", "")
    raw_object = raw.get("object", "")
    raw_condition = raw.get("condition", "")
    raw_frequency = raw.get("frequency", "")
    raw_strength = raw.get("strength", "")
    raw_topic = raw.get("topic", "")
    raw_confidence = raw.get("confidence", 1.0)

    # Detect subject-level negation (e.g. "No employee" or "No user")
    subject_negated = False
    cleaned_subject = str(raw_subject).strip()
    if cleaned_subject.lower().startswith("no "):
        subject_negated = True
        cleaned_subject = cleaned_subject[3:].strip()

    # 1. Negation detection across subject, action, or strength
    is_negated = has_negation(raw_action) or has_negation(raw_strength) or subject_negated

    # 2. Action and Strength Normalization
    if is_negated:
        strength_norm = "Prohibited"
        cleaned_action = clean_negation_from_action(raw_action)
        action_norm = map_value(cleaned_action, ACTION_MAP)
    else:
        action_norm = map_value(raw_action, ACTION_MAP)
        strength_norm = map_value(raw_strength, STRENGTH_MAP)
        
        # Fallback to Mandatory if strength mapping resulted in empty or non-standard string
        if strength_norm not in {"Mandatory", "Recommended", "Optional", "Prohibited"}:
            strength_norm = "Mandatory"

    # 3. Normalize all other fields using canonical dictionaries
    subject_norm = map_value(cleaned_subject, SUBJECT_MAP)
    object_norm = map_value(raw_object, OBJECT_MAP)
    frequency_norm = map_value(raw_frequency, FREQUENCY_MAP)
    topic_norm = map_value(raw_topic, TOPIC_MAP)
    condition_norm = str(raw_condition).strip()

    try:
        confidence_norm = float(raw_confidence)
    except (TypeError, ValueError):
        confidence_norm = 1.0

    return {
        "subject": subject_norm,
        "action": action_norm,
        "object": object_norm,
        "condition": condition_norm,
        "frequency": frequency_norm,
        "strength": strength_norm,
        "topic": topic_norm,
        "confidence": confidence_norm
    }

def normalize_obligations(raw_data: list[dict]) -> list[dict]:
    """
    Normalizes a list of obligations. Validates each element against the
    NormalizedObligation schema and logs progress.
    """
    logger.info("Normalization Started")
    normalized_list = []
    
    for idx, item in enumerate(raw_data):
        norm_item = normalize_single_obligation(item)
        
        # Validate the schema
        try:
            # We construct NormalizedObligation to run Pydantic validators
            NormalizedObligation(**norm_item)
        except Exception as e:
            logger.error(f"Validation failed for normalized obligation at index {idx}: {str(e)}")
            raise ValueError(f"Normalized obligation validation failed: {str(e)}") from e
            
        normalized_list.append(norm_item)
        
    logger.info("Actions Normalized")
    logger.info("Subjects Normalized")
    logger.info("Objects Normalized")
    logger.info("Validation Passed")
    
    return normalized_list
