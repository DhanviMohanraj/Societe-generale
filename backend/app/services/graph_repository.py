import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Base path relative to app/services
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GRAPH_DIR = os.path.join(BASE_DIR, "outputs", "graph")
GRAPH_PATH = os.path.join(GRAPH_DIR, "knowledge_graph.json")
INTEL_PATH = os.path.join(GRAPH_DIR, "graph_intelligence.json")
STATS_PATH = os.path.join(GRAPH_DIR, "graph_statistics.json")

os.makedirs(GRAPH_DIR, exist_ok=True)

class GraphRepository:
    """
    Manages persistence of the Knowledge Graph, Graph Intelligence,
    and Graph Statistics artifacts on disk under outputs/graph/.
    """

    @classmethod
    def save_graph(cls, graph_data: Dict[str, Any]) -> None:
        """Saves the knowledge graph node and edge list as JSON."""
        cls._ensure_directory()
        try:
            with open(GRAPH_PATH, "w", encoding="utf-8") as f:
                json.dump(graph_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Graph Saved: Successfully wrote graph structure to {GRAPH_PATH}")
        except Exception as e:
            logger.error(f"Graph Repository: Failed to save graph structure: {str(e)}")
            raise RuntimeError(f"Storage error saving graph: {str(e)}") from e

    @classmethod
    def load_graph(cls) -> Dict[str, Any]:
        """Loads the knowledge graph structure. Returns empty structure if missing."""
        if not os.path.exists(GRAPH_PATH):
            logger.info("Graph Repository: Graph file missing. Returning empty structure.")
            return {"nodes": [], "edges": []}
        try:
            with open(GRAPH_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Graph Repository: Failed to load graph structure: {str(e)}")
            raise RuntimeError(f"Storage error loading graph: {str(e)}") from e

    @classmethod
    def save_graph_intelligence(cls, intel_data: Dict[str, Any]) -> None:
        """Saves graph intelligence metrics."""
        cls._ensure_directory()
        try:
            with open(INTEL_PATH, "w", encoding="utf-8") as f:
                json.dump(intel_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Graph Intelligence Saved: Successfully wrote metrics to {INTEL_PATH}")
        except Exception as e:
            logger.error(f"Graph Repository: Failed to save graph intelligence: {str(e)}")
            raise RuntimeError(f"Storage error saving intelligence: {str(e)}") from e

    @classmethod
    def load_graph_intelligence(cls) -> Dict[str, Any]:
        """Loads graph intelligence metrics. Returns empty dict if missing."""
        if not os.path.exists(INTEL_PATH):
            logger.info("Graph Repository: Graph intelligence file missing. Returning empty dict.")
            return {"policy_metrics": {}, "obligation_metrics": {}, "topic_metrics": {}, "relationship_metrics": []}
        try:
            with open(INTEL_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Graph Repository: Failed to load graph intelligence: {str(e)}")
            raise RuntimeError(f"Storage error loading intelligence: {str(e)}") from e

    @classmethod
    def save_graph_statistics(cls, stats_data: Dict[str, Any]) -> None:
        """Saves graph analytical statistics."""
        cls._ensure_directory()
        try:
            with open(STATS_PATH, "w", encoding="utf-8") as f:
                json.dump(stats_data, f, ensure_ascii=False, indent=4)
            logger.info(f"Graph Statistics Saved: Successfully wrote statistics to {STATS_PATH}")
        except Exception as e:
            logger.error(f"Graph Repository: Failed to save graph statistics: {str(e)}")
            raise RuntimeError(f"Storage error saving statistics: {str(e)}") from e

    @classmethod
    def load_graph_statistics(cls) -> Dict[str, Any]:
        """Loads graph analytical statistics. Returns empty dict if missing."""
        if not os.path.exists(STATS_PATH):
            logger.info("Graph Repository: Graph statistics file missing. Returning empty dict.")
            return {}
        try:
            with open(STATS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Graph Repository: Failed to load graph statistics: {str(e)}")
            raise RuntimeError(f"Storage error loading statistics: {str(e)}") from e

    @classmethod
    def _ensure_directory(cls) -> None:
        os.makedirs(GRAPH_DIR, exist_ok=True)
