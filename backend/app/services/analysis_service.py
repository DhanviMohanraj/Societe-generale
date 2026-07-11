import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.schemas.analysis_record import AnalysisRecord, ReasoningTrace
from app.services.semantic_match_service import SemanticMatchService
from app.services.prompt_builder import PromptBuilder
from app.services.reasoning_service import ReasoningService
from app.services.decision_validator import DecisionValidator
from app.services.analysis_repository import AnalysisRepository

logger = logging.getLogger(__name__)

class AnalysisService:
    """
    Orchestrates the policy conflict reasoning pipeline.
    Loads candidate matches, checks cache, runs Qwen, validates decisions,
    builds Analysis Records, and saves outputs.
    """

    @classmethod
    def run_analysis(cls, force: bool = False) -> Dict[str, Any]:
        """
        Runs reasoning over all candidate matches.
        Reuses cached analysis per match_id if force=False.
        Saves results and returns execution summary.
        """
        logger.info("Candidate Matches Loaded")

        # 1. Load candidate matches
        try:
            matches = SemanticMatchService.load_candidate_matches()
        except Exception as e:
            logger.error(f"Analysis Service: Failed to load candidate matches: {str(e)}")
            raise RuntimeError(f"Failed to load candidate matches: {str(e)}") from e

        if not matches:
            logger.warning("Analysis Service: candidate_matches.json is empty or missing.")
            raise FileNotFoundError("Candidate matches file is empty or missing. Please run similarity matching first.")

        # 2. Load existing analysis records for caching lookup
        existing_records = []
        try:
            existing_records = AnalysisRepository.load_analysis_records()
        except Exception:
            logger.warning("Analysis Service: Could not load existing analysis registry. Starting fresh.")

        cache_map = {r.match_id: r for r in existing_records}

        new_records: List[AnalysisRecord] = []
        analysis_counter = 1

        for match in matches:
            analysis_id = f"ANL-{analysis_counter:03d}"
            
            # Caching check
            if not force and match.match_id in cache_map:
                logger.info(f"Analysis Service: Using cached analysis for match {match.match_id}.")
                cached_record = cache_map[match.match_id]
                # Re-assign sequential ID to maintain clean list structure
                cached_record.analysis_id = analysis_id
                new_records.append(cached_record)
                analysis_counter += 1
                continue

            logger.info(f"Analysis Service: Analyzing match {match.match_id} ({match.source_obligation_id} vs {match.target_obligation_id}).")

            # 3. Build comparison prompt
            prompt = PromptBuilder.build_comparison_prompt(
                source_text=match.source_text,
                target_text=match.target_text
            )
            logger.info("Prompt Built")

            # 4. Invoke LLM (Qwen2.5)
            logger.info("Qwen Invoked")
            try:
                raw_decision = ReasoningService.analyze_pair(prompt)
            except Exception as e:
                logger.error(f"Analysis Service: LLM reasoning failed for match {match.match_id}: {str(e)}")
                raise RuntimeError(f"LLM Reasoning failed for match {match.match_id}: {str(e)}") from e

            # 5. Validate and normalize LLM decision
            logger.info("Reasoning Completed")
            try:
                validated = DecisionValidator.validate_and_normalize(
                    decision=raw_decision,
                    source_text=match.source_text,
                    target_text=match.target_text
                )
                logger.info("Validation Passed")
            except Exception as e:
                logger.error(f"Analysis Service: LLM decision validation failed for match {match.match_id}: {str(e)}")
                # If LLM response was malformed/invalidated, raise error
                raise ValueError(f"LLM decision validation failed for match {match.match_id}: {str(e)}") from e

            # 6. Extract observations and basis for Reasoning Trace
            reason_text = validated["reason"]
            sentences = [s.strip() for s in reason_text.split(".") if s.strip()]
            if len(sentences) >= 2:
                llm_observation = sentences[0] + "."
                decision_basis = " ".join(sentences[1:]) + "."
            else:
                llm_observation = f"Comparing {match.source_obligation_id} and {match.target_obligation_id}."
                decision_basis = reason_text

            trace = ReasoningTrace(
                semantic_similarity=match.similarity,
                llm_observation=llm_observation,
                decision_basis=decision_basis
            )

            # 7. Construct Analysis Record object
            now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            record = AnalysisRecord(
                analysis_id=analysis_id,
                match_id=match.match_id,
                source_policy_id=match.source_policy_id,
                target_policy_id=match.target_policy_id,
                source_obligation_id=match.source_obligation_id,
                target_obligation_id=match.target_obligation_id,
                source_text=match.source_text,
                target_text=match.target_text,
                semantic_similarity=match.similarity,
                relationship=validated["relationship"],
                confidence=validated["confidence"],
                severity=validated["severity"],
                reason=validated["reason"],
                recommendation=validated["recommendation"],
                reasoning_trace=trace,
                llm_model="qwen2.5:7b",
                created_at=now_str,
                status="PENDING_ANALYSIS"
            )

            new_records.append(record)
            analysis_counter += 1

        # 8. Save results to repository (writes analysis_records.json and conflict_index.json)
        try:
            AnalysisRepository.save_analysis_records(new_records)
            logger.info("Analysis Saved")
            logger.info("Conflict Index Updated")
        except Exception as e:
            logger.error(f"Analysis Service: Failed to persist analysis results: {str(e)}")
            raise RuntimeError(f"Storage error: {str(e)}") from e

        logger.info("Completed")
        
        # Calculate summary metrics
        total = len(new_records)
        conflicts = sum(1 for r in new_records if r.relationship == "CONFLICT")
        duplicates = sum(1 for r in new_records if r.relationship == "DUPLICATE")
        overlaps = sum(1 for r in new_records if r.relationship == "OVERLAP")

        return {
            "status": "completed",
            "total_analyzed": total,
            "conflicts_detected": conflicts,
            "duplicates_detected": duplicates,
            "overlaps_detected": overlaps
        }
