import axios from 'axios';

// The API_BASE_URL could be loaded from an environment variable for flexibility
// e.g., import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // headers: { 'Content-Type': 'application/json' } // Default, can be overridden
});

// Interceptors can be added here if needed in the future
// For example, to handle token refresh or global error handling:
// apiClient.interceptors.response.use(response => response, error => {
//   if (error.response.status === 401) {
//     // Handle unauthorized errors, e.g., redirect to login
//     // This should ideally be coordinated with AuthContext logic
//     console.error("API client received 401 error");
//   }
//   return Promise.reject(error);
// });

// Note: The x-auth-token header is set globally on axios.defaults.headers.common
// in AuthContext.jsx. This apiClient instance will pick up those defaults.
// If we wanted to isolate it, we could set it here via an interceptor
// that reads the token from localStorage or AuthContext, but the current approach is fine.

export default apiClient;
