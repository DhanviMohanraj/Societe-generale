import unittest
from unittest.mock import patch, MagicMock
import os
import json
from fastapi.testclient import TestClient

from app.main import app
from app.services.governance_metrics_service import GovernanceMetricsService
from app.services.governance_score_service import GovernanceScoreService
from app.services.recommendation_service import RecommendationService
from app.services.executive_summary_service import ExecutiveSummaryService
from app.services.governance_snapshot_service import GovernanceSnapshotService
from app.services.analytics_repository import AnalyticsRepository
from app.schemas.governance_schema import PolicyGovernanceMetrics, PolicySummary

class TestPolicyGovernanceEngine(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        
        self.mock_graph_data = {
            "nodes": [
                {"node_id": "POL-001", "node_type": "Policy", "type": "Policy", "label": "Password Policy", "attributes": {"policy_name": "password_policy.pdf"}},
                {"node_id": "POL-002", "node_type": "Policy", "type": "Policy", "label": "Cloud Policy", "attributes": {"policy_name": "cloud_policy.pdf"}},
                {"node_id": "POL-001_OBL-001", "node_type": "Obligation", "type": "Obligation", "label": "OBL-001", "attributes": {"policy_id": "POL-001"}},
                {"node_id": "POL-001_OBL-002", "node_type": "Obligation", "type": "Obligation", "label": "OBL-002", "attributes": {"policy_id": "POL-001"}},
                {"node_id": "POL-002_OBL-001", "node_type": "Obligation", "type": "Obligation", "label": "OBL-001", "attributes": {"policy_id": "POL-002"}},
                {"node_id": "TOPIC_PASSWORD_SECURITY", "node_type": "Topic", "type": "Topic", "label": "Password Security", "attributes": {}},
                {"node_id": "TOPIC_CLOUD_SECURITY", "node_type": "Topic", "type": "Topic", "label": "Cloud Security", "attributes": {}},
                {"node_id": "ANL-001", "node_type": "Analysis", "type": "Analysis", "label": "ANL-001", "attributes": {}}
            ],
            "edges": [
                {"source": "POL-001", "target": "POL-001_OBL-001", "edge_id": "E1", "relationship": "HAS_OBLIGATION"},
                {"source": "POL-001", "target": "POL-001_OBL-002", "edge_id": "E2", "relationship": "HAS_OBLIGATION"},
                {"source": "POL-002", "target": "POL-002_OBL-001", "edge_id": "E3", "relationship": "HAS_OBLIGATION"},
                {"source": "POL-001_OBL-001", "target": "TOPIC_PASSWORD_SECURITY", "edge_id": "E4", "relationship": "BELONGS_TO_TOPIC"},
                {"source": "POL-001_OBL-002", "target": "TOPIC_PASSWORD_SECURITY", "edge_id": "E5", "relationship": "BELONGS_TO_TOPIC"},
                {"source": "POL-002_OBL-001", "target": "TOPIC_CLOUD_SECURITY", "edge_id": "E6", "relationship": "BELONGS_TO_TOPIC"},
                {"source": "POL-001_OBL-001", "target": "POL-002_OBL-001", "edge_id": "E7", "relationship": "CONFLICTS_WITH"}
            ]
        }

        self.mock_analysis_records = [
            {
                "analysis_id": "ANL-001",
                "source_policy_id": "POL-001",
                "target_policy_id": "POL-002",
                "source_obligation_id": "OBL-001",
                "target_obligation_id": "OBL-001",
                "relationship": "CONFLICT",
                "confidence": 0.95,
                "severity": "CRITICAL",
                "reason": "Reason details",
                "recommendation": "Rec details"
            }
        ]

    # ==========================================
    # Service 1: Governance Metrics Service Tests
    # ==========================================
    def test_metrics_computation(self):
        metrics_list = GovernanceMetricsService.compute_metrics(self.mock_graph_data, self.mock_analysis_records)
        
        self.assertEqual(len(metrics_list), 2)
        
        pol1 = next(m for m in metrics_list if m.policy_id == "POL-001")
        self.assertEqual(pol1.obligation_count, 2)
        self.assertEqual(pol1.conflict_count, 1)
        self.assertEqual(pol1.critical_conflicts, 1)
        self.assertEqual(pol1.average_ai_confidence, 0.95)
        self.assertEqual(pol1.graph_connectivity, 2) # out-degree is 2 (2 HAS_OBLIGATION edges)
        self.assertEqual(pol1.topic_coverage, 1)

    # ==========================================
    # Service 2: Governance Score Service Tests
    # ==========================================
    def test_score_calculation(self):
        # Perfect policy
        score1 = GovernanceScoreService.calculate_score(0, 0, 0, 0, 0, 0.95)
        self.assertEqual(score1, 100) # Starts at 100, adds 2 for confidence >= 0.90 but clamped to 100

        # Policy with critical conflict and duplicates
        # Base 100 - (15 * 1) - (2 * 2) = 100 - 15 - 4 = 81. + 2 bonus = 83
        score2 = GovernanceScoreService.calculate_score(1, 0, 0, 2, 0, 0.92)
        self.assertEqual(score2, 83)

        # Policy with low confidence
        # Base 100 - 10 (high) - 5 (medium) = 85. No bonus because confidence < 0.90
        score3 = GovernanceScoreService.calculate_score(0, 1, 1, 0, 0, 0.85)
        self.assertEqual(score3, 85)

        # Min clamp test
        score4 = GovernanceScoreService.calculate_score(10, 0, 0, 0, 0, 0.50)
        self.assertEqual(score4, 0)

    def test_classify_risk_level(self):
        self.assertEqual(GovernanceScoreService.classify_risk_level(95), "LOW")
        self.assertEqual(GovernanceScoreService.classify_risk_level(90), "LOW")
        self.assertEqual(GovernanceScoreService.classify_risk_level(85), "MEDIUM")
        self.assertEqual(GovernanceScoreService.classify_risk_level(80), "MEDIUM")
        self.assertEqual(GovernanceScoreService.classify_risk_level(75), "HIGH")
        self.assertEqual(GovernanceScoreService.classify_risk_level(60), "HIGH")
        self.assertEqual(GovernanceScoreService.classify_risk_level(59), "CRITICAL")
        self.assertEqual(GovernanceScoreService.classify_risk_level(0), "CRITICAL")

    # ==========================================
    # Service 3: Recommendation Service Tests
    # ==========================================
    def test_recommendation_generation(self):
        # Low coverage and critical conflict
        metrics1 = PolicyGovernanceMetrics(
            policy_id="POL-001",
            policy_name="p1.pdf",
            obligation_count=5,
            conflict_count=1,
            duplicate_count=0,
            overlap_count=0,
            complementary_count=0,
            independent_count=0,
            critical_conflicts=1,
            high_conflicts=0,
            medium_conflicts=0,
            low_conflicts=0,
            average_ai_confidence=0.95,
            graph_connectivity=5,
            topic_coverage=1,
            recommendation_count=0
        )
        recs = RecommendationService.generate_recommendations(metrics1)
        self.assertIn("Immediately review conflicting security policies.", recs)
        self.assertIn("Expand policy coverage.", recs)
        self.assertEqual(RecommendationService.determine_priority(metrics1), "CRITICAL")

        # Perfect policy fallback
        metrics2 = PolicyGovernanceMetrics(
            policy_id="POL-002",
            policy_name="p2.pdf",
            obligation_count=1,
            conflict_count=0,
            duplicate_count=0,
            overlap_count=0,
            complementary_count=0,
            independent_count=0,
            critical_conflicts=0,
            high_conflicts=0,
            medium_conflicts=0,
            low_conflicts=0,
            average_ai_confidence=1.0,
            graph_connectivity=1,
            topic_coverage=1,
            recommendation_count=0
        )
        recs2 = RecommendationService.generate_recommendations(metrics2)
        self.assertEqual(len(recs2), 1)
        self.assertEqual(recs2[0], "Maintain current policy compliance levels. Run periodic reviews.")
        self.assertEqual(RecommendationService.determine_priority(metrics2), "LOW")

    # ==========================================
    # Service 4: Executive Summary Service Tests
    # ==========================================
    def test_executive_summary(self):
        summaries = [
            PolicySummary(
                policy_id="POL-001",
                policy_name="p1.pdf",
                governance_score=60,
                risk_level="HIGH",
                conflict_count=1,
                duplicate_count=0,
                overlap_count=0,
                critical_conflicts=0,
                average_ai_confidence=0.95,
                recommendation_priority="HIGH",
                recommendations=["Rec1"]
            ),
            PolicySummary(
                policy_id="POL-002",
                policy_name="p2.pdf",
                governance_score=100,
                risk_level="LOW",
                conflict_count=0,
                duplicate_count=0,
                overlap_count=0,
                critical_conflicts=0,
                average_ai_confidence=1.0,
                recommendation_priority="LOW",
                recommendations=["Rec2"]
            )
        ]

        stats_data = {
            "total_obligations": 10,
            "total_conflicts": 1,
            "total_duplicates": 0,
            "total_overlaps": 0,
            "average_confidence": 0.975,
            "graph_density": 0.05
        }

        conflict_records = [{"severity": "CRITICAL"}]

        summary = ExecutiveSummaryService.generate_summary(summaries, stats_data, conflict_records, 2)
        
        self.assertEqual(summary["overall_governance_score"], 80) # (60 + 100) / 2 = 80
        self.assertEqual(summary["overall_risk_level"], "MEDIUM")
        self.assertEqual(summary["total_policies"], 2)
        self.assertEqual(summary["critical_conflicts"], 1)
        self.assertEqual(summary["high_risk_policies"], 1) # POL-001 is HIGH
        self.assertEqual(len(summary["top_recommendations"]), 2)

    # ==========================================
    # API Routes Tests
    # ==========================================
    @patch("app.services.governance_snapshot_service.GraphRepository.load_graph")
    @patch("app.services.governance_snapshot_service.GraphRepository.load_graph_statistics")
    @patch("app.services.governance_snapshot_service.GraphRepository.load_graph_intelligence")
    @patch("app.services.governance_snapshot_service.AnalysisRepository.load_analysis_records")
    @patch("app.services.analytics_repository.AnalyticsRepository.save_snapshot")
    @patch("app.services.analytics_repository.AnalyticsRepository.save_statistics")
    @patch("app.services.analytics_repository.AnalyticsRepository.save_policy_governance")
    @patch("app.services.analytics_repository.AnalyticsRepository.save_recommendations")
    def test_api_build_governance(self, mock_save_recs, mock_save_pol_gov, mock_save_stats, mock_save_snapshot, mock_load_analyses, mock_load_intel, mock_load_stats, mock_load_graph):
        mock_load_graph.return_value = self.mock_graph_data
        mock_load_stats.return_value = {"total_obligations": 3, "total_conflicts": 1, "total_duplicates": 0, "total_overlaps": 0, "average_confidence": 0.95, "graph_density": 0.05}
        mock_load_intel.return_value = {"topic_metrics": {"TOPIC_PASSWORD_SECURITY": {"topic_name": "Password Security", "obligation_count": 2}}}
        mock_load_analyses.return_value = self.mock_analysis_records

        response = self.client.post("/governance/build")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["total_policies"], 2)
        
        mock_save_snapshot.assert_called_once()
        mock_save_stats.assert_called_once()
        mock_save_pol_gov.assert_called_once()
        mock_save_recs.assert_called_once()

    @patch("app.services.analytics_repository.AnalyticsRepository.load_snapshot")
    def test_api_get_governance(self, mock_load_snapshot):
        mock_snapshot = {"overall_governance_score": 80, "policy_summaries": []}
        mock_load_snapshot.return_value = mock_snapshot
        
        response = self.client.get("/governance")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_snapshot)

    @patch("app.services.analytics_repository.AnalyticsRepository.load_snapshot")
    def test_api_get_policy_report(self, mock_load_snapshot):
        mock_snapshot = {"policy_summaries": [{"policy_id": "POL-001", "policy_name": "p1.pdf", "governance_score": 90, "risk_level": "LOW", "conflict_count": 0, "duplicate_count": 0, "overlap_count": 0, "critical_conflicts": 0, "average_ai_confidence": 1.0, "recommendation_priority": "LOW", "recommendations": []}]}
        mock_load_snapshot.return_value = mock_snapshot

        response = self.client.get("/governance/policy/POL-001")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["policy_name"], "p1.pdf")

        # Policy not found
        response_err = self.client.get("/governance/policy/POL-999")
        self.assertEqual(response_err.status_code, 404)

if __name__ == "__main__":
    unittest.main()
