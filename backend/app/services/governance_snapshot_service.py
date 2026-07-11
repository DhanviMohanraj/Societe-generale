import logging
import json
import os
from typing import Dict, Any, List
from datetime import datetime

from app.schemas.governance_schema import (
    GovernanceSnapshotSchema, 
    PolicySummary, 
    EnterpriseStatistics, 
    PolicyGovernanceMetrics,
    RecommendationSchema
)
from app.services.graph_repository import GraphRepository
from app.services.analysis_repository import AnalysisRepository
from app.services.analytics_repository import AnalyticsRepository
from app.services.governance_metrics_service import GovernanceMetricsService
from app.services.governance_score_service import GovernanceScoreService
from app.services.recommendation_service import RecommendationService
from app.services.executive_summary_service import ExecutiveSummaryService

logger = logging.getLogger(__name__)

# Base path relative to app/services
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONFLICT_INDEX_PATH = os.path.join(BASE_DIR, "outputs", "analysis", "conflict_index.json")

class GovernanceSnapshotService:
    """
    Orchestration service that builds the complete Policy Governance Analytics.
    """

    @classmethod
    def compile_governance_snapshot(cls) -> Dict[str, Any]:
        """
        Orchestrates loading data, computing metrics, generating scores/recs,
        and persisting snapshot, statistics, metrics and recommendations.
        """
        # 1. Load Graph Artifacts
        try:
            graph_data = GraphRepository.load_graph()
            graph_stats = GraphRepository.load_graph_statistics()
            graph_intel = GraphRepository.load_graph_intelligence()
        except Exception as e:
            logger.error(f"Governance Snapshot: Failed to load graph files: {str(e)}")
            raise FileNotFoundError(f"Missing knowledge graph files. Run Module 7 first. Error: {str(e)}")

        if not graph_data or not graph_data.get("nodes"):
            raise FileNotFoundError("Knowledge graph data is empty or missing. Please build the graph first.")
        
        logger.info("Graph Loaded")

        # 2. Load Analysis Artifacts
        try:
            analysis_records = AnalysisRepository.load_analysis_records()
        except Exception as e:
            logger.error(f"Governance Snapshot: Failed to load analysis records: {str(e)}")
            raise FileNotFoundError(f"Missing analysis records. Run Module 6 first. Error: {str(e)}")

        if not analysis_records:
            raise FileNotFoundError("Analysis records are empty or missing. Please run policy analysis first.")

        # Load conflict index
        conflict_records = []
        if os.path.exists(CONFLICT_INDEX_PATH):
            try:
                with open(CONFLICT_INDEX_PATH, "r", encoding="utf-8") as f:
                    conflict_records = json.load(f)
            except Exception as e:
                logger.warning(f"Governance Snapshot: Failed to load conflict index: {str(e)}")

        logger.info("Analysis Loaded")

        # 3. Compute Governance Metrics
        metrics_list = GovernanceMetricsService.compute_metrics(graph_data, analysis_records)
        logger.info("Governance Metrics Computed")

        # 4. Compute Governance Scores & Risk Levels
        policy_summaries: List[PolicySummary] = []
        recommendations_schemas: List[RecommendationSchema] = []
        
        for metrics in metrics_list:
            score = GovernanceScoreService.calculate_score(
                critical_conflicts=metrics.critical_conflicts,
                high_conflicts=metrics.high_conflicts,
                medium_conflicts=metrics.medium_conflicts,
                duplicate_count=metrics.duplicate_count,
                overlap_count=metrics.overlap_count,
                average_ai_confidence=metrics.average_ai_confidence
            )
            risk_level = GovernanceScoreService.classify_risk_level(score)

            # 5. Generate Recommendations
            recs = RecommendationService.generate_recommendations(metrics)
            priority = RecommendationService.determine_priority(metrics)

            # Update metrics recommendation count
            metrics.recommendation_count = len(recs)

            policy_summary = PolicySummary(
                policy_id=metrics.policy_id,
                policy_name=metrics.policy_name,
                governance_score=score,
                risk_level=risk_level,
                conflict_count=metrics.conflict_count,
                duplicate_count=metrics.duplicate_count,
                overlap_count=metrics.overlap_count,
                critical_conflicts=metrics.critical_conflicts,
                average_ai_confidence=metrics.average_ai_confidence,
                recommendation_priority=priority,
                recommendations=recs
            )
            policy_summaries.append(policy_summary)

            rec_schema = RecommendationSchema(
                policy_id=metrics.policy_id,
                policy_name=metrics.policy_name,
                recommendations=recs,
                priority=priority
            )
            recommendations_schemas.append(rec_schema)

        logger.info("Governance Scores Generated")
        logger.info("Recommendations Generated")

        # 6. Generate Executive Summary
        # Get unique topics count
        unique_topics = set()
        topic_distribution: Dict[str, int] = {}
        for topic_id, topic_data in graph_intel.get("topic_metrics", {}).items():
            topic_name = topic_data.get("topic_name", "General")
            unique_topics.add(topic_name)
            topic_distribution[topic_name] = topic_data.get("obligation_count", 0)

        # Fallback if topic_metrics is empty
        if not topic_distribution:
            topic_distribution["General"] = len([n for n in graph_data["nodes"] if n["node_type"] == "Obligation"])

        summary = ExecutiveSummaryService.generate_summary(
            policy_summaries=policy_summaries,
            stats_data=graph_stats,
            conflict_records=conflict_records,
            topic_count=len(unique_topics) if unique_topics else 1
        )
        logger.info("Executive Summary Generated")

        # 7. Compute Graph Analytics
        # Find analytical relationship distributions
        edges = graph_data.get("edges", [])
        rel_distribution = {
            "CONFLICTS_WITH": 0,
            "DUPLICATES": 0,
            "OVERLAPS": 0,
            "COMPLEMENTS": 0
        }
        for e in edges:
            rel = e.get("relationship")
            if rel in rel_distribution:
                rel_distribution[rel] += 1

        total_obs = summary["total_obligations"]
        total_pols = summary["total_policies"]

        conflict_density = round(summary["total_conflicts"] / total_obs, 4) if total_obs > 0 else 0.0
        duplicate_density = round(summary["total_duplicates"] / total_obs, 4) if total_obs > 0 else 0.0
        avg_rels_per_pol = round(summary["total_conflicts"] + summary["total_duplicates"] + summary["total_overlaps"] / total_pols, 4) if total_pols > 0 else 0.0

        ent_stats = EnterpriseStatistics(
            largest_connected_component=graph_stats.get("largest_connected_component", 0),
            average_degree=graph_stats.get("average_node_degree", 0.0),
            graph_density=graph_stats.get("graph_density", 0.0),
            topic_distribution=topic_distribution,
            relationship_distribution=rel_distribution,
            conflict_density=conflict_density,
            duplicate_density=duplicate_density,
            average_relationships_per_policy=avg_rels_per_pol
        )

        # 8. Assemble Snapshot
        snapshot = GovernanceSnapshotSchema(
            generated_at=summary["summary_generated_at"],
            overall_governance_score=summary["overall_governance_score"],
            overall_risk_level=summary["overall_risk_level"],
            total_policies=summary["total_policies"],
            total_obligations=summary["total_obligations"],
            critical_conflicts=summary["critical_conflicts"],
            duplicate_requirements=summary["total_duplicates"],
            graph_density=summary["graph_density"],
            average_ai_confidence=summary["average_ai_confidence"],
            high_risk_policies=summary["high_risk_policies"],
            top_recommendations=summary["top_recommendations"],
            policy_summaries=policy_summaries
        )

        # 9. Persist Outputs
        try:
            AnalyticsRepository.save_snapshot(snapshot.model_dump())
            AnalyticsRepository.save_statistics(ent_stats.model_dump())
            AnalyticsRepository.save_policy_governance([m.model_dump() for m in metrics_list])
            AnalyticsRepository.save_recommendations([r.model_dump() for r in recommendations_schemas])
        except Exception as e:
            logger.error(f"Governance Snapshot: Failed to persist analytics outputs: {str(e)}")
            raise RuntimeError(f"Storage repository failure: {str(e)}") from e

        logger.info("Snapshot Saved")
        logger.info("Completed")

        return {
            "status": "completed",
            "overall_governance_score": snapshot.overall_governance_score,
            "overall_risk_level": snapshot.overall_risk_level,
            "total_policies": snapshot.total_policies,
            "total_obligations": snapshot.total_obligations,
            "critical_conflicts": snapshot.critical_conflicts,
            "duplicate_requirements": snapshot.duplicate_requirements,
            "high_risk_policies": snapshot.high_risk_policies
        }
