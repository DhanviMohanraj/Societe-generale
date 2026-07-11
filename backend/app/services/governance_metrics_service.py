import logging
from typing import Dict, Any, List
import networkx as nx

from app.schemas.governance_schema import PolicyGovernanceMetrics

logger = logging.getLogger(__name__)

class GovernanceMetricsService:
    """
    Service responsible for computing raw governance metrics for each policy
    based on the Knowledge Graph structure and AI analysis records.
    """

    @classmethod
    def _get_field(cls, obj: Any, field_name: str, default: Any = None) -> Any:
        if isinstance(obj, dict):
            return obj.get(field_name, default)
        return getattr(obj, field_name, default)

    @classmethod
    def compute_metrics(
        cls,
        graph_data: Dict[str, Any],
        analysis_records: List[Any]
    ) -> List[PolicyGovernanceMetrics]:
        """
        Computes raw metrics for every policy in the graph.
        """
        logger.info("Governance Metrics: Starting metrics computation.")
        
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])

        # Construct NetworkX graph to calculate graph connectivity (node degree)
        G = nx.DiGraph()
        for n in nodes:
            G.add_node(n["node_id"], **n)
        for e in edges:
            G.add_edge(e["source"], e["target"], **e)

        policy_nodes = [n for n in nodes if n["node_type"] == "Policy"]
        metrics_list: List[PolicyGovernanceMetrics] = []

        for p_node in policy_nodes:
            policy_id = p_node["node_id"]
            policy_name = p_node["attributes"].get("policy_name", f"{policy_id}.pdf")

            # 1. Obligation Count (obligations belonging to this policy)
            obl_nodes = [
                n for n in nodes 
                if n["node_type"] == "Obligation" and n["attributes"].get("policy_id") == policy_id
            ]
            obligation_count = len(obl_nodes)
            obl_node_ids = {n["node_id"] for n in obl_nodes}

            # 2. Filter analysis records involving this policy
            p_analyses = [
                a for a in analysis_records
                if cls._get_field(a, "source_policy_id") == policy_id or cls._get_field(a, "target_policy_id") == policy_id
            ]

            conflict_count = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "CONFLICT")
            duplicate_count = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "DUPLICATE")
            overlap_count = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "OVERLAP")
            complementary_count = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "COMPLEMENTARY")
            independent_count = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "INDEPENDENT")

            # 3. Categorize conflicts by severity
            critical_conflicts = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "CONFLICT" and cls._get_field(a, "severity") == "CRITICAL")
            high_conflicts = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "CONFLICT" and cls._get_field(a, "severity") == "HIGH")
            medium_conflicts = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "CONFLICT" and cls._get_field(a, "severity") == "MEDIUM")
            low_conflicts = sum(1 for a in p_analyses if cls._get_field(a, "relationship") == "CONFLICT" and cls._get_field(a, "severity") == "LOW")

            # 4. Average AI Confidence across all analytical relationships (excluding INDEPENDENT)
            analytical_relationships = [
                a for a in p_analyses 
                if cls._get_field(a, "relationship") in ("CONFLICT", "DUPLICATE", "OVERLAP", "COMPLEMENTARY")
            ]
            confidences = [cls._get_field(a, "confidence", 1.0) for a in analytical_relationships]
            average_ai_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 1.0

            # 5. Graph Connectivity (Node degree in the directed graph)
            graph_connectivity = G.degree(policy_id) if G.has_node(policy_id) else 0

            # 6. Topic Coverage (Count of unique topics covered by the policy's obligations)
            # Find topic nodes connected to these obligations in the graph
            topics_covered = set()
            for obl_id in obl_node_ids:
                if G.has_node(obl_id):
                    # Outgoing edges from obligation to topic nodes (BELONGS_TO_TOPIC)
                    for target in G.successors(obl_id):
                        target_node = G.nodes[target]
                        if target_node.get("node_type") == "Topic":
                            topics_covered.add(target_node["label"])

            topic_coverage = len(topics_covered)

            # Build Metrics schema (recommendation_count set to 0 initially, updated later)
            metrics = PolicyGovernanceMetrics(
                policy_id=policy_id,
                policy_name=policy_name,
                obligation_count=obligation_count,
                conflict_count=conflict_count,
                duplicate_count=duplicate_count,
                overlap_count=overlap_count,
                complementary_count=complementary_count,
                independent_count=independent_count,
                critical_conflicts=critical_conflicts,
                high_conflicts=high_conflicts,
                medium_conflicts=medium_conflicts,
                low_conflicts=low_conflicts,
                average_ai_confidence=average_ai_confidence,
                graph_connectivity=graph_connectivity,
                topic_coverage=topic_coverage,
                recommendation_count=0
            )
            metrics_list.append(metrics)

        logger.info(f"Governance Metrics: Successfully computed metrics for {len(metrics_list)} policies.")
        return metrics_list
