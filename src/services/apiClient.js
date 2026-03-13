/**
 * API Client with Professional Session Management
 * 
 * Features:
 * - Automatic JWT token injection
 * - Token expiration pre-check
 * - Session event broadcasting
 * - Offline request queuing
 * - Rate limiting handling
 * - Request/Response logging (dev mode)
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/api';

// --- Session Keys ---
const SESSION_KEYS = {
  LAST_ACTIVITY: 'farmEazy_lastActivity',
  TOKEN_EXPIRY: 'farmEazy_tokenExpiry',
};

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
    headers: { ...config.headers, Authorization: undefined }, // Don't store token
    timestamp: Date.now(),
  });
  setQueue(queue);
}

// --- Token Utilities ---

/**
 * Decode JWT token payload
 */
function decodeJWT(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or about to expire (within 30 seconds)
 */
function isTokenExpiredOrExpiring(token, bufferMs = 30000) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const expiryTime = decoded.exp * 1000;
  return Date.now() >= (expiryTime - bufferMs);
}

/**
 * Broadcast authentication event for cross-component sync
 */
function broadcastAuthEvent(isAuthenticated, reason = null) {
  window.dispatchEvent(new CustomEvent('authStateChange', { 
    detail: { isAuthenticated, reason } 
  }));
}

/**
 * Clear all session data
 */
function clearSessionData() {
  localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.USER_USERNAME);
  localStorage.removeItem(STORAGE_KEYS.USER_FULLNAME);
  localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
  localStorage.removeItem(SESSION_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem('lastLoginBonusDate');
}

// --- Create Axios Instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    
    if (token) {
      // Check if token is expired before making request
      if (isTokenExpiredOrExpiring(token)) {
        console.warn('Token expired or expiring, clearing session');
        clearSessionData();
        broadcastAuthEvent(false, 'expired');
        
        // Do not force navigation here; let the router decide whether to show login or landing page.
        return Promise.reject(new Error('Token expired'));
      }
      
      config.headers.Authorization = `Bearer ${token}`;
      
      // Update last activity on each request
      localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
    }
    
    // Development logging
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
apiClient.interceptors.response.use(
  (response) => {
    // Development logging
    if (import.meta.env.DEV) {
      console.debug(`[API] Response ${response.status} for ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Offline handling - queue POST/PUT/DELETE for retry
    if (!window.navigator.onLine && error.config && ['post', 'put', 'delete'].includes(error.config.method)) {
      queueAction(error.config);
      console.info('Request queued for offline retry');
      return Promise.resolve({ data: { offlineQueued: true, message: 'Request queued for when you are back online' } });
    }

    const status = error.response?.status;

    // Handle authentication errors
    if (status === 401 || status === 403) {
      const errorMessage = error.response?.data?.message || 'Session expired';
      
      console.warn(`Auth error (${status}):`, errorMessage);
      clearSessionData();
      broadcastAuthEvent(false, 'unauthorized');
      
      // Store logout reason; routing decisions are handled by the app.
      sessionStorage.setItem('logoutReason', 
        status === 401 
          ? 'Your session has expired. Please log in again.' 
          : 'You are not authorized to access this resource. Please log in again.'
      );
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn(`Rate limited. Retry after: ${retryAfter || 'unknown'} seconds`);
      error.isRateLimited = true;
      error.retryAfter = retryAfter;
    }

    // Handle server errors
    if (status >= 500) {
      console.error(`Server error (${status}):`, error.response?.data?.message || 'Internal server error');
    }

    return Promise.reject(error);
  }
);

// --- Offline Queue Processing ---
async function processOfflineQueue() {
  const queue = getQueue();
  if (!queue.length) return;
  
  console.info(`Processing ${queue.length} queued offline requests`);
  const newQueue = [];
  
  for (const action of queue) {
    try {
      await apiClient({
        url: action.url,
        method: action.method,
        data: action.data,
        headers: action.headers,
      });
      console.debug(`Queued request succeeded: ${action.method} ${action.url}`);
    } catch (err) {
      // Keep failed requests for retry
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        newQueue.push(action);
      }
    }
  }
  
  setQueue(newQueue);
  
  if (newQueue.length > 0) {
    console.info(`${newQueue.length} requests still queued`);
  }
}

// Process queue when coming back online
window.addEventListener('online', () => {
  console.info('Back online, processing queued requests');
  processOfflineQueue();
});

export default apiClient;

// Export utilities for use in components
export { clearSessionData, broadcastAuthEvent, isTokenExpiredOrExpiring };
