import logging
import numpy as np
from typing import List
from app.schemas.knowledge_record import KnowledgeRecord
from app.schemas.semantic_match import SemanticMatch
from app.services.faiss_service import FAISSService
from app.services.index_manifest_service import IndexManifestService
from app.services.semantic_match_service import SemanticMatchService

logger = logging.getLogger(__name__)

class SimilarityService:
    """
    Orchestrates business logic for finding semantically similar obligations.
    Queries the FAISS index, filters by threshold, removes self-matches and duplicate match pairs.
    """

    @classmethod
    def find_similar_obligations(
        cls,
        records: List[KnowledgeRecord],
        top_k: int = 5,
        threshold: float = 0.80
    ) -> List[SemanticMatch]:
        """
        Executes search using query embeddings constructed from the input records list.
        Filters candidate matches and constructs SemanticMatch records.
        """
        logger.info("Similarity Service: Similarity Search Started.")

        if not records:
            logger.warning("Similarity Service: No records provided. Returning empty list.")
            return []

        # 1. Load FAISS index and vector mapping metadata
        try:
            index = FAISSService.load_index()
            mapping = IndexManifestService.load_vector_mapping()
        except FileNotFoundError as e:
            logger.error(f"Similarity Service: Missing index files: {str(e)}")
            raise RuntimeError("FAISS index or vector mapping is missing. Please build the index first.") from e
        except Exception as e:
            logger.error(f"Similarity Service: Failed to initialize FAISS query environment: {str(e)}")
            raise RuntimeError(f"Failed to load FAISS query environment: {str(e)}") from e

        # 2. Extract embeddings matrix for query (size N x D)
        embeddings = np.array([r.embedding for r in records], dtype=np.float32)

        # 3. Query FAISS index for top_k + 1 neighbors (to handle self-matches)
        # Note: top_k represents candidates, but the query itself will also match.
        search_k = min(top_k + 1, index.ntotal)
        if search_k <= 0:
            logger.warning("Similarity Service: FAISS index is empty. No candidates to match.")
            return []

        similarities, indices = FAISSService.search_index(index, embeddings, search_k)

        # 4. Filter, deduplicate, and build candidate match list
        candidate_matches: List[SemanticMatch] = []
        seen_pairs = set()
        match_idx = 1

        for i, source_record in enumerate(records):
            source_key = f"{source_record.policy_id}:{source_record.obligation_id}"

            for rank in range(similarities.shape[1]):
                sim = float(similarities[i, rank])
                neighbor_idx = int(indices[i, rank])

                # Check if FAISS returned invalid/padding index (e.g. if index size < k)
                if neighbor_idx == -1:
                    continue

                neighbor_key = mapping.get(str(neighbor_idx))
                if not neighbor_key:
                    logger.warning(f"Similarity Service: No mapping found for FAISS index {neighbor_idx}.")
                    continue

                # Remove self-matches (exact same policy and obligation ID)
                if neighbor_idx == i or source_key == neighbor_key:
                    continue

                # Filter by similarity threshold
                if sim < threshold:
                    continue

                # Prevent duplicate match pairs (e.g. A matches B and B matches A are duplicates)
                pair_key = tuple(sorted([source_key, neighbor_key]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                # Split neighbor key to extract policy_id and obligation_id
                try:
                    target_policy_id, target_obligation_id = neighbor_key.split(":", 1)
                except ValueError:
                    logger.error(f"Similarity Service: Malformed mapping key '{neighbor_key}'. Expected 'policy_id:obligation_id'.")
                    continue

                # Retrieve the full target KnowledgeRecord
                target_record = None
                for r in records:
                    if r.policy_id == target_policy_id and r.obligation_id == target_obligation_id:
                        target_record = r
                        break

                if not target_record:
                    logger.warning(f"Similarity Service: Target record '{neighbor_key}' not found in loaded repository records.")
                    continue

                # Create the SemanticMatch record
                match_record = SemanticMatchService.build_match_record(
                    match_idx=match_idx,
                    source=source_record,
                    target=target_record,
                    similarity=sim
                )
                candidate_matches.append(match_record)
                match_idx += 1

        logger.info(f"Similarity Service: Candidate Matches Generated. Count={len(candidate_matches)}.")
        return candidate_matches
