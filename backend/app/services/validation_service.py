from pydantic import ValidationError
from app.schemas.obligation import Obligation

class ObligationValidationError(Exception):
    """Raised when obligation validation fails."""
    pass

def validate_obligations(raw_data: list[dict]) -> list[Obligation]:
    """
    Validates a list of raw dictionaries against the Obligation Pydantic model.
    Pre-processes data to replace missing or null string values with empty strings.
    If confidence is missing, null, or empty string, it defaults to 1.0.
    
    Args:
        raw_data (list[dict]): Raw obligations list.
        
    Returns:
        list[Obligation]: List of validated Obligation objects.
        
    Raises:
        ObligationValidationError: If any obligation fails Pydantic schema validation.
    """
    if not isinstance(raw_data, list):
        raise ObligationValidationError("Input data must be a JSON array (list).")

    validated_obligations = []

    for idx, item in enumerate(raw_data):
        if not isinstance(item, dict):
            raise ObligationValidationError(f"Obligation at index {idx} is not a valid object (dictionary).")

        cleaned = {}

        # 1. Normalize and clean string fields (replacing missing/null with empty string)
        string_fields = ["subject", "action", "object", "condition", "frequency", "strength", "topic"]
        for field in string_fields:
            val = item.get(field)
            if val is None:
                cleaned[field] = ""
            else:
                cleaned[field] = str(val).strip()

        # 2. Check and handle confidence explicitly
        confidence_val = item.get("confidence")
        
        # If confidence is missing, null, or empty string (often outputted by LLM when following "use empty string if unavailable"),
        # we default it to 1.0 (or another default) to maintain float data type integrity.
        if confidence_val is None or str(confidence_val).strip() == "":
            cleaned["confidence"] = 1.0
        else:
            try:
                cleaned["confidence"] = float(confidence_val)
            except (ValueError, TypeError) as e:
                raise ObligationValidationError(
                    f"Obligation at index {idx} has invalid 'confidence' value ({confidence_val}): must be a float. Error: {str(e)}"
                )

        # 3. Perform Pydantic Validation
        try:
            ob = Obligation(**cleaned)
            validated_obligations.append(ob)
        except ValidationError as e:
            raise ObligationValidationError(
                f"Pydantic validation failed for obligation at index {idx}. Details: {e.errors()}"
            ) from e

    return validated_obligations
