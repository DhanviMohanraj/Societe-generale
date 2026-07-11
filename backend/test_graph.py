import unittest
from unittest.mock import patch, MagicMock
import os
import json
import networkx as nx
from fastapi.testclient import TestClient

from app.main import app
from app.services.node_builder import NodeBuilder
from app.services.edge_builder import EdgeBuilder
from app.services.graph_builder import GraphBuilder
from app.services.graph_intelligence_service import GraphIntelligenceService
from app.services.graph_repository import GraphRepository
from app.schemas.graph_schema import GraphNode, GraphEdge
from app.schemas.knowledge_record import KnowledgeRecord
from app.schemas.analysis_record import AnalysisRecord, ReasoningTrace

class TestPolicyKnowledgeGraph(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        
        # Setup mock inputs
        self.mock_policies = [
            {"policy_id": "POL-001", "policy_name": "password_policy.pdf", "status": "ACTIVE"},
            {"policy_id": "POL-002", "policy_name": "cloud_policy.pdf", "status": "ACTIVE"}
        ]
        
        self.mock_obligations = [
            KnowledgeRecord(
                policy_id="POL-001",
                policy_name="password_policy.pdf",
                obligation_id="OBL-001",
                canonical_text="Employees rotate passwords every 90 days.",
                subject="Employees",
                action="rotate",
                object="passwords",
                condition="",
                frequency="every 90 days",
                strength="MANDATORY",
                topic="Password Security",
                confidence=0.98,
                embedding=[0.1] * 384,
                embedding_dimension=384,
                embedding_model="BAAI/bge-small-en-v1.5",
                created_at="2026-07-11T12:00:00Z"
            ),
            KnowledgeRecord(
                policy_id="POL-002",
                policy_name="cloud_policy.pdf",
                obligation_id="OBL-002",
                canonical_text="Users rotate credentials monthly.",
                subject="Users",
                action="rotate",
                object="credentials",
                condition="",
                frequency="monthly",
                strength="RECOMMENDED",
                topic="Cloud Security",
                confidence=0.95,
                embedding=[0.2] * 384,
                embedding_dimension=384,
                embedding_model="BAAI/bge-small-en-v1.5",
                created_at="2026-07-11T12:00:00Z"
            )
        ]
        
        self.mock_analyses = [
            AnalysisRecord(
                analysis_id="ANL-001",
                match_id="MATCH-001",
                source_policy_id="POL-001",
                target_policy_id="POL-002",
                source_obligation_id="OBL-001",
                target_obligation_id="OBL-002",
                source_text="Employees rotate passwords every 90 days.",
                target_text="Users rotate credentials monthly.",
                semantic_similarity=0.85,
                relationship="CONFLICT",
                confidence=0.90,
                severity="HIGH",
                reason="Both describe rotation schedules but have conflicting frequencies.",
                recommendation="Harmonize rotating schedules.",
                reasoning_trace=ReasoningTrace(
                    semantic_similarity=0.85,
                    llm_observation="Comparison details",
                    decision_basis="Decision base info"
                ),
                llm_model="qwen2.5:7b",
                created_at="2026-07-11T12:00:00Z",
                status="COMPLETED"
            )
        ]

    # ==========================================
    # Service 1: Node Builder Tests
    # ==========================================
    def test_node_builder_label_cleaning(self):
        self.assertEqual(NodeBuilder.clean_policy_label("password_policy.pdf"), "Password Policy")
        self.assertEqual(NodeBuilder.clean_policy_label("cloud-security-v2.pdf"), "Cloud Security V2")
        self.assertEqual(NodeBuilder.clean_policy_label("IT_Policy_General.pdf"), "It Policy General")

    def test_node_builder_strength_to_severity(self):
        self.assertEqual(NodeBuilder.map_strength_to_severity("MANDATORY"), "HIGH")
        self.assertEqual(NodeBuilder.map_strength_to_severity("PROHIBITED"), "CRITICAL")
        self.assertEqual(NodeBuilder.map_strength_to_severity("RECOMMENDED"), "MEDIUM")
        self.assertEqual(NodeBuilder.map_strength_to_severity("OPTIONAL"), "LOW")
        self.assertEqual(NodeBuilder.map_strength_to_severity("UNKNOWN"), "LOW")

    def test_node_builder_build_nodes(self):
        nodes = NodeBuilder.build_nodes(self.mock_policies, self.mock_obligations, self.mock_analyses)
        
        # Expecting: 2 Policies, 2 Obligations, 2 Topics, 1 Analysis = 7 nodes
        self.assertEqual(len(nodes), 7)
        
        node_types = [n.node_type for n in nodes]
        self.assertEqual(node_types.count("Policy"), 2)
        self.assertEqual(node_types.count("Obligation"), 2)
        self.assertEqual(node_types.count("Topic"), 2)
        self.assertEqual(node_types.count("Analysis"), 1)

        # Check policy attributes
        pol1 = next(n for n in nodes if n.node_id == "POL-001")
        self.assertEqual(pol1.label, "Password Policy")
        self.assertEqual(pol1.attributes["status"], "ACTIVE")

        # Check obligation attributes
        obl1 = next(n for n in nodes if n.node_id == "POL-001_OBL-001")
        self.assertEqual(obl1.attributes["canonical_text"], "Employees rotate passwords every 90 days.")
        self.assertEqual(obl1.attributes["severity"], "HIGH")

    # ==========================================
    # Service 2: Edge Builder Tests
    # ==========================================
    def test_edge_builder_build_edges(self):
        edges = EdgeBuilder.build_edges(self.mock_obligations, self.mock_analyses)
        
        # Expecting:
        # 2 HAS_OBLIGATION structural edges
        # 2 BELONGS_TO_TOPIC structural edges
        # 2 GENERATED_ANALYSIS edges (analysis -> source/target obligations)
        # 1 CONFLICTS_WITH edge (source obligation -> target obligation)
        # Total = 7 edges
        self.assertEqual(len(edges), 7)

        rel_types = [e.relationship for e in edges]
        self.assertEqual(rel_types.count("HAS_OBLIGATION"), 2)
        self.assertEqual(rel_types.count("BELONGS_TO_TOPIC"), 2)
        self.assertEqual(rel_types.count("GENERATED_ANALYSIS"), 2)
        self.assertEqual(rel_types.count("CONFLICTS_WITH"), 1)

        # Check CONFLICTS_WITH details
        conflict_edge = next(e for e in edges if e.relationship == "CONFLICTS_WITH")
        self.assertEqual(conflict_edge.source, "POL-001_OBL-001")
        self.assertEqual(conflict_edge.target, "POL-002_OBL-002")
        self.assertEqual(conflict_edge.confidence, 0.90)
        self.assertEqual(conflict_edge.severity, "HIGH")

    # ==========================================
    # Service 3: Graph Builder & Validation Tests
    # ==========================================
    def test_graph_validation_duplicate_nodes(self):
        nodes = [
            GraphNode(node_id="POL-001", node_type="Policy", type="Policy", label="A", attributes={}),
            GraphNode(node_id="POL-001", node_type="Policy", type="Policy", label="B", attributes={})
        ]
        edges = []
        with self.assertRaises(ValueError) as ctx:
            GraphBuilder.validate_graph(nodes, edges)
        self.assertIn("Duplicate node IDs detected", str(ctx.exception))

    def test_graph_validation_duplicate_edges(self):
        nodes = [
            GraphNode(node_id="POL-001", node_type="Policy", type="Policy", label="A", attributes={}),
            GraphNode(node_id="POL-002", node_type="Policy", type="Policy", label="B", attributes={})
        ]
        edges = [
            GraphEdge(source="POL-001", target="POL-002", edge_id="E1", relationship="TEST", attributes={}),
            GraphEdge(source="POL-001", target="POL-002", edge_id="E2", relationship="TEST", attributes={})
        ]
        with self.assertRaises(ValueError) as ctx:
            GraphBuilder.validate_graph(nodes, edges)
        self.assertIn("Duplicate edge connection detected", str(ctx.exception))

    def test_graph_validation_dangling_edge(self):
        nodes = [
            GraphNode(node_id="POL-001", node_type="Policy", type="Policy", label="A", attributes={})
        ]
        edges = [
            GraphEdge(source="POL-001", target="POL-002", edge_id="E1", relationship="TEST", attributes={})
        ]
        with self.assertRaises(ValueError) as ctx:
            GraphBuilder.validate_graph(nodes, edges)
        self.assertIn("references non-existent target node", str(ctx.exception))

    # ==========================================
    # Service 4: Graph Intelligence Service Tests
    # ==========================================
    def test_risk_score_calculation(self):
        # 100 base, -10 per conflict, -3 per overlap, -1 per duplicate
        self.assertEqual(GraphIntelligenceService.calculate_risk_score(0, 0, 0), 100)
        self.assertEqual(GraphIntelligenceService.calculate_risk_score(1, 2, 3), 100 - 10 - 6 - 3) # 81
        self.assertEqual(GraphIntelligenceService.calculate_risk_score(15, 0, 0), 0) # bounded to 0
        self.assertEqual(GraphIntelligenceService.calculate_risk_score(-1, 0, 0), 100) # capped

    def test_graph_intelligence_analysis(self):
        nodes = NodeBuilder.build_nodes(self.mock_policies, self.mock_obligations, self.mock_analyses)
        edges = EdgeBuilder.build_edges(self.mock_obligations, self.mock_analyses)
        G = GraphBuilder.build_networkx_graph(nodes, edges)
        
        stats, intel = GraphIntelligenceService.analyze_graph(G, nodes, edges, self.mock_obligations, self.mock_analyses)
        
        # Verify stats
        self.assertEqual(stats.total_policies, 2)
        self.assertEqual(stats.total_obligations, 2)
        self.assertEqual(stats.total_topics, 2)
        self.assertEqual(stats.total_relationships, 1) # only CONFLICTS_WITH is the analytical relationship
        self.assertEqual(stats.total_conflicts, 1)
        self.assertEqual(stats.total_duplicates, 0)
        
        # Verify policy metrics risk scores
        self.assertEqual(intel.policy_metrics["POL-001"].risk_score, 90) # 100 - 10
        self.assertEqual(intel.policy_metrics["POL-002"].risk_score, 90) # 100 - 10
        self.assertEqual(intel.policy_metrics["POL-001"].topic_count, 1)
        
        # Verify topic metrics
        self.assertEqual(intel.topic_metrics["TOPIC_PASSWORD_SECURITY"]["obligation_count"], 1)
        self.assertEqual(intel.topic_metrics["TOPIC_CLOUD_SECURITY"]["conflict_count"], 1)

    # ==========================================
    # API Router Tests
    # ==========================================
    @patch("app.services.graph_builder.AnalysisRepository.load_analysis_records")
    @patch("app.services.graph_builder.RepositoryService.get_policies")
    @patch("app.services.graph_builder.RepositoryLoader.load_knowledge_records")
    @patch("app.services.graph_repository.GraphRepository.save_graph")
    @patch("app.services.graph_repository.GraphRepository.save_graph_intelligence")
    @patch("app.services.graph_repository.GraphRepository.save_graph_statistics")
    def test_api_build_graph(self, mock_save_stats, mock_save_intel, mock_save_graph, mock_load_krs, mock_get_policies, mock_load_analyses):
        mock_load_analyses.return_value = self.mock_analyses
        mock_get_policies.return_value = self.mock_policies
        mock_load_krs.return_value = self.mock_obligations

        response = self.client.post("/graph/build")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["total_policies"], 2)
        self.assertEqual(data["total_obligations"], 2)
        
        mock_save_graph.assert_called_once()
        mock_save_intel.assert_called_once()
        mock_save_stats.assert_called_once()

    @patch("app.services.graph_repository.GraphRepository.load_graph")
    def test_api_get_graph(self, mock_load_graph):
        mock_graph_data = {"nodes": [{"node_id": "POL-001", "node_type": "Policy", "type": "Policy", "label": "L", "attributes": {}}], "edges": []}
        mock_load_graph.return_value = mock_graph_data

        response = self.client.get("/graph")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_graph_data)

    @patch("app.services.graph_repository.GraphRepository.load_graph_statistics")
    def test_api_get_statistics(self, mock_load_stats):
        mock_stats = {"total_policies": 2, "total_obligations": 2}
        mock_load_stats.return_value = mock_stats

        response = self.client.get("/graph/statistics")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_stats)

    @patch("app.services.graph_repository.GraphRepository.load_graph_intelligence")
    def test_api_get_intelligence(self, mock_load_intel):
        mock_intel = {"policy_metrics": {"POL-001": {"risk_score": 100}}, "obligation_metrics": {}, "topic_metrics": {}, "relationship_metrics": []}
        mock_load_intel.return_value = mock_intel

        response = self.client.get("/graph/intelligence")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_intel)

    @patch("app.services.graph_repository.GraphRepository.load_graph")
    def test_api_get_policy_graph(self, mock_load_graph):
        # We need a proper mock graph structure to query policy sub-graph
        nodes = NodeBuilder.build_nodes(self.mock_policies, self.mock_obligations, self.mock_analyses)
        edges = EdgeBuilder.build_edges(self.mock_obligations, self.mock_analyses)
        
        # Set node risk scores and metrics similar to build pipeline
        for n in nodes:
            if n.node_type == "Policy":
                n.attributes["risk_score"] = 90
                
        mock_graph_data = {
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges]
        }
        mock_load_graph.return_value = mock_graph_data

        response = self.client.get("/graph/policy/POL-001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("policy_node", data)
        self.assertEqual(data["policy_node"]["node_id"], "POL-001")
        self.assertEqual(len(data["neighbouring_obligations"]), 1)
        self.assertEqual(data["neighbouring_obligations"][0]["node_id"], "POL-001_OBL-001")
        self.assertEqual(len(data["relationships"]), 1)
        self.assertEqual(data["relationships"][0]["relationship"], "CONFLICTS_WITH")
        self.assertEqual(len(data["analysis_nodes"]), 1)
        self.assertEqual(data["analysis_nodes"][0]["node_id"], "ANL-001")

    @patch("app.services.graph_repository.GraphRepository.load_graph")
    def test_api_get_obligation_graph(self, mock_load_graph):
        nodes = NodeBuilder.build_nodes(self.mock_policies, self.mock_obligations, self.mock_analyses)
        edges = EdgeBuilder.build_edges(self.mock_obligations, self.mock_analyses)
        mock_graph_data = {
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges]
        }
        mock_load_graph.return_value = mock_graph_data

        # Query by exact node ID
        response = self.client.get("/graph/obligation/POL-001_OBL-001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["obligation_node"]["node_id"], "POL-001_OBL-001")
        self.assertEqual(len(data["relationships"]), 1)
        
        # Query by simple obligation_id
        response2 = self.client.get("/graph/obligation/OBL-002")
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        self.assertEqual(data2["obligation_node"]["node_id"], "POL-002_OBL-002")

if __name__ == "__main__":
    unittest.main()
