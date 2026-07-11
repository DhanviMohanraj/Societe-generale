import logging
import networkx as nx
from typing import Dict, Any, List
from app.schemas.graph_schema import GraphNode, GraphEdge, GraphStatisticsSchema, GraphIntelligenceSchema, PolicyMetricsSchema
from app.schemas.knowledge_record import KnowledgeRecord
from app.schemas.analysis_record import AnalysisRecord

logger = logging.getLogger(__name__)

class GraphIntelligenceService:
    """
    Responsibilities:
    - Compute graph analytics and policy metrics (risk scores, counts).
    - Compute general graph statistics using NetworkX.
    - Compile Graph Intelligence structure containing detailed metrics.
    """

    @classmethod
    def calculate_risk_score(cls, conflict_count: int, overlap_count: int, duplicate_count: int) -> int:
        """
        Base Score: 100
        Subtract 10 for every Conflict
        Subtract 3 for every Overlap
        Subtract 1 for every Duplicate
        Minimum: 0, Maximum: 100
        """
        score = 100 - (10 * conflict_count) - (3 * overlap_count) - (1 * duplicate_count)
        return max(0, min(100, score))

    @classmethod
    def analyze_graph(
        cls,
        nx_graph: nx.DiGraph,
        nodes: List[GraphNode],
        edges: List[GraphEdge],
        obligations: List[KnowledgeRecord],
        analyses: List[AnalysisRecord]
    ) -> tuple[GraphStatisticsSchema, GraphIntelligenceSchema]:
        """
        Performs network and logical analysis to compute Graph Statistics
        and Graph Intelligence metrics.
        Returns (statistics_schema, intelligence_schema).
        """
        logger.info("Graph Intelligence: Starting analysis.")

        # 1. Compute Policy Metrics
        policy_ids = [n.node_id for n in nodes if n.node_type == "Policy"]
        policy_metrics: Dict[str, PolicyMetricsSchema] = {}

        for p_id in policy_ids:
            # Get obligations of this policy
            p_obls = [o for o in obligations if o.policy_id == p_id]
            p_obl_node_ids = {f"{o.policy_id}_{o.obligation_id}" for o in p_obls}
            p_topics = {o.topic for o in p_obls if o.topic}

            # Filter analyses involving this policy
            p_analyses = [
                a for a in analyses 
                if a.source_policy_id == p_id or a.target_policy_id == p_id
            ]

            conflicts_count = sum(1 for a in p_analyses if a.relationship == "CONFLICT")
            duplicates_count = sum(1 for a in p_analyses if a.relationship == "DUPLICATE")
            overlaps_count = sum(1 for a in p_analyses if a.relationship == "OVERLAP")
            relationship_count = sum(1 for a in p_analyses if a.relationship in ("CONFLICT", "DUPLICATE", "OVERLAP", "COMPLEMENTARY"))

            confidences = [a.confidence for a in p_analyses]
            avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 1.0

            risk_score = cls.calculate_risk_score(conflicts_count, overlaps_count, duplicates_count)

            policy_metrics[p_id] = PolicyMetricsSchema(
                conflict_count=conflicts_count,
                duplicate_count=duplicates_count,
                overlap_count=overlaps_count,
                average_confidence=avg_confidence,
                relationship_count=relationship_count,
                risk_score=risk_score,
                topic_count=len(p_topics)
            )

        # 2. Compute Obligation Metrics
        obligation_metrics: Dict[str, Dict[str, Any]] = {}
        for obl in obligations:
            obl_node_id = f"{obl.policy_id}_{obl.obligation_id}"
            # Count relations involving this obligation node
            obl_analyses = [
                a for a in analyses
                if (f"{a.source_policy_id}_{a.source_obligation_id}" == obl_node_id) or
                   (f"{a.target_policy_id}_{a.target_obligation_id}" == obl_node_id)
            ]
            
            c_count = sum(1 for a in obl_analyses if a.relationship == "CONFLICT")
            d_count = sum(1 for a in obl_analyses if a.relationship == "DUPLICATE")
            o_count = sum(1 for a in obl_analyses if a.relationship == "OVERLAP")

            obligation_metrics[obl_node_id] = {
                "obligation_id": obl.obligation_id,
                "policy_id": obl.policy_id,
                "canonical_text": obl.canonical_text,
                "topic": obl.topic or "General",
                "relationship_count": len(obl_analyses),
                "conflict_count": c_count,
                "duplicate_count": d_count,
                "overlap_count": o_count
            }

        # 3. Compute Topic Metrics
        topic_metrics: Dict[str, Dict[str, Any]] = {}
        unique_topics = {(obl.topic or "General").strip() for obl in obligations}
        for topic in unique_topics:
            topic_id = f"TOPIC_{topic.upper().replace(' ', '_')}"
            topic_obls = [o for o in obligations if (o.topic or "General").strip() == topic]
            topic_obl_node_ids = {f"{o.policy_id}_{o.obligation_id}" for o in topic_obls}
            topic_policies = {o.policy_id for o in topic_obls}

            # Count conflicts involving this topic
            topic_conflicts = sum(
                1 for a in analyses
                if a.relationship == "CONFLICT" and (
                    f"{a.source_policy_id}_{a.source_obligation_id}" in topic_obl_node_ids or
                    f"{a.target_policy_id}_{a.target_obligation_id}" in topic_obl_node_ids
                )
            )

            topic_metrics[topic_id] = {
                "topic_name": topic,
                "obligation_count": len(topic_obls),
                "policy_count": len(topic_policies),
                "conflict_count": topic_conflicts
            }

        # 4. Compile Relationship Metrics
        relationship_metrics: List[Dict[str, Any]] = []
        for anl in analyses:
            relationship_metrics.append({
                "analysis_id": anl.analysis_id,
                "match_id": anl.match_id,
                "relationship": anl.relationship,
                "source_node_id": f"{anl.source_policy_id}_{anl.source_obligation_id}",
                "target_node_id": f"{anl.target_policy_id}_{anl.target_obligation_id}",
                "severity": anl.severity,
                "confidence": anl.confidence,
                "reason": anl.reason,
                "recommendation": anl.recommendation
            })

        # 5. NetworkX Graph Topology Metrics
        total_policies = len(policy_ids)
        total_obligations = len(obligation_metrics)
        total_topics = len(topic_metrics)

        # Analytical relationships count
        analytical_edges = [
            e for e in edges
            if e.relationship in ("CONFLICTS_WITH", "DUPLICATES", "OVERLAPS", "COMPLEMENTS")
        ]
        total_relationships = len(analytical_edges)
        total_conflicts = sum(1 for e in analytical_edges if e.relationship == "CONFLICTS_WITH")
        total_duplicates = sum(1 for e in analytical_edges if e.relationship == "DUPLICATES")
        total_overlaps = sum(1 for e in analytical_edges if e.relationship == "OVERLAPS")

        # Largest Connected Component (Weakly connected components in directed graph)
        weakly_components = list(nx.weakly_connected_components(nx_graph))
        largest_cc = len(max(weakly_components, key=len)) if weakly_components else 0

        # Degree and density
        nodes_count = nx_graph.number_of_nodes()
        avg_node_degree = sum(dict(nx_graph.degree()).values()) / nodes_count if nodes_count > 0 else 0.0
        graph_density = nx.density(nx_graph)

        # Average confidence
        confidences = [anl.confidence for anl in analyses]
        avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 1.0

        # Create schemas
        statistics = GraphStatisticsSchema(
            total_policies=total_policies,
            total_obligations=total_obligations,
            total_topics=total_topics,
            total_relationships=total_relationships,
            total_conflicts=total_conflicts,
            total_duplicates=total_duplicates,
            total_overlaps=total_overlaps,
            largest_connected_component=largest_cc,
            average_node_degree=round(avg_node_degree, 4),
            graph_density=round(graph_density, 4),
            average_confidence=avg_confidence
        )

        intelligence = GraphIntelligenceSchema(
            policy_metrics=policy_metrics,
            obligation_metrics=obligation_metrics,
            topic_metrics=topic_metrics,
            relationship_metrics=relationship_metrics
        )

        logger.info("Graph Intelligence: Analytics computation complete.")
        return statistics, intelligence
