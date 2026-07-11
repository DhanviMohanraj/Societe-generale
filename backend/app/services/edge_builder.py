import logging
from typing import Dict, Any, List
from app.schemas.graph_schema import GraphEdge
from app.schemas.knowledge_record import KnowledgeRecord
from app.schemas.analysis_record import AnalysisRecord

logger = logging.getLogger(__name__)

RELATIONSHIP_TO_EDGE_TYPE = {
    "CONFLICT": "CONFLICTS_WITH",
    "DUPLICATE": "DUPLICATES",
    "OVERLAP": "OVERLAPS",
    "COMPLEMENTARY": "COMPLEMENTS"
}

class EdgeBuilder:
    """
    Responsibilities:
    - Generate all structural and analytical edges.
    - Wire HAS_OBLIGATION, BELONGS_TO_TOPIC, and analysis-driven edges.
    - Ensure unique and stable edge IDs.
    - Prevent duplicate edges.
    """

    @classmethod
    def build_edges(
        cls,
        obligations: List[KnowledgeRecord],
        analyses: List[AnalysisRecord]
    ) -> List[GraphEdge]:
        """
        Builds graph edges based on extracted obligations and validated
        analysis records.
        """
        logger.info("Edge Builder: Building edges started.")
        edges_map: Dict[str, GraphEdge] = {}

        # 1. Structural Edges: Policy -> Obligation (HAS_OBLIGATION) and Obligation -> Topic (BELONGS_TO_TOPIC)
        for obl in obligations:
            obl_node_id = f"{obl.policy_id}_{obl.obligation_id}"
            policy_id = obl.policy_id

            # HAS_OBLIGATION edge
            has_edge_id = f"EDGE_{policy_id}_HAS_{obl.obligation_id}"
            if has_edge_id not in edges_map:
                edges_map[has_edge_id] = GraphEdge(
                    source=policy_id,
                    target=obl_node_id,
                    edge_id=has_edge_id,
                    relationship="HAS_OBLIGATION",
                    attributes={}
                )

            # BELONGS_TO_TOPIC edge
            topic_name = (obl.topic or "General").strip()
            topic_id = f"TOPIC_{topic_name.upper().replace(' ', '_')}"
            belongs_edge_id = f"EDGE_{obl_node_id}_BELONGS_{topic_id}"
            if belongs_edge_id not in edges_map:
                edges_map[belongs_edge_id] = GraphEdge(
                    source=obl_node_id,
                    target=topic_id,
                    edge_id=belongs_edge_id,
                    relationship="BELONGS_TO_TOPIC",
                    attributes={}
                )

        logger.info(f"Edge Builder: Generated structural edges. Current total count: {len(edges_map)}")

        # 2. Analytical Edges: Obligation <-> Obligation and Analysis -> Obligations
        for anl in analyses:
            source_obl_node_id = f"{anl.source_policy_id}_{anl.source_obligation_id}"
            target_obl_node_id = f"{anl.target_policy_id}_{anl.target_obligation_id}"
            analysis_id = anl.analysis_id

            # (A) Connect analysis node to the obligations it evaluates
            gen_edge1_id = f"EDGE_{analysis_id}_EVAL_{source_obl_node_id}"
            if gen_edge1_id not in edges_map:
                edges_map[gen_edge1_id] = GraphEdge(
                    source=analysis_id,
                    target=source_obl_node_id,
                    edge_id=gen_edge1_id,
                    relationship="GENERATED_ANALYSIS",
                    confidence=anl.confidence,
                    severity=anl.severity,
                    attributes={}
                )

            gen_edge2_id = f"EDGE_{analysis_id}_EVAL_{target_obl_node_id}"
            if gen_edge2_id not in edges_map:
                edges_map[gen_edge2_id] = GraphEdge(
                    source=analysis_id,
                    target=target_obl_node_id,
                    edge_id=gen_edge2_id,
                    relationship="GENERATED_ANALYSIS",
                    confidence=anl.confidence,
                    severity=anl.severity,
                    attributes={}
                )

            # (B) Connect obligations based on analyzed relationship (skip if INDEPENDENT)
            rel_type = anl.relationship.upper()
            if rel_type in RELATIONSHIP_TO_EDGE_TYPE:
                edge_rel_name = RELATIONSHIP_TO_EDGE_TYPE[rel_type]
                # Direct obligation relationship edge
                # Directed edge: from source obligation to target obligation
                rel_edge_id = f"EDGE_{source_obl_node_id}_{edge_rel_name}_{target_obl_node_id}"
                if rel_edge_id not in edges_map:
                    edges_map[rel_edge_id] = GraphEdge(
                        source=source_obl_node_id,
                        target=target_obl_node_id,
                        edge_id=rel_edge_id,
                        relationship=edge_rel_name,
                        confidence=anl.confidence,
                        severity=anl.severity,
                        attributes={
                            "reason": anl.reason,
                            "recommendation": anl.recommendation,
                            "analysis_id": analysis_id
                        }
                    )

        logger.info(f"Edge Builder: Finished edge building. Total generated edges: {len(edges_map)}")
        return list(edges_map.values())
