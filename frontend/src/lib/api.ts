import axios from 'axios';

// =============================================================================
// Sentinel API Client
// =============================================================================
// Centralized Axios instance with JWT interceptors and error handling.

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('sentinel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear state and redirect to login
      sessionStorage.removeItem('sentinel_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
