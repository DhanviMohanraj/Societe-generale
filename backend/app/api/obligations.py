import os
import logging
from fastapi import APIRouter, HTTPException, Query, status

from app.services import (
    pdf_service,
    text_service,
    obligation_service,
    validation_service,
    storage_service
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure local logging formatting if needed
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Upload directory reference
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

@router.post("/extract-obligations/{filename}", status_code=status.HTTP_200_OK)
def extract_obligations_route(
    filename: str,
    force: bool = Query(default=False, description="Force extraction and overwrite existing outputs.")
):
    """
    POST /extract-obligations/{filename}
    Runs the complete policy extraction workflow: reads uploaded PDF, cleans the text,
    queries the local Qwen LLM, validates output, and saves the output files locally.
    Uses caching unless force=True.
    """
    # 1. Sanitize filename to prevent directory traversal
    sanitized_filename = os.path.basename(filename)
    if sanitized_filename != filename or not filename.lower().endswith(".pdf"):
        logger.error(f"Invalid or unsafe filename requested: {filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename: Filename must be a simple PDF name without directory traversal paths."
        )

    # 2. Check if clean text and obligations outputs already exist (caching)
    if not force and storage_service.check_json_exists(sanitized_filename) and storage_service.check_text_exists(sanitized_filename):
        logger.info(f"Cached output found for {sanitized_filename}. Loading from disk.")
        try:
            cached_obligations = storage_service.load_json(sanitized_filename)
            text_path = storage_service.get_text_path(sanitized_filename)
            json_path = storage_service.get_json_path(sanitized_filename)
            
            # Form relative paths
            backend_dir = storage_service.BASE_DIR
            cleaned_text_file = os.path.relpath(text_path, backend_dir).replace("\\", "/")
            obligation_file = os.path.relpath(json_path, backend_dir).replace("\\", "/")

            logger.info("API Response Sent (Cached)")
            return {
                "policy": sanitized_filename,
                "cleaned_text_file": cleaned_text_file,
                "obligation_file": obligation_file,
                "obligations": cached_obligations
            }
        except Exception as e:
            logger.warning(f"Error loading cached files for {sanitized_filename}: {str(e)}. Proceeding with re-extraction.")

    # 3. Locate PDF
    pdf_path = os.path.join(UPLOADS_DIR, sanitized_filename)
    if not os.path.exists(pdf_path):
        logger.error(f"PDF file not found: {pdf_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The file '{sanitized_filename}' was not found in uploads. Please upload it first."
        )
    logger.info("PDF Loaded")

    # 4. Extract Text
    try:
        raw_text = pdf_service.extract_text(pdf_path)
        logger.info("Text Extracted")
    except pdf_service.PDFNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (pdf_service.PDFCorruptedError, pdf_service.PDFEmptyError, pdf_service.PDFEncryptedError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error extracting PDF text: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF extraction error: {str(e)}"
        )

    # 5. Clean Text
    cleaned_text = text_service.clean_text(raw_text)
    logger.info("Text Cleaned")

    # 6. Save Cleaned Text
    try:
        cleaned_text_rel_path = storage_service.save_clean_text(sanitized_filename, cleaned_text, overwrite=True)
        logger.info("Clean Text Saved")
    except Exception as e:
        logger.error(f"Error saving clean text output: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save cleaned text output: {str(e)}"
        )

    # 7. Generate Prompt & Call LLM
    logger.info("Prompt Generated")
    try:
        raw_obligations = obligation_service.extract_obligations(cleaned_text)
        logger.info("Qwen Response Received")
        logger.info("JSON Parsed")
    except obligation_service.ObligationExtractionError as e:
        logger.error(f"AI obligation extraction error: {str(e)}")
        if "timeout" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(e))
        if "ollama" in str(e).lower() or "communication" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error calling LLM: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM execution error: {str(e)}"
        )

    # 8. Validate Obligations JSON
    try:
        validated_obligations = validation_service.validate_obligations(raw_obligations)
        logger.info("Validation Passed")
    except validation_service.ObligationValidationError as e:
        logger.error(f"Obligation schema validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Schema validation error on LLM output: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation layer error: {str(e)}"
        )

    # 9. Save Obligations JSON
    try:
        # Convert Pydantic list to dictionary representation
        validated_dicts = [ob.model_dump() for ob in validated_obligations]
        obligations_json_rel_path = storage_service.save_json(sanitized_filename, validated_dicts, overwrite=True)
        logger.info("JSON Saved")
    except Exception as e:
        logger.error(f"Error saving obligations JSON output: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save obligations output: {str(e)}"
        )

    logger.info("API Response Sent")
    return {
        "policy": sanitized_filename,
        "cleaned_text_file": cleaned_text_rel_path,
        "obligation_file": obligations_json_rel_path,
        "obligations": validated_dicts
    }
