import api from './api';

export const pipelineService = {
  /**
   * Kicks off the E2E policy analysis pipeline on the backend.
   * The backend returns 202 Accepted immediately.
   * The caller should then poll getPipelineStatus() until percentage === 100.
   * @param {string} filename The policy filename.
   */
  runPipeline: async (filename) => {
    const response = await api.post(`/pipeline/run/${encodeURIComponent(filename)}`, {}, {
      timeout: 15000  // Just long enough for the 202 acknowledgement
    });
    return response.data;  // { status: 'started', policy, message }
  },

  /**
   * Fetches the current execution progress of the pipeline.
   * Poll this every 2-3 seconds after calling runPipeline().
   * completed === total means the pipeline finished.
   */
  getPipelineStatus: async () => {
    const response = await api.get('/pipeline/status', { timeout: 5000 });
    return response.data;
    // Returns: { current_step, completed, total, percentage, error }
  },

  /**
   * Waits for the pipeline to reach 100% by polling every 2 seconds.
   * Calls onProgress(statusObj) on each tick.
   * Resolves with the final status or rejects on error.
   */
  waitForCompletion: (onProgress, intervalMs = 2000, maxWaitMs = 600000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(async () => {
        try {
          const status = await pipelineService.getPipelineStatus();
          if (onProgress) onProgress(status);

          if (status.current_step === 'Completed' || status.percentage >= 100) {
            clearInterval(timer);
            resolve(status);
          } else if (status.current_step?.startsWith('Failed') || status.error) {
            clearInterval(timer);
            reject(new Error(status.error || status.current_step));
          } else if (Date.now() - start > maxWaitMs) {
            clearInterval(timer);
            reject(new Error('Pipeline timed out after 10 minutes.'));
          }
        } catch (err) {
          clearInterval(timer);
          reject(err);
        }
      }, intervalMs);
    });
  }
};

export default pipelineService;
