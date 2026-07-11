import api from './api';

export const analysisService = {
  /**
   * Fetches all generated AI Analysis Records.
   */
  getAnalysisRecords: async () => {
    const response = await api.get('/analysis');
    return response.data;
  },

  /**
   * Fetches only conflict-level Analysis Records.
   */
  getConflicts: async () => {
    const response = await api.get('/analysis/conflicts');
    return response.data;
  }
};

export default analysisService;
