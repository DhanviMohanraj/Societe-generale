import logging
import networkx as nx
from typing import List, Dict, Any
from app.schemas.graph_schema import GraphNode, GraphEdge, KnowledgeGraphSchema

from app.services.repository_service import RepositoryService
from app.services.repository_loader import RepositoryLoader
from app.services.analysis_repository import AnalysisRepository
from app.services.node_builder import NodeBuilder
from app.services.edge_builder import EdgeBuilder
from app.services.graph_intelligence_service import GraphIntelligenceService
from app.services.graph_repository import GraphRepository

logger = logging.getLogger(__name__)

class GraphBuilder:
    """
    Responsibilities:
    - Construct the complete NetworkX graph.
    - Perform integrity validations (uniqueness, dangling references).
    - Export serializable node and edge lists.
    """

    @classmethod
    def build_networkx_graph(
        cls,
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> nx.DiGraph:
        """
        Populates and returns a NetworkX DiGraph.
        """
        G = nx.DiGraph()
        
        for n in nodes:
            G.add_node(n.node_id, **n.model_dump())
            
        for e in edges:
            G.add_edge(e.source, e.target, **e.model_dump())
            
        return G

    @classmethod
    def validate_graph(
        cls,
        nodes: List[GraphNode],
        edges: List[GraphEdge]
    ) -> None:
        """
        Validates graph integrity.
        Raises ValueError if any structural integrity constraints are violated.
        """
        logger.info("Graph Builder: Running structural integrity validation.")

        # 1. Unique Node IDs
        node_ids = [n.node_id for n in nodes]
        node_ids_set = set(node_ids)
        if len(node_ids) != len(node_ids_set):
            duplicates = [nid for nid in node_ids_set if node_ids.count(nid) > 1]
            raise ValueError(f"Graph Validation Error: Duplicate node IDs detected: {duplicates}")

        # 2. Unique Edge IDs
        edge_ids = [e.edge_id for e in edges]
        edge_ids_set = set(edge_ids)
        if len(edge_ids) != len(edge_ids_set):
            duplicates = [eid for eid in edge_ids_set if edge_ids.count(eid) > 1]
            raise ValueError(f"Graph Validation Error: Duplicate edge IDs detected: {duplicates}")

        # 3. No Dangling Edges
        for e in edges:
            if e.source not in node_ids_set:
                raise ValueError(f"Graph Validation Error: Dangling edge '{e.edge_id}' references non-existent source node '{e.source}'.")
            if e.target not in node_ids_set:
                raise ValueError(f"Graph Validation Error: Dangling edge '{e.edge_id}' references non-existent target node '{e.target}'.")

        # 4. No Duplicate Edges (same source, target, and relationship)
        seen_connections = set()
        for e in edges:
            conn = (e.source, e.target, e.relationship)
            if conn in seen_connections:
                raise ValueError(f"Graph Validation Error: Duplicate edge connection detected: source='{e.source}', target='{e.target}', relationship='{e.relationship}'")
            seen_connections.add(conn)

        # 5. Graph Connectedness check
        # We construct a temporary NetworkX graph to check connectedness
        G = nx.DiGraph()
        for n in nodes:
            G.add_node(n.node_id)
        for e in edges:
            G.add_edge(e.source, e.target)

        components_count = nx.number_weakly_connected_components(G)
        is_weakly_connected = nx.is_weakly_connected(G) if len(nodes) > 0 else True
        
        logger.info(f"Graph Connectedness Check: Weakly Connected = {is_weakly_connected}, Number of connected components = {components_count}")
        if not is_weakly_connected:
            logger.warning("Graph Connectedness Check: The graph contains multiple disconnected components (normal for independent policies).")

        logger.info("Graph Builder: Validation completed successfully.")

    @classmethod
    def build_graph_pipeline(cls) -> Dict[str, Any]:
        """
        Orchestrates the entire Policy Knowledge Graph construction pipeline.
        Returns a dictionary summarizing execution results.
        """
        logger.info("Analysis Loaded")

        # 1. Load AI Analysis records from Module 6
        try:
            analyses = AnalysisRepository.load_analysis_records()
        except Exception as e:
            logger.error(f"Graph Builder: Failed to load analysis records: {str(e)}")
            raise RuntimeError(f"Failed to load analysis records: {str(e)}") from e

        if not analyses:
            logger.warning("Graph Builder: analysis_records.json is empty or missing.")
            raise FileNotFoundError("Analysis records file is empty or missing. Please run policy reasoning (Module 6) first.")

        # 2. Load registered active policies
        try:
            policies = RepositoryService.get_policies(include_deleted=False)
        except Exception as e:
            logger.error(f"Graph Builder: Failed to load active policies: {str(e)}")
            raise RuntimeError(f"Failed to load active policies: {str(e)}") from e

        # 3. Load obligations using RepositoryLoader
        try:
            obligations = RepositoryLoader.load_knowledge_records()
        except Exception as e:
            logger.error(f"Graph Builder: Failed to load obligations: {str(e)}")
            raise RuntimeError(f"Failed to load obligations: {str(e)}") from e

        # 4. Generate Graph Nodes
        nodes = NodeBuilder.build_nodes(policies, obligations, analyses)
        logger.info("Nodes Created")

        # 5. Generate Graph Edges
        edges = EdgeBuilder.build_edges(obligations, analyses)
        logger.info("Edges Created")

        # 6. Validate Graph Integrity
        cls.validate_graph(nodes, edges)

        # 7. Construct complete NetworkX Graph
        nx_graph = cls.build_networkx_graph(nodes, edges)
        logger.info("Graph Built")

        # 8. Generate Graph Intelligence & Statistics
        statistics, intelligence = GraphIntelligenceService.analyze_graph(
            nx_graph=nx_graph,
            nodes=nodes,
            edges=edges,
            obligations=obligations,
            analyses=analyses
        )
        logger.info("Graph Intelligence Generated")
        logger.info("Statistics Generated")

        # 9. Update Policy Nodes in the nodes list with calculated risk score & counts
        for n in nodes:
            if n.node_type == "Policy" and n.node_id in intelligence.policy_metrics:
                metrics = intelligence.policy_metrics[n.node_id]
                n.attributes["risk_score"] = metrics.risk_score
                n.attributes["conflict_count"] = metrics.conflict_count
                n.attributes["duplicate_count"] = metrics.duplicate_count
                n.attributes["overlap_count"] = metrics.overlap_count

        # Re-build the NetworkX graph with the updated attributes for absolute consistency
        nx_graph = cls.build_networkx_graph(nodes, edges)

        # 10. Persist All Graph Artifacts
        graph_data = {
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges]
        }
        
        try:
            GraphRepository.save_graph(graph_data)
            logger.info("Graph Saved")
            
            GraphRepository.save_graph_intelligence(intelligence.model_dump())
            GraphRepository.save_graph_statistics(statistics.model_dump())
        except Exception as e:
            logger.error(f"Graph Builder: Failed to persist graph artifacts: {str(e)}")
            raise RuntimeError(f"Failed to save graph artifacts: {str(e)}") from e

        logger.info("Completed")

        return {
            "status": "completed",
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "total_policies": statistics.total_policies,
            "total_obligations": statistics.total_obligations,
            "total_topics": statistics.total_topics,
            "total_relationships": statistics.total_relationships,
            "total_conflicts": statistics.total_conflicts,
            "total_duplicates": statistics.total_duplicates,
            "total_overlaps": statistics.total_overlaps
        }
