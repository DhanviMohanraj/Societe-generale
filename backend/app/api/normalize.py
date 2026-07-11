import os
import logging
from fastapi import APIRouter, HTTPException, Query, status
from app.services import storage_service, normalization_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure logging formatting
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@router.post("/normalize/{filename:path}", status_code=status.HTTP_200_OK)
def normalize_obligations_route(
    filename: str,
    force: bool = Query(default=False, description="Force normalization and overwrite existing output.")
):
    """
    POST /normalize/{filename}
    Reads the extracted JSON obligations file, normalizes every field to its canonical
    representation, validates it using Pydantic, saves, and returns the normalized JSON.
    """
    # 1. Resolve filenames
    base_name = os.path.splitext(os.path.basename(filename))[0]
    # Remove any trailing "_normalized" if the user passed it in the path
    if base_name.endswith("_normalized"):
        base_name = base_name[:-11]

    json_filename = f"{base_name}.json"
    pdf_filename = f"{base_name}.pdf"

    # 2. Check if normalized output already exists (caching)
    if not force and storage_service.check_normalized_json_exists(json_filename):
        logger.info(f"Cached normalized output found for {json_filename}. Loading from disk.")
        try:
            cached_normalized = storage_service.load_normalized_json(json_filename)
            normalized_path = storage_service.get_normalized_path(json_filename)
            
            # Form relative path
            backend_dir = storage_service.BASE_DIR
            normalized_file_rel = os.path.relpath(normalized_path, backend_dir).replace("\\", "/")

            logger.info("API Response Sent (Cached)")
            return {
                "policy": pdf_filename,
                "normalized_file": normalized_file_rel,
                "obligations": cached_normalized
            }
        except Exception as e:
            logger.warning(f"Error loading cached normalized file for {json_filename}: {str(e)}. Proceeding with re-normalization.")

    # 3. Load the extracted raw obligations JSON file
    try:
        raw_obligations = storage_service.load_json(json_filename)
        logger.info("JSON Loaded")
    except FileNotFoundError:
        logger.error(f"Extracted JSON obligations file not found: {json_filename}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The extracted obligations file '{json_filename}' was not found. Please run obligation extraction first."
        )
    except Exception as e:
        logger.error(f"Unexpected error loading JSON file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read raw obligations file: {str(e)}"
        )

    # 4. Normalize fields & Validate using Pydantic
    try:
        normalized_obligations = normalization_service.normalize_obligations(raw_obligations)
    except ValueError as e:
        logger.error(f"Validation failure during normalization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Obligation normalization failed validation: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected normalization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected normalization error: {str(e)}"
        )

    # 5. Save normalized JSON output
    try:
        normalized_file_rel = storage_service.save_normalized_json(json_filename, normalized_obligations, overwrite=True)
        logger.info("JSON Saved")
    except Exception as e:
        logger.error(f"Error saving normalized JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save normalized output to disk: {str(e)}"
        )

    return {
        "policy": pdf_filename,
        "normalized_file": normalized_file_rel,
        "obligations": normalized_obligations
    }
