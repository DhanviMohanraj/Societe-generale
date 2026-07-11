import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Base directory setup relative to backend/ folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

class LoaderService:
    @staticmethod
    def resolve_absolute_path(relative_path: str) -> str:
        """Resolves a relative path to an absolute path within the workspace."""
        if not relative_path:
            return ""
        # If already absolute, return it
        if os.path.isabs(relative_path):
            return relative_path
        return os.path.abspath(os.path.join(BASE_DIR, relative_path))

    @classmethod
    def load_knowledge_file(cls, relative_path: str) -> List[Dict[str, Any]]:
        """Loads a knowledge JSON file and returns a list of dictionaries."""
        abs_path = cls.resolve_absolute_path(relative_path)
        logger.info(f"Loading knowledge file from: {abs_path}")
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Knowledge file not found at: {abs_path}")
        
        with open(abs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                raise ValueError("Knowledge JSON must be a list of records.")
            return data

    @classmethod
    def load_normalized_file(cls, relative_path: str) -> List[Dict[str, Any]]:
        """Loads a normalized JSON file and returns a list of dictionaries."""
        abs_path = cls.resolve_absolute_path(relative_path)
        logger.info(f"Loading normalized file from: {abs_path}")
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Normalized obligations file not found at: {abs_path}")
        
        with open(abs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                raise ValueError("Normalized JSON must be a list of obligations.")
            return data

    @classmethod
    def load_extracted_text(cls, relative_path: str) -> str:
        """Loads clean extracted text from the text file."""
        abs_path = cls.resolve_absolute_path(relative_path)
        logger.info(f"Loading extracted text file from: {abs_path}")
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Extracted text file not found at: {abs_path}")
        
        with open(abs_path, "r", encoding="utf-8") as f:
            return f.read()

    @classmethod
    def load_metadata_file(cls, relative_path: str) -> Dict[str, Any]:
        """Loads a metadata JSON file and returns a dictionary."""
        abs_path = cls.resolve_absolute_path(relative_path)
        logger.info(f"Loading metadata file from: {abs_path}")
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Metadata file not found at: {abs_path}")
        
        with open(abs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                raise ValueError("Metadata JSON must be a dictionary.")
            return data
