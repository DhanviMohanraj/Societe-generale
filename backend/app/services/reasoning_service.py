import json
import re
import logging
from app.services.llm_service import ask_llm

logger = logging.getLogger(__name__)

class ReasoningService:
    """
    Interacts with the local LLM via ask_llm to query Qwen2.5.
    Returns the parsed JSON response as a dictionary.
    Does not validate values or store output.
    """

    @classmethod
    def analyze_pair(cls, prompt: str) -> dict:
        """
        Sends comparison prompt to Qwen, strips potential markdown fences,
        parses the JSON output into a Python dictionary, and returns it.
        """
        logger.info("Reasoning Service: Calling Qwen2.5.")
        try:
            # Invokes the local Ollama Qwen2.5 chat wrapper
            response_text = ask_llm(prompt)
        except Exception as e:
            logger.error(f"Reasoning Service: Ollama invocation failed: {str(e)}")
            raise RuntimeError(f"Ollama/LLM communication failed: {str(e)}") from e

        # Strip standard markdown json block wrapping if LLM included it
        cleaned = response_text.strip()
        code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if code_block_match:
            cleaned = code_block_match.group(1).strip()

        try:
            decision_dict = json.loads(cleaned)
            logger.info("Reasoning Service: LLM response parsed successfully.")
            return decision_dict
        except Exception as e:
            logger.error(f"Reasoning Service: Failed to decode LLM JSON. Raw content: {response_text}. Error: {str(e)}")
            raise ValueError(f"Malformed JSON returned by LLM: {str(e)}") from e
