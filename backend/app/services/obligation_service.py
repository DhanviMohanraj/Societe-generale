import json
import re
from app.services.llm_service import ask_llm
from app.utils.prompts import EXTRACT_OBLIGATION_PROMPT

class ObligationExtractionError(Exception):
    """Raised when there is an issue during LLM obligation extraction or JSON parsing."""
    pass

def extract_obligations(text: str) -> list[dict]:
    """
    Takes cleaned policy text, appends the extraction prompt, calls the LLM,
    extracts the JSON output, and returns it as a list of raw dicts.
    
    Args:
        text (str): Cleaned policy document text.
        
    Returns:
        list[dict]: Unvalidated list of obligations.
        
    Raises:
        ObligationExtractionError: If the LLM call fails or the output cannot be parsed into a JSON list.
    """
    # 1. Generate final prompt
    final_prompt = f"{text}\n\n{EXTRACT_OBLIGATION_PROMPT}"

    # 2. Call LLM
    try:
        response_text = ask_llm(final_prompt)
    except Exception as e:
        raise ObligationExtractionError(f"Error calling LLM: {str(e)}") from e

    # 3. Clean and parse JSON response (handling potential markdown code fences)
    try:
        # Strip potential markdown json code blocks (e.g. ```json ... ```)
        code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", response_text, re.DOTALL)
        if code_block_match:
            json_str = code_block_match.group(1).strip()
        else:
            json_str = response_text.strip()

        # Parse JSON
        parsed = json.loads(json_str)

        # Ensure the parsed output is a list. If not, try to search for standard list keys.
        if not isinstance(parsed, list):
            if isinstance(parsed, dict):
                for key in ["obligations", "data", "results", "obligations_list"]:
                    if key in parsed and isinstance(parsed[key], list):
                        return parsed[key]
            raise ValueError("LLM response did not contain a JSON array/list.")

        return parsed
    except Exception as e:
        raise ObligationExtractionError(
            f"Failed to parse LLM response as JSON. Error: {str(e)}. Raw response content: {response_text}"
        ) from e
