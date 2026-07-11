import api from './api';

export const governanceService = {
  /**
   * Fetches the central executive governance snapshot.
   */
  getSnapshot: async () => {
    const response = await api.get('/governance');
    return response.data;
  },

  /**
   * Fetches list of summaries for all policies.
   */
  getPolicies: async () => {
    const response = await api.get('/governance/policies');
    return response.data;
  },

  /**
   * Fetches the detailed governance scorecard report for a policy.
   * @param {string} policyId 
   */
  getPolicyReport: async (policyId) => {
    const response = await api.get(`/governance/policy/${encodeURIComponent(policyId)}`);
    return response.data;
  }
};

export default governanceService;
