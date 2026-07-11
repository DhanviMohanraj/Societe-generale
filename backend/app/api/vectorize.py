import os
import logging
from fastapi import APIRouter, HTTPException, Query, status
from app.services import storage_service, knowledge_service, metadata_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure logging formatting
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@router.post("/vectorize/{filename:path}", status_code=status.HTTP_200_OK)
def vectorize_obligations_route(
    filename: str,
    force: bool = Query(default=False, description="Force vectorization and overwrite existing knowledge outputs.")
):
    """
    POST /vectorize/{filename}
    Reads the normalized obligations, generates natural canonical sentences,
    computes BGE embedding vectors locally, saves the knowledge records,
    updates metadata, and returns a summary.
    """
    # 1. Resolve standardized names
    base_name = os.path.splitext(os.path.basename(filename))[0]
    if base_name.endswith("_normalized"):
        base_name = base_name[:-11]
    if base_name.endswith("_knowledge"):
        base_name = base_name[:-10]

    normalized_filename = f"{base_name}_normalized.json"
    pdf_filename = f"{base_name}.pdf"

    # 2. Check cache if force=False
    if not force and storage_service.check_knowledge_exists(base_name):
        logger.info(f"Cached knowledge file found for {base_name}. Loading from disk.")
        try:
            cached_knowledge = storage_service.load_knowledge_json(base_name)
            policy_id = metadata_service.get_or_create_policy_id(pdf_filename)
            knowledge_path = storage_service.get_knowledge_path(base_name)
            
            # Format relative path
            backend_dir = storage_service.BASE_DIR
            knowledge_file_rel = os.path.relpath(knowledge_path, backend_dir).replace("\\", "/")

            logger.info("API Response Sent (Cached)")
            return {
                "policy_id": policy_id,
                "policy_name": pdf_filename,
                "knowledge_file": knowledge_file_rel,
                "embedding_model": "BAAI/bge-small-en-v1.5",
                "embedding_dimension": 384,
                "total_obligations": len(cached_knowledge),
                "status": "completed"
            }
        except Exception as e:
            logger.warning(f"Error loading cached knowledge file for {base_name}: {str(e)}. Proceeding with re-vectorization.")

    # 3. Read normalized JSON
    try:
        normalized_obligations = storage_service.load_normalized_json(normalized_filename)
    except FileNotFoundError:
        logger.error(f"Normalized obligations file not found: {normalized_filename}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The normalized obligations file '{normalized_filename}' was not found. Please run normalization first."
        )
    except Exception as e:
        logger.error(f"Unexpected error loading normalized obligations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read normalized obligations file: {str(e)}"
        )

    # 4. Generate Knowledge Records and Embeddings
    try:
        knowledge_records = knowledge_service.generate_knowledge_records(pdf_filename, normalized_obligations)
    except ValueError as e:
        logger.error(f"Validation failure during vectorization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Knowledge record validation failed: {str(e)}"
        )
    except RuntimeError as e:
        logger.error(f"Runtime error in embedding service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Embedding service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected vectorization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vectorization failed: {str(e)}"
        )

    # 5. Persist knowledge records
    try:
        knowledge_file_rel = storage_service.save_knowledge_json(base_name, knowledge_records, overwrite=True)
        logger.info("Knowledge file saved")
    except Exception as e:
        logger.error(f"Failed to save knowledge records output: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage error saving knowledge output: {str(e)}"
        )

    # 6. Update metadata
    try:
        metadata = metadata_service.save_policy_metadata(
            policy_name=pdf_filename,
            obligation_count=len(knowledge_records),
            knowledge_file=knowledge_file_rel
        )
        logger.info("Metadata updated")
    except Exception as e:
        logger.error(f"Failed to update policy metadata: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update metadata records: {str(e)}"
        )

    logger.info("Completed")
    return {
        "policy_id": metadata["policy_id"],
        "policy_name": pdf_filename,
        "knowledge_file": knowledge_file_rel,
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "embedding_dimension": 384,
        "total_obligations": len(knowledge_records),
        "status": "completed"
    }
