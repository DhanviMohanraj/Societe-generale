import logging
from typing import List, Literal
from app.schemas.governance_schema import PolicyGovernanceMetrics

logger = logging.getLogger(__name__)

class RecommendationService:
    """
    Service responsible for generating deterministic, rule-based governance 
    recommendations for policies without using AI.
    """

    @classmethod
    def generate_recommendations(cls, metrics: PolicyGovernanceMetrics) -> List[str]:
        """
        Generates lists of recommendations based on metrics.
        Ensures the list is never empty by adding a default standard recommendation.
        """
        recs = []

        # 1. Critical Conflicts rule
        if metrics.critical_conflicts > 0:
            recs.append("Immediately review conflicting security policies.")

        # 2. High Conflicts rule
        if metrics.high_conflicts > 0:
            recs.append("Resolve high-severity policy conflicts to prevent operational drift.")

        # 3. Duplicate obligations rule
        if metrics.duplicate_count > 3:
            recs.append("Merge duplicate obligations into one canonical policy.")

        # 4. Low topic coverage rule
        # If policy has obligations but only covers 1 or 0 topics, encourage expanding coverage
        if metrics.obligation_count > 1 and metrics.topic_coverage <= 1:
            recs.append("Expand policy coverage.")

        # 5. Overlaps rule
        if metrics.overlap_count > 0:
            recs.append("Standardize overlapping policy clauses to reduce ambiguity.")

        # 6. Low AI Confidence rule
        # If average confidence is below 90% and there are relationships
        relationship_count = (metrics.conflict_count + metrics.duplicate_count + 
                              metrics.overlap_count + metrics.complementary_count)
        if relationship_count > 0 and metrics.average_ai_confidence < 0.90:
            recs.append("Audit low-confidence AI analysis matches.")

        # 7. Fallback to guarantee list is not empty
        if not recs:
            recs.append("Maintain current policy compliance levels. Run periodic reviews.")

        return recs

    @classmethod
    def determine_priority(cls, metrics: PolicyGovernanceMetrics) -> Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        """
        Determines the priority of the recommendations based on metrics.
        """
        if metrics.critical_conflicts > 0:
            return "CRITICAL"
        elif metrics.high_conflicts > 0:
            return "HIGH"
        elif metrics.medium_conflicts > 0 or metrics.duplicate_count > 3:
            return "MEDIUM"
        else:
            return "LOW"
