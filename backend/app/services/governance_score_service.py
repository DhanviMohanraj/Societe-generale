import logging
from typing import Dict, Any, Literal

logger = logging.getLogger(__name__)

class GovernanceScoreService:
    """
    Service responsible for calculating deterministic governance scores and 
    risk levels for individual policies and the overall enterprise.
    """

    @classmethod
    def calculate_score(
        cls,
        critical_conflicts: int,
        high_conflicts: int,
        medium_conflicts: int,
        duplicate_count: int,
        overlap_count: int,
        average_ai_confidence: float
    ) -> int:
        """
        Calculates governance score [0, 100] based on business rules:
        - Starts at 100
        - Subtract 15 per Critical Conflict
        - Subtract 10 per High Conflict
        - Subtract 5 per Medium Conflict
        - Subtract 2 per Duplicate
        - Subtract 1 per Overlap
        - Add 2 if Average AI Confidence >= 0.90
        - Clamp to [0, 100]
        """
        score = 100
        score -= (15 * critical_conflicts)
        score -= (10 * high_conflicts)
        score -= (5 * medium_conflicts)
        score -= (2 * duplicate_count)
        score -= (1 * overlap_count)

        if average_ai_confidence >= 0.90:
            score += 2

        return max(0, min(100, score))

    @classmethod
    def classify_risk_level(cls, score: int) -> Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        """
        Classifies risk level based on the governance score:
        - >= 90: LOW
        - 80-89: MEDIUM
        - 60-79: HIGH
        - Below 60: CRITICAL
        """
        if score >= 90:
            return "LOW"
        elif score >= 80:
            return "MEDIUM"
        elif score >= 60:
            return "HIGH"
        else:
            return "CRITICAL"
