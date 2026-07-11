import os
import json

# Setup output paths relative to the backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
TEXT_DIR = os.path.join(OUTPUTS_DIR, "extracted_text")
JSON_DIR = os.path.join(OUTPUTS_DIR, "obligations")
NORMALIZED_DIR = os.path.join(OUTPUTS_DIR, "normalized_obligations")
KNOWLEDGE_DIR = os.path.join(OUTPUTS_DIR, "knowledge")

# Auto-create the outputs structure on module load
os.makedirs(TEXT_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)
os.makedirs(NORMALIZED_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

def get_text_path(filename: str) -> str:
    """Returns the absolute path for the extracted text file."""
    base_name = os.path.splitext(filename)[0]
    return os.path.join(TEXT_DIR, f"{base_name}.txt")

def get_json_path(filename: str) -> str:
    """Returns the absolute path for the obligation JSON file."""
    base_name = os.path.splitext(filename)[0]
    return os.path.join(JSON_DIR, f"{base_name}.json")

def check_text_exists(filename: str) -> bool:
    """Checks if the cleaned text file already exists."""
    return os.path.exists(get_text_path(filename))

def check_json_exists(filename: str) -> bool:
    """Checks if the obligation JSON file already exists."""
    return os.path.exists(get_json_path(filename))

def save_clean_text(filename: str, text: str, overwrite: bool = False) -> str:
    """
    Saves cleaned text to outputs/extracted_text/{filename}.txt
    
    Returns:
        str: Relative path to the saved file from the backend/ directory.
    """
    path = get_text_path(filename)
    if os.path.exists(path) and not overwrite:
        raise FileExistsError(f"Cleaned text output already exists: {path}")
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
        
    return os.path.relpath(path, BASE_DIR).replace("\\", "/")

def save_json(filename: str, data: list[dict], overwrite: bool = False) -> str:
    """
    Saves parsed JSON list of obligations to outputs/obligations/{filename}.json
    
    Returns:
        str: Relative path to the saved file from the backend/ directory.
    """
    path = get_json_path(filename)
    if os.path.exists(path) and not overwrite:
        raise FileExistsError(f"JSON obligation output already exists: {path}")
        
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    return os.path.relpath(path, BASE_DIR).replace("\\", "/")

def load_clean_text(filename: str) -> str:
    """Loads cleaned text content from output storage."""
    path = get_text_path(filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Cleaned text file not found: {path}")
        
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def load_json(filename: str) -> list[dict]:
    """Loads obligation JSON content from output storage."""
    path = get_json_path(filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Obligation JSON file not found: {path}")
        
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_normalized_path(filename: str) -> str:
    """Returns the absolute path for the normalized obligation JSON file."""
    base_name = os.path.splitext(filename)[0]
    # Handle both .pdf or .json input names
    if base_name.endswith("_normalized"):
        return os.path.join(NORMALIZED_DIR, f"{base_name}.json")
    return os.path.join(NORMALIZED_DIR, f"{base_name}_normalized.json")

def check_normalized_json_exists(filename: str) -> bool:
    """Checks if the normalized obligation JSON file already exists."""
    return os.path.exists(get_normalized_path(filename))

def save_normalized_json(filename: str, data: list[dict], overwrite: bool = False) -> str:
    """
    Saves parsed JSON list of normalized obligations to outputs/normalized_obligations/{filename}_normalized.json
    
    Returns:
        str: Relative path to the saved file from the backend/ directory.
    """
    path = get_normalized_path(filename)
    if os.path.exists(path) and not overwrite:
        raise FileExistsError(f"Normalized JSON obligation output already exists: {path}")
        
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    return os.path.relpath(path, BASE_DIR).replace("\\", "/")

def load_normalized_json(filename: str) -> list[dict]:
    """Loads normalized obligation JSON content from output storage."""
    path = get_normalized_path(filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Normalized obligation JSON file not found: {path}")
        
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_knowledge_path(filename: str) -> str:
    """Returns the absolute path for the knowledge JSON file."""
    base_name = os.path.splitext(filename)[0]
    # Strip any "_normalized" or "_knowledge" if already present
    if base_name.endswith("_normalized"):
        base_name = base_name[:-11]
    if base_name.endswith("_knowledge"):
        base_name = base_name[:-10]
    return os.path.join(KNOWLEDGE_DIR, f"{base_name}_knowledge.json")

def check_knowledge_exists(filename: str) -> bool:
    """Checks if the knowledge JSON file already exists."""
    return os.path.exists(get_knowledge_path(filename))

def save_knowledge_json(filename: str, data: list[dict], overwrite: bool = False) -> str:
    """
    Saves parsed JSON list of knowledge records to outputs/knowledge/{filename}_knowledge.json
    
    Returns:
        str: Relative path to the saved file from the backend/ directory.
    """
    path = get_knowledge_path(filename)
    if os.path.exists(path) and not overwrite:
        raise FileExistsError(f"Knowledge JSON output already exists: {path}")
        
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    return os.path.relpath(path, BASE_DIR).replace("\\", "/")

def load_knowledge_json(filename: str) -> list[dict]:
    """Loads knowledge JSON content from output storage."""
    path = get_knowledge_path(filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Knowledge JSON file not found: {path}")
        
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
