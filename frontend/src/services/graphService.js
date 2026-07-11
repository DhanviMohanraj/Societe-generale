import api from './api';

export const graphService = {
  /**
   * Fetches the full interactive knowledge graph structure (nodes and edges).
   */
  getGraph: async () => {
    const response = await api.get('/graph');
    return response.data;
  },

  /**
   * Fetches knowledge graph topological statistics.
   */
  getGraphStatistics: async () => {
    const response = await api.get('/graph/statistics');
    return response.data;
  },

  /**
   * Fetches sub-graph focused on a single policy.
   * @param {string} policyId 
   */
  getPolicyGraph: async (policyId) => {
    const response = await api.get(`/graph/policy/${encodeURIComponent(policyId)}`);
    return response.data;
  }
};

export default graphService;
