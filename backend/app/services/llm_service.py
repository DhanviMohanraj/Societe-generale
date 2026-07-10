import logging
from ollama import chat

logger = logging.getLogger(__name__)

def ask_llm(prompt: str) -> str:
    """
    Sends a prompt to the local Ollama instance running the qwen2.5:7b model
    and returns the text response content.
    
    Args:
        prompt (str): The prompt/input string to send to the model.
        
    Returns:
        str: The text response from the LLM.
        
    Raises:
        RuntimeError: If there is an error communicating with the Ollama service.
    """
    try:
        response = chat(
            model="qwen2.5:7b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        return response["message"]["content"]
    except Exception as e:
        logger.error(f"Error calling Ollama chat API: {e}")
        raise RuntimeError(f"Ollama integration error: {e}") from e
