import re
import unicodedata

def clean_text(text: str) -> str:
    """
    Prepares raw text for LLM processing by normalizing unicode, spaces, tabs,
    and spacing, while removing duplicates and broken formatting.
    
    Args:
        text (str): Raw extracted text.
        
    Returns:
        str: Cleaned and normalized text.
    """
    if not text:
        return ""

    # 1. Normalize unicode characters (NFKC format)
    text = unicodedata.normalize("NFKC", text)

    # 2. Convert tabs to spaces
    text = text.replace("\t", " ")

    # 3. Standardize carriage returns to newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 4. Clean up lines (remove trailing spaces, duplicate spaces, and remove empty lines)
    lines = []
    for line in text.split("\n"):
        # Replace multiple spaces with a single space
        cleaned_line = re.sub(r"\s+", " ", line).strip()
        if cleaned_line:  # Skip empty lines
            lines.append(cleaned_line)

    # 5. Rejoin with single newlines
    return "\n".join(lines)
