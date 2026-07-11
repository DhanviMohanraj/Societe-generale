import api from './api';

export const repositoryService = {
  /**
   * Fetches the policy repository summary, including metadata and versioning.
   */
  getRepository: async () => {
    const response = await api.get('/repository');
    return response.data;
  },

  /**
   * Fetches the raw list of all registered policies.
   */
  getPolicies: async () => {
    const response = await api.get('/repository/policies');
    return response.data;
  },

  /**
   * Rebuilds the policy registry by scanning outputs.
   */
  rebuildRepository: async () => {
    const response = await api.post('/repository/rebuild');
    return response.data;
  },

  /**
   * Marks a policy as deleted in the registry.
   * @param {string} policyId 
   */
  deletePolicy: async (policyId) => {
    const response = await api.delete(`/repository/policy/${encodeURIComponent(policyId)}`);
    return response.data;
  },

  /**
   * Uploads a policy PDF to the uploads directory.
   * Handles multipart/form-data.
   * @param {File} file 
   */
  uploadPolicy: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default repositoryService;
