// --- Offline Action Queue ---
const OFFLINE_QUEUE_KEY = 'farmEazy_offlineQueue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function queueAction(config) {
  const queue = getQueue();
  queue.push({
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
    timestamp: Date.now(),
  });
  setQueue(queue);
}

async function processQueue() {
  const queue = getQueue();
  if (!queue.length) return;
  const newQueue = [];
  for (const action of queue) {
    try {
      await apiClient({
        url: action.url,
        method: action.method,
        data: action.data,
        headers: action.headers,
      });
    } catch {
      newQueue.push(action); // Keep if still failing
    }
  }
  setQueue(newQueue);
}

window.addEventListener('online', processQueue);
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
    // Offline queue for POST/PUT/DELETE
    if (!window.navigator.onLine && error.config && ['post','put','delete'].includes(error.config.method)) {
      queueAction(error.config);
      alert('You are offline. Action will be retried when back online.');
      return Promise.resolve({ data: { offlineQueued: true } });
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear ALL user data and redirect to login if unauthorized
      localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem('farmEazy_username');
      localStorage.removeItem('farmEazy_fullName');
      localStorage.removeItem('lastLoginBonusDate');
      
       // Show alert to user
       if (window.location.pathname !== '/login') {
         alert('Your session has expired or your account has been deleted. Please login again.');
         window.location.href = '/login';
       }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
