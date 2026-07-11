import axios from 'axios';

// Get base URL from Vite environment, fallback to http://localhost:8001 as default
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Log or modify requests here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Standardized error handler
    const customError = {
      message: error.message || 'An unexpected error occurred.',
      status: error.response?.status || null,
      data: error.response?.data || null,
    };

    if (error.response) {
      // Server responded with non-2xx status code
      if (error.response.status === 404) {
        customError.message = error.response.data?.detail || 'Resource not found.';
      } else if (error.response.status === 422) {
        customError.message = error.response.data?.detail || 'Validation error.';
      } else if (error.response.status === 500) {
        customError.message = error.response.data?.detail || 'Internal server error.';
      }
    } else if (error.code === 'ECONNABORTED') {
      customError.message = 'The request timed out. Please try again.';
    } else if (!window.navigator.onLine) {
      customError.message = 'Network failure. Please check your internet connection.';
    }

    return Promise.reject(customError);
  }
);

export default api;
