/**
 * API Interceptor Configuration
 * 
 * Configures axios to automatically include JWT token in all requests
 * and handle authentication errors
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/api';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to Authorization header
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles 401/403 (unauthorized) errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear ALL user data and redirect to login if unauthorized
      localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem('farmEazy_username');
      localStorage.removeItem('farmEazy_fullName');
      localStorage.removeItem('lastLoginBonusDate');
      
      // Show alert to user
      alert('Your session has expired or your account has been deleted. Please login again.');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
