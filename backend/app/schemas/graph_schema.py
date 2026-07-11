from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class GraphNode(BaseModel):
    node_id: str = Field(..., description="Unique node identifier.")
    node_type: str = Field(..., description="Type of node: Policy, Obligation, Topic, Analysis.")
    type: str = Field(..., description="Duplicate field matching the Policy node example format.")
    label: str = Field(..., description="Friendly label for frontend/graph display.")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Metadata attributes for the node.")


class GraphEdge(BaseModel):
    source: str = Field(..., description="Source node ID.")
    target: str = Field(..., description="Target node ID.")
    edge_id: str = Field(..., description="Unique edge identifier.")
    relationship: str = Field(..., description="Relationship type, e.g., HAS_OBLIGATION, CONFLICTS_WITH.")
    confidence: Optional[float] = Field(None, description="Confidence score from Module 6 analysis (0.0 to 1.0) or similarity.")
    severity: Optional[str] = Field(None, description="Impact severity of relationship, e.g., LOW, CRITICAL.")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional custom metadata for the edge.")


class KnowledgeGraphSchema(BaseModel):
    nodes: List[GraphNode] = Field(..., description="List of all nodes in the knowledge graph.")
    edges: List[GraphEdge] = Field(..., description="List of all edges in the knowledge graph.")


class GraphStatisticsSchema(BaseModel):
    total_policies: int = Field(..., description="Total policy nodes.")
    total_obligations: int = Field(..., description="Total obligation nodes.")
    total_topics: int = Field(..., description="Total topic nodes.")
    total_relationships: int = Field(..., description="Total relationship edges (excl. structure edges).")
    total_conflicts: int = Field(..., description="Total conflict edges.")
    total_duplicates: int = Field(..., description="Total duplicate edges.")
    total_overlaps: int = Field(..., description="Total overlap edges.")
    largest_connected_component: int = Field(..., description="Size (node count) of the largest connected component.")
    average_node_degree: float = Field(..., description="Average degree of nodes in the graph.")
    graph_density: float = Field(..., description="Density of the graph.")
    average_confidence: float = Field(..., description="Average confidence score across all analyzed edges.")


class PolicyMetricsSchema(BaseModel):
    conflict_count: int = Field(..., description="Number of conflicts involved.")
    duplicate_count: int = Field(..., description="Number of duplicates involved.")
    overlap_count: int = Field(..., description="Number of overlaps involved.")
    average_confidence: float = Field(..., description="Average confidence of analyzed edges.")
    relationship_count: int = Field(..., description="Total relationships.")
    risk_score: int = Field(..., description="Deterministic risk score [0, 100].")
    topic_count: int = Field(..., description="Distinct topics referenced.")


class GraphIntelligenceSchema(BaseModel):
    policy_metrics: Dict[str, PolicyMetricsSchema] = Field(..., description="Aggregated metrics for each policy.")
    obligation_metrics: Dict[str, Dict[str, Any]] = Field(..., description="Aggregated metrics for each obligation.")
    topic_metrics: Dict[str, Dict[str, Any]] = Field(..., description="Aggregated metrics for each topic.")
    relationship_metrics: List[Dict[str, Any]] = Field(..., description="Detailed list of relationship edge metrics.")
