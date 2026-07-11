import logging
from typing import Dict, Any, List
from datetime import datetime

from app.schemas.governance_schema import PolicySummary, EnterpriseStatistics
from app.services.governance_score_service import GovernanceScoreService

logger = logging.getLogger(__name__)

class ExecutiveSummaryService:
    """
    Service responsible for aggregating policy-level metrics and statistics
    to build the enterprise executive summary.
    """

    @classmethod
    def generate_summary(
        cls,
        policy_summaries: List[PolicySummary],
        stats_data: Dict[str, Any],
        conflict_records: List[Dict[str, Any]],
        topic_count: int
    ) -> Dict[str, Any]:
        """
        Compiles the executive summary metrics.
        """
        logger.info("Executive Summary: Starting executive summary generation.")

        # 1. Overall Governance Score (Average of all policy governance scores)
        total_policies = len(policy_summaries)
        if total_policies > 0:
            overall_governance_score = int(round(sum(p.governance_score for p in policy_summaries) / total_policies))
        else:
            overall_governance_score = 100

        # 2. Overall Risk Level
        overall_risk_level = GovernanceScoreService.classify_risk_level(overall_governance_score)

        # 3. High Risk Policies Count (policies marked as HIGH or CRITICAL risk)
        high_risk_policies = sum(1 for p in policy_summaries if p.risk_level in ("HIGH", "CRITICAL"))

        # 4. Total critical conflicts
        critical_conflicts = sum(1 for c in conflict_records if c.get("severity") == "CRITICAL")

        # 5. Extract top recommendations from all policy recommendations
        # Group by priority and get unique recommendations
        critical_recs = []
        high_recs = []
        medium_recs = []
        low_recs = []

        for p in policy_summaries:
            for rec in p.recommendations:
                if rec == "Maintain current policy compliance levels. Run periodic reviews.":
                    continue
                if p.recommendation_priority == "CRITICAL":
                    if rec not in critical_recs:
                        critical_recs.append(rec)
                elif p.recommendation_priority == "HIGH":
                    if rec not in high_recs:
                        high_recs.append(rec)
                elif p.recommendation_priority == "MEDIUM":
                    if rec not in medium_recs:
                        medium_recs.append(rec)
                else:
                    if rec not in low_recs:
                        low_recs.append(rec)

        top_recommendations = []
        for rec in (critical_recs + high_recs + medium_recs + low_recs):
            if rec not in top_recommendations:
                top_recommendations.append(rec)
        top_recommendations = top_recommendations[:5]
        if not top_recommendations:
            top_recommendations.append("Maintain current policy compliance levels. Run periodic reviews.")

        from datetime import timezone
        summary_generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        summary = {
            "overall_governance_score": overall_governance_score,
            "overall_risk_level": overall_risk_level,
            "total_policies": total_policies,
            "total_obligations": stats_data.get("total_obligations", 0),
            "total_conflicts": stats_data.get("total_conflicts", 0),
            "total_duplicates": stats_data.get("total_duplicates", 0),
            "total_overlaps": stats_data.get("total_overlaps", 0),
            "total_topics": topic_count,
            "critical_conflicts": critical_conflicts,
            "high_risk_policies": high_risk_policies,
            "average_ai_confidence": stats_data.get("average_confidence", 1.0),
            "graph_density": stats_data.get("graph_density", 0.0),
            "top_recommendations": top_recommendations,
            "summary_generated_at": summary_generated_at
        }

        logger.info("Executive Summary: Executive summary successfully generated.")
        return summary
