import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status

from app.schemas.graph_schema import GraphNode, GraphEdge
from app.services.graph_builder import GraphBuilder
from app.services.graph_repository import GraphRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

@router.post("/build", status_code=status.HTTP_200_OK)
def build_graph_route():
    """
    POST /graph/build
    Triggers the end-to-end graph construction pipeline.
    Transforms AI Analysis records into a validated NetworkX directed graph.
    Saves graph data, intelligence, and statistics on disk.
    """
    try:
        summary = GraphBuilder.build_graph_pipeline()
        return summary
    except FileNotFoundError as e:
        logger.warning(f"Build Graph: Missing input data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        logger.error(f"Build Graph: Graph validation failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Graph validation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Build Graph: Unexpected engine error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Graph engine error: {str(e)}"
        )


@router.get("", status_code=status.HTTP_200_OK)
def get_graph_route():
    """
    GET /graph
    Returns the complete serialized Policy Knowledge Graph (nodes and edges).
    """
    try:
        graph = GraphRepository.load_graph()
        return graph
    except Exception as e:
        logger.error(f"Get Graph: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load knowledge graph: {str(e)}"
        )


@router.get("/statistics", status_code=status.HTTP_200_OK)
def get_statistics_route():
    """
    GET /graph/statistics
    Returns calculated topological and analytical graph statistics.
    """
    try:
        stats = GraphRepository.load_graph_statistics()
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Graph statistics are not built yet. Please run POST /graph/build first."
            )
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Statistics: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load graph statistics: {str(e)}"
        )


@router.get("/intelligence", status_code=status.HTTP_200_OK)
def get_intelligence_route():
    """
    GET /graph/intelligence
    Returns calculated policy risk scores, obligation relations, and topic summaries.
    """
    try:
        intel = GraphRepository.load_graph_intelligence()
        if not intel or not intel.get("policy_metrics"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Graph intelligence metrics are not built yet. Please run POST /graph/build first."
            )
        return intel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Intelligence: Failed to load: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load graph intelligence: {str(e)}"
        )


@router.get("/policy/{policy_id}", status_code=status.HTTP_200_OK)
def get_policy_graph_route(policy_id: str):
    """
    GET /graph/policy/{policy_id}
    Returns sub-graph information focused on a single policy, including
    its obligations, relationships, and analysis traces.
    """
    try:
        graph = GraphRepository.load_graph()
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # 1. Find Policy Node
        policy_node = next((n for n in nodes if n["node_id"] == policy_id and n["node_type"] == "Policy"), None)
        if not policy_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy node '{policy_id}' not found in the graph."
            )

        # 2. Get policy obligations (connected by HAS_OBLIGATION)
        obl_node_ids = {
            e["target"] for e in edges
            if e["source"] == policy_id and e["relationship"] == "HAS_OBLIGATION"
        }
        neighbouring_obligations = [n for n in nodes if n["node_id"] in obl_node_ids]

        # 3. Get analytical relationships involving these obligations
        analytical_types = {"CONFLICTS_WITH", "DUPLICATES", "OVERLAPS", "COMPLEMENTS"}
        relationships = [
            e for e in edges
            if (e["source"] in obl_node_ids or e["target"] in obl_node_ids)
            and e["relationship"] in analytical_types
        ]

        # 4. Get Analysis nodes connected to these obligations
        # Find analysis IDs connected via GENERATED_ANALYSIS
        analysis_ids = {
            e["source"] for e in edges
            if e["target"] in obl_node_ids and e["relationship"] == "GENERATED_ANALYSIS"
        }
        analysis_nodes = [n for n in nodes if n["node_id"] in analysis_ids]

        return {
            "policy_node": policy_node,
            "neighbouring_obligations": neighbouring_obligations,
            "relationships": relationships,
            "analysis_nodes": analysis_nodes
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Policy Graph: Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying policy sub-graph: {str(e)}"
        )


@router.get("/obligation/{obligation_id}", status_code=status.HTTP_200_OK)
def get_obligation_graph_route(obligation_id: str):
    """
    GET /graph/obligation/{obligation_id}
    Returns sub-graph information focused on a single obligation.
    Supports querying by exact node ID (e.g. POL-001_OBL-001) or sequential ID (OBL-001).
    """
    try:
        graph = GraphRepository.load_graph()
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # 1. Find the target Obligation Node
        # Look by exact node_id or by attribute obligation_id
        obl_node = next(
            (n for n in nodes if n["node_type"] == "Obligation" and (
                n["node_id"] == obligation_id or n["attributes"].get("obligation_id") == obligation_id
            )),
            None
        )
        if not obl_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Obligation node '{obligation_id}' not found in the graph."
            )

        obl_node_id = obl_node["node_id"]

        # 2. Get relationships (analytical edges)
        analytical_types = {"CONFLICTS_WITH", "DUPLICATES", "OVERLAPS", "COMPLEMENTS"}
        relationships = [
            e for e in edges
            if (e["source"] == obl_node_id or e["target"] == obl_node_id)
            and e["relationship"] in analytical_types
        ]

        # 3. Find neighbours
        # Neighbours include the other obligations in analytical edges, plus parent policy and topic node
        neighbour_node_ids = set()
        for e in relationships:
            if e["source"] == obl_node_id:
                neighbour_node_ids.add(e["target"])
            else:
                neighbour_node_ids.add(e["source"])

        # Add parent policy
        parent_policy_id = obl_node["attributes"].get("policy_id")
        if parent_policy_id:
            neighbour_node_ids.add(parent_policy_id)

        # Add topic node (from BELONGS_TO_TOPIC edge)
        topic_node_id = next(
            (e["target"] for e in edges if e["source"] == obl_node_id and e["relationship"] == "BELONGS_TO_TOPIC"),
            None
        )
        if topic_node_id:
            neighbour_node_ids.add(topic_node_id)

        neighbours = [n for n in nodes if n["node_id"] in neighbour_node_ids]

        # 4. Get Analysis nodes connected to this obligation
        analysis_ids = {
            e["source"] for e in edges
            if e["target"] == obl_node_id and e["relationship"] == "GENERATED_ANALYSIS"
        }
        analysis_nodes = [n for n in nodes if n["node_id"] in analysis_ids]

        return {
            "obligation_node": obl_node,
            "neighbours": neighbours,
            "relationships": relationships,
            "analysis_nodes": analysis_nodes
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Obligation Graph: Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying obligation sub-graph: {str(e)}"
        )
