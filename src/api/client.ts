import axios from 'axios';

// Create a central Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Interceptor for common tasks (like adding an Auth token)
apiClient.interceptors.request.use(
  (config) => {
    // You can retrieve and add an auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling global errors (like token expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors like 401 (unauthorized)
    if (error.response?.status === 401) {
      console.error('Session expired, logging out...');
      // Logic for logout could go here
    }
    return Promise.reject(error);
  }
);

export default apiClient;
