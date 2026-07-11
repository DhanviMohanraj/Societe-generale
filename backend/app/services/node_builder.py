import logging
import os
from typing import Dict, Any, List
from app.schemas.graph_schema import GraphNode
from app.schemas.knowledge_record import KnowledgeRecord
from app.schemas.analysis_record import AnalysisRecord

logger = logging.getLogger(__name__)

STRENGTH_TO_SEVERITY = {
    "MANDATORY": "HIGH",
    "PROHIBITED": "CRITICAL",
    "RECOMMENDED": "MEDIUM",
    "OPTIONAL": "LOW"
}

class NodeBuilder:
    """
    Responsibilities:
    - Generate unique, stable graph nodes from KnowledgeRecords and AnalysisRecords.
    - Avoid duplicate nodes.
    - Standardize Labels and attributes.
    """

    @classmethod
    def clean_policy_label(cls, filename: str) -> str:
        """Converts password_policy.pdf -> Password Policy."""
        base = os.path.splitext(filename)[0]
        words = base.replace("_", " ").replace("-", " ").split()
        return " ".join(w.capitalize() for w in words)

    @classmethod
    def map_strength_to_severity(cls, strength: str) -> str:
        """Maps Obligation strength to a standard severity level."""
        st_upper = str(strength).strip().upper()
        return STRENGTH_TO_SEVERITY.get(st_upper, "LOW")

    @classmethod
    def build_nodes(
        cls,
        policies: List[Dict[str, Any]],
        obligations: List[KnowledgeRecord],
        analyses: List[AnalysisRecord]
    ) -> List[GraphNode]:
        """
        Builds and returns all graph nodes based on the loaded policies,
        obligations, and analysis records, preventing duplicates.
        """
        logger.info("Node Builder: Building nodes started.")
        nodes_map: Dict[str, GraphNode] = {}

        # 1. Build Policy Nodes
        for p in policies:
            policy_id = p.get("policy_id")
            if not policy_id:
                continue

            policy_name = p.get("policy_name", f"{policy_id}.pdf")
            label = cls.clean_policy_label(policy_name)

            nodes_map[policy_id] = GraphNode(
                node_id=policy_id,
                node_type="Policy",
                type="Policy",
                label=label,
                attributes={
                    "policy_name": policy_name,
                    "status": p.get("status", "ACTIVE"),
                    "risk_score": 0,          # Calculated later by graph intelligence
                    "conflict_count": 0,      # Calculated later by graph intelligence
                    "duplicate_count": 0,     # Calculated later by graph intelligence
                    "overlap_count": 0        # Calculated later by graph intelligence
                }
            )
        logger.info(f"Node Builder: Created {len(policies)} Policy nodes.")

        # 2. Build Obligation and Topic Nodes
        obligation_count = 0
        topic_count = 0
        for obl in obligations:
            # Check if parent policy node exists
            if obl.policy_id not in nodes_map:
                logger.warning(f"Node Builder: Found obligation {obl.obligation_id} for unregistered policy {obl.policy_id}. Skipping.")
                continue

            # Obligation Node ID is globally unique: policyId_obligationId
            obl_node_id = f"{obl.policy_id}_{obl.obligation_id}"
            
            severity = cls.map_strength_to_severity(obl.strength)

            # Add Obligation Node
            if obl_node_id not in nodes_map:
                nodes_map[obl_node_id] = GraphNode(
                    node_id=obl_node_id,
                    node_type="Obligation",
                    type="Obligation",
                    label=obl.obligation_id,
                    attributes={
                        "obligation_id": obl.obligation_id,
                        "policy_id": obl.policy_id,
                        "canonical_text": obl.canonical_text,
                        "topic": obl.topic or "General",
                        "severity": severity,
                        "relationship_count": 0  # Calculated later
                    }
                )
                obligation_count += 1

            # Add Topic Node (Use Topic string as stable ID)
            topic_name = (obl.topic or "General").strip()
            topic_id = f"TOPIC_{topic_name.upper().replace(' ', '_')}"
            if topic_id not in nodes_map:
                nodes_map[topic_id] = GraphNode(
                    node_id=topic_id,
                    node_type="Topic",
                    type="Topic",
                    label=topic_name,
                    attributes={}
                )
                topic_count += 1

        logger.info(f"Node Builder: Created {obligation_count} Obligation nodes and {topic_count} Topic nodes.")

        # 3. Build Analysis Nodes
        analysis_count = 0
        for anl in analyses:
            if anl.analysis_id not in nodes_map:
                nodes_map[anl.analysis_id] = GraphNode(
                    node_id=anl.analysis_id,
                    node_type="Analysis",
                    type="Analysis",
                    label=anl.analysis_id,
                    attributes={
                        "relationship": anl.relationship,
                        "confidence": anl.confidence,
                        "severity": anl.severity,
                        "reason": anl.reason,
                        "recommendation": anl.recommendation,
                        "match_id": anl.match_id
                    }
                )
                analysis_count += 1

        logger.info(f"Node Builder: Created {analysis_count} Analysis nodes.")
        return list(nodes_map.values())
