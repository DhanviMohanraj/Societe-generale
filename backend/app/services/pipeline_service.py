import os
import logging
import traceback
import threading
import numpy as np
from typing import Dict, Any, List

# Import services
from app.services import (
    pdf_service,
    text_service,
    obligation_service,
    validation_service,
    storage_service,
    normalization_service,
    knowledge_service,
    metadata_service
)
from app.services.registry_service import RegistryService
from app.services.repository_loader import RepositoryLoader
from app.services.faiss_service import FAISSService
from app.services.index_manifest_service import IndexManifestService
from app.services.similarity_service import SimilarityService
from app.services.semantic_match_service import SemanticMatchService
from app.services.analysis_service import AnalysisService
from app.services.graph_builder import GraphBuilder
from app.services.governance_snapshot_service import GovernanceSnapshotService
from app.services.analytics_repository import AnalyticsRepository

logger = logging.getLogger(__name__)

class PipelineProgressTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self._state = {
            "current_step": "Idle",
            "completed": 0,
            "total": 8,
            "percentage": 0,
            "error": None
        }

    def update(self, current_step: str, completed: int, total: int = 8, error: str = None):
        with self._lock:
            self._state = {
                "current_step": current_step,
                "completed": completed,
                "total": total,
                "percentage": int((completed / total) * 100) if total > 0 else 0,
                "error": error
            }

    def get_progress(self) -> dict:
        with self._lock:
            return self._state.copy()

# Global tracker instance
progress_tracker = PipelineProgressTracker()

class PipelineService:
    """
    Orchestration service that runs the end-to-end policy processing pipeline sequentially.
    """

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """
        Retrieves the current pipeline progress state from memory.
        """
        return progress_tracker.get_progress()

    @classmethod
    def run_pipeline(cls, filename: str) -> Dict[str, Any]:
        """
        Executes all modules sequentially without calling HTTP endpoints.
        Updates progress in memory. On failure, stops immediately and raises an error.
        """
        # Ensure name is properly formatted
        if not filename.lower().endswith(".pdf"):
            filename = f"{filename}.pdf"
        sanitized_filename = os.path.basename(filename)

        base_name = os.path.splitext(sanitized_filename)[0]
        if base_name.endswith("_normalized"):
            base_name = base_name[:-11]
        elif base_name.endswith("_knowledge"):
            base_name = base_name[:-10]

        pdf_filename = f"{base_name}.pdf"
        json_filename = f"{base_name}.json"

        uploads_dir = os.path.abspath(os.path.join(storage_service.BASE_DIR, "uploads"))
        sample_policies_dir = os.path.abspath(os.path.join(storage_service.BASE_DIR, "sample_policies"))

        logger.info(f"Pipeline started for: {pdf_filename}")
        
        # Reset progress tracker
        progress_tracker.update("Idle", 0)

        # ----------------------------------------------------
        # STEP 1: Extraction
        # ----------------------------------------------------
        current_step = "Extraction"
        progress_tracker.update(current_step, 0)
        logger.info(f"Pipeline Step 1/8: Starting {current_step}")
        try:
            # Locate PDF
            pdf_path = os.path.join(uploads_dir, pdf_filename)
            if not os.path.exists(pdf_path):
                sample_path = os.path.join(sample_policies_dir, pdf_filename)
                if os.path.exists(sample_path):
                    pdf_path = sample_path
                else:
                    raise FileNotFoundError(f"PDF file '{pdf_filename}' not found in uploads or sample_policies.")

            # Extract raw text
            raw_text = pdf_service.extract_text(pdf_path)
            
            # Clean text
            cleaned_text = text_service.clean_text(raw_text)
            storage_service.save_clean_text(pdf_filename, cleaned_text, overwrite=True)

            # LLM extraction
            raw_obligations = obligation_service.extract_obligations(cleaned_text)

            # Validate schema
            validated_obligations = validation_service.validate_obligations(raw_obligations)
            validated_dicts = [ob.model_dump() for ob in validated_obligations]
            storage_service.save_json(pdf_filename, validated_dicts, overwrite=True)

            logger.info("Pipeline Step 1/8: Extraction complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 0, error=str(e))
            raise RuntimeError(f"Extraction failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 2: Normalization
        # ----------------------------------------------------
        current_step = "Normalization"
        progress_tracker.update(current_step, 1)
        logger.info(f"Pipeline Step 2/8: Starting {current_step}")
        try:
            normalized_obligations = normalization_service.normalize_obligations(validated_dicts)
            storage_service.save_normalized_json(json_filename, normalized_obligations, overwrite=True)
            logger.info("Pipeline Step 2/8: Normalization complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 1, error=str(e))
            raise RuntimeError(f"Normalization failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 3: Vectorization (Knowledge Records)
        # ----------------------------------------------------
        current_step = "Vectorization"
        progress_tracker.update(current_step, 2)
        logger.info(f"Pipeline Step 3/8: Starting {current_step}")
        try:
            knowledge_records = knowledge_service.generate_knowledge_records(pdf_filename, normalized_obligations)
            knowledge_file_rel = storage_service.save_knowledge_json(base_name, knowledge_records, overwrite=True)
            
            # Update metadata repository
            metadata_service.save_policy_metadata(
                policy_name=pdf_filename,
                obligation_count=len(knowledge_records),
                knowledge_file=knowledge_file_rel
            )
            logger.info("Pipeline Step 3/8: Vectorization complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 2, error=str(e))
            raise RuntimeError(f"Vectorization failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 4: Repository (Registry Rebuilding)
        # ----------------------------------------------------
        current_step = "Repository"
        progress_tracker.update(current_step, 3)
        logger.info(f"Pipeline Step 4/8: Starting {current_step}")
        try:
            RegistryService.rebuild_registry()
            logger.info("Pipeline Step 4/8: Registry Rebuild complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 3, error=str(e))
            raise RuntimeError(f"Repository registration failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 5: Similarity (FAISS Index & Matches)
        # ----------------------------------------------------
        current_step = "Similarity"
        progress_tracker.update(current_step, 4)
        logger.info(f"Pipeline Step 5/8: Starting {current_step}")
        try:
            records = RepositoryLoader.load_knowledge_records()
            if not records:
                raise ValueError("Repository contains no active knowledge records to build index.")

            first_model = records[0].embedding_model
            first_dim = records[0].embedding_dimension

            # Verify and assemble numpy array
            embeddings_arr = np.array([r.embedding for r in records], dtype=np.float32)

            # Build and save FAISS index
            index = FAISSService.build_index(embeddings_arr)
            FAISSService.save_index(index)

            # Save mapping and manifest
            mapping = {str(idx): f"{r.policy_id}:{r.obligation_id}" for idx, r in enumerate(records)}
            IndexManifestService.save_vector_mapping(mapping)
            
            policies_indexed = sorted(list(set(r.policy_id for r in records)))
            IndexManifestService.save_manifest(
                embedding_model=first_model,
                vector_dimension=first_dim,
                total_vectors=len(records),
                policies_indexed=policies_indexed
            )

            # Find matches
            matches = SimilarityService.find_similar_obligations(
                records=records,
                top_k=5,
                threshold=0.80
            )
            SemanticMatchService.save_candidate_matches(matches)
            logger.info("Pipeline Step 5/8: Similarity indexing complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 4, error=str(e))
            raise RuntimeError(f"Similarity index build failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 6: Analysis (AI Reasoning Comparison)
        # ----------------------------------------------------
        current_step = "Analysis"
        progress_tracker.update(current_step, 5)
        logger.info(f"Pipeline Step 6/8: Starting {current_step}")
        try:
            # Execute LLM comparison reasoning over new candidates
            AnalysisService.run_analysis(force=True)
            logger.info("Pipeline Step 6/8: AI Analysis complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 5, error=str(e))
            raise RuntimeError(f"AI Analysis failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 7: Knowledge Graph (Entity Relationship Graph)
        # ----------------------------------------------------
        current_step = "Knowledge Graph"
        progress_tracker.update(current_step, 6)
        logger.info(f"Pipeline Step 7/8: Starting {current_step}")
        try:
            GraphBuilder.build_graph_pipeline()
            logger.info("Pipeline Step 7/8: Knowledge Graph complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 6, error=str(e))
            raise RuntimeError(f"Knowledge Graph compilation failed: {str(e)}") from e

        # ----------------------------------------------------
        # STEP 8: Governance (Analytics Compilation)
        # ----------------------------------------------------
        current_step = "Governance"
        progress_tracker.update(current_step, 7)
        logger.info(f"Pipeline Step 8/8: Starting {current_step}")
        try:
            snapshot_data = GovernanceSnapshotService.compile_governance_snapshot()
            logger.info("Pipeline Step 8/8: Governance snapshot complete.")
        except Exception as e:
            logger.error(f"Pipeline failed at {current_step}: {str(e)}\n{traceback.format_exc()}")
            progress_tracker.update(f"Failed at {current_step}", 7, error=str(e))
            raise RuntimeError(f"Governance compilation failed: {str(e)}") from e

        # Mark as completely finished
        progress_tracker.update("Completed", 8)
        
        # Return summary matching the requirement
        return {
            "status": "completed",
            "policy": pdf_filename,
            "processed_modules": [
                "Extraction",
                "Normalization",
                "Vectorization",
                "Repository",
                "Similarity",
                "Analysis",
                "Knowledge Graph",
                "Governance"
            ],
            "governance_score": snapshot_data.get("overall_governance_score", 100),
            "risk_level": snapshot_data.get("overall_risk_level", "LOW")
        }
