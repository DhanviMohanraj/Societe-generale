from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Literal

class PolicyGovernanceMetrics(BaseModel):
    policy_id: str = Field(..., description="Stable policy identifier.")
    policy_name: str = Field(..., description="Original policy filename.")
    obligation_count: int = Field(..., description="Total obligations in the policy.")
    conflict_count: int = Field(..., description="Total conflicts involving this policy.")
    duplicate_count: int = Field(..., description="Total duplicate relations involving this policy.")
    overlap_count: int = Field(..., description="Total overlap relations involving this policy.")
    complementary_count: int = Field(..., description="Total complementary relations involving this policy.")
    independent_count: int = Field(..., description="Total independent relations involving this policy.")
    critical_conflicts: int = Field(..., description="Count of critical conflicts.")
    high_conflicts: int = Field(..., description="Count of high conflicts.")
    medium_conflicts: int = Field(..., description="Count of medium conflicts.")
    low_conflicts: int = Field(..., description="Count of low conflicts.")
    average_ai_confidence: float = Field(..., description="Average confidence score across all analyzed edges.")
    graph_connectivity: int = Field(..., description="Total node degree in the knowledge graph.")
    topic_coverage: int = Field(..., description="Number of distinct topics covered by the policy's obligations.")
    recommendation_count: int = Field(..., description="Number of governance recommendations generated for this policy.")

    @field_validator(
        "obligation_count", "conflict_count", "duplicate_count", "overlap_count", 
        "complementary_count", "independent_count", "critical_conflicts", 
        "high_conflicts", "medium_conflicts", "low_conflicts", 
        "graph_connectivity", "topic_coverage", "recommendation_count"
    )
    @classmethod
    def validate_non_negative_counts(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Count values must be non-negative.")
        return v

    @field_validator("average_ai_confidence")
    @classmethod
    def validate_confidence_range(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"Average confidence must be between 0.0 and 1.0, got: {v}")
        return v


class PolicySummary(BaseModel):
    policy_id: str = Field(..., description="Stable policy identifier.")
    policy_name: str = Field(..., description="Original policy filename.")
    governance_score: int = Field(..., description="Governance score from 0 to 100.")
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Classified risk level based on governance score.")
    conflict_count: int = Field(..., description="Total conflicts.")
    duplicate_count: int = Field(..., description="Total duplicates.")
    overlap_count: int = Field(..., description="Total overlaps.")
    critical_conflicts: int = Field(..., description="Number of critical conflicts.")
    average_ai_confidence: float = Field(..., description="Average AI confidence for relationships.")
    recommendation_priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Recommendation urgency level.")
    recommendations: List[str] = Field(default_factory=list, description="Actionable governance recommendations.")

    @field_validator("governance_score")
    @classmethod
    def validate_score_range(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError(f"Governance score must be between 0 and 100, got: {v}")
        return v


class EnterpriseStatistics(BaseModel):
    largest_connected_component: int = Field(..., description="Size of the largest connected component in the graph.")
    average_degree: float = Field(..., description="Average degree of nodes in the graph.")
    graph_density: float = Field(..., description="Density of the graph topology.")
    topic_distribution: Dict[str, int] = Field(..., description="Distribution of obligations per topic.")
    relationship_distribution: Dict[str, int] = Field(..., description="Distribution of analytical relationships in the graph.")
    conflict_density: float = Field(..., description="Ratio of conflict relationships to total obligations.")
    duplicate_density: float = Field(..., description="Ratio of duplicate relationships to total obligations.")
    average_relationships_per_policy: float = Field(..., description="Average relationships per policy in the enterprise.")


class RecommendationSchema(BaseModel):
    policy_id: str = Field(..., description="Associated policy ID.")
    policy_name: str = Field(..., description="Associated policy filename.")
    recommendations: List[str] = Field(..., description="List of generated recommendations.")
    priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Resolution priority.")


class GovernanceSnapshotSchema(BaseModel):
    generated_at: str = Field(..., description="ISO 8601 generation timestamp.")
    overall_governance_score: int = Field(..., description="Overall enterprise governance score [0, 100].")
    overall_risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Overall risk classification.")
    total_policies: int = Field(..., description="Total registered policies.")
    total_obligations: int = Field(..., description="Total active obligations.")
    critical_conflicts: int = Field(..., description="Total enterprise critical conflicts.")
    duplicate_requirements: int = Field(..., description="Total enterprise duplicate obligations.")
    graph_density: float = Field(..., description="Graph density metric.")
    average_ai_confidence: float = Field(..., description="Average confidence score across all analyzed edges.")
    high_risk_policies: int = Field(..., description="Number of policies marked as HIGH or CRITICAL risk.")
    top_recommendations: List[str] = Field(..., description="List of top prioritized recommendations for the dashboard.")
    policy_summaries: List[PolicySummary] = Field(..., description="Summaries of each policy's governance report.")
