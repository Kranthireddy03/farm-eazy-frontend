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

const DEFAULT_BROWSER_SECURITY_FLAG = import.meta.env.PROD ? 'false' : 'true';
const API_ENCRYPTION_ENABLED = (import.meta.env.VITE_API_ENCRYPTION_ENABLED || DEFAULT_BROWSER_SECURITY_FLAG) !== 'false';
const GATEWAY_ENABLED = (import.meta.env.VITE_API_GATEWAY_ENABLED || DEFAULT_BROWSER_SECURITY_FLAG) !== 'false';
// IMPORTANT: Do not store cryptographic secrets in VITE_* for production.
const ENCRYPTION_SECRET = import.meta.env.VITE_API_ENCRYPTION_SECRET || '';
const GATEWAY_CLIENT = import.meta.env.VITE_API_GATEWAY_CLIENT || '';

function getNextGatewayTimestamp() {
  const now = Date.now();
  const scope = globalThis;
  const last = Number(scope.__farmEazyGatewayLastTs || 0);
  const next = now > last ? now : last + 1;
  scope.__farmEazyGatewayLastTs = next;
  return String(next);
}

// --- Session Keys ---
const SESSION_KEYS = {
  LAST_ACTIVITY: 'farmEazy_lastActivity',
  TOKEN_EXPIRY: 'farmEazy_tokenExpiry',
};

const FALLBACK_EVENT_NAME = 'farmeazy:fallback';
const FALLBACK_STATE_KEY = 'farmEazy_fallback_state';
const LAST_SYNC_KEY = 'farmEazy_lastSyncAt';
let lastFallbackEventTs = 0;

// --- Offline Action Queue ---
const LOCATION_CACHE_KEY = 'farmEazy_userLocationHeader';
const LOCATION_CACHE_TIME_KEY = 'farmEazy_userLocationHeaderAt';
const LOCATION_CACHE_TTL_MS = 10 * 60 * 1000;
let locationHeaderPromise = null;
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

function shouldIgnoreFallbackForUrl(url) {
  const value = String(url || '');
  return value.includes('/products/media/') || value.endsWith('/health') || value.includes('/health?');
}

async function resolveUserLocationHeader() {
  try {
    const cachedHeader = localStorage.getItem(LOCATION_CACHE_KEY);
    const cachedAt = Number(localStorage.getItem(LOCATION_CACHE_TIME_KEY) || 0);
    if (cachedHeader && cachedAt && (Date.now() - cachedAt) < LOCATION_CACHE_TTL_MS) {
      return cachedHeader;
    }
  } catch {
    // ignore storage failures
  }

  if (locationHeaderPromise) {
    return locationHeaderPromise;
  }

  locationHeaderPromise = new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude).toFixed(3);
        const longitude = Number(position.coords.longitude).toFixed(3);
        const headerValue = `Lat ${latitude}, Lon ${longitude}`;
        try {
          localStorage.setItem(LOCATION_CACHE_KEY, headerValue);
          localStorage.setItem(LOCATION_CACHE_TIME_KEY, String(Date.now()));
        } catch {
          // ignore storage failures
        }
        resolve(headerValue);
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000,
      }
    );
  }).finally(() => {
    locationHeaderPromise = null;
  });

  return locationHeaderPromise;
}

function shouldAttachLocationHeader(url) {
  const value = String(url || '');
  return value.startsWith('/products') || value.startsWith('/orders') || value.includes('/checkout') || value.startsWith('/location-access');
}


function emitGlobalFallback(detail) {
  const now = Date.now();
  if (now - lastFallbackEventTs < 2500) {
    return;
  }
  lastFallbackEventTs = now;

  const payload = {
    status: detail.status || null,
    url: detail.url || '',
    method: (detail.method || 'GET').toUpperCase(),
    message: detail.message || 'Service unavailable',
    timestamp: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(FALLBACK_STATE_KEY, JSON.stringify(payload));
  } catch {
    // No-op if storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(FALLBACK_EVENT_NAME, { detail: payload }));
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function normalizeEncryptionKey(secret) {
  const raw = textEncoder.encode(secret || '');
  if (raw.length < 32) {
    throw new Error('VITE_API_ENCRYPTION_SECRET must be at least 32 characters');
  }
  return raw.slice(0, 32);
}

async function importAesKey() {
  const keyBytes = normalizeEncryptionKey(ENCRYPTION_SECRET);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptPayload(plainObject) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = textEncoder.encode(JSON.stringify(plainObject));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);
  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);
  return toBase64(combined.buffer);
}

async function decryptPayload(encryptedPayload) {
  const key = await importAesKey();
  const combined = fromBase64(encryptedPayload);
  const iv = combined.slice(0, 12);
  const cipherBytes = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  return JSON.parse(textDecoder.decode(decrypted));
}

async function importHmacKey() {
  // Browser HMAC is disabled for Option B (no secrets in browser). Calls should not reach here.
  throw new Error('Browser HMAC import is disabled under the Option B security model');
}

async function createGatewaySignature(message) {
  // Browser gateway signature creation is disabled for Option B.
  throw new Error('Browser gateway signature creation disabled under Option B security model');
}

function getRequestPathForSignature(config) {
  const requestUrl = String(config.url || '');

  if (/^https?:\/\//i.test(requestUrl)) {
    return new URL(requestUrl).pathname;
  }

  const baseUrl = String(config.baseURL || API_BASE_URL || 'http://localhost:8080/api');
  const base = new URL(baseUrl, 'http://localhost');
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;

  if (!requestUrl || requestUrl === '/') {
    return basePath || '/';
  }

  // If caller already provided an API-rooted path, do not prepend base path again.
  if (requestUrl.startsWith(`${basePath}/`) || requestUrl === basePath) {
    return requestUrl.split('?')[0].split('#')[0];
  }

  const normalizedRequestPath = requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl;
  const combinedPath = `${basePath}/${normalizedRequestPath}`.replace(/\/+/g, '/');
  const pathOnly = combinedPath.startsWith('/') ? combinedPath : `/${combinedPath}`;
  return pathOnly.split('?')[0].split('#')[0];
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
  localStorage.removeItem(STORAGE_KEYS.USER_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.USER_USERNAME);
  localStorage.removeItem(STORAGE_KEYS.USER_FULLNAME);
  localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
  localStorage.removeItem(SESSION_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem('lastLoginBonusDate');
}

let isRefreshingToken = false;
let refreshQueue = [];

function flushRefreshQueue(error, token = null) {
  refreshQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(token);
    }
  });
  refreshQueue = [];
}

async function getOrRefreshAccessToken() {
  if (isRefreshingToken) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshingToken = true;
  try {
    const newToken = await refreshAccessToken();
    flushRefreshQueue(null, newToken);
    return newToken;
  } catch (error) {
    flushRefreshQueue(error, null);
    throw error;
  } finally {
    isRefreshingToken = false;
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.USER_REFRESH_TOKEN);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  const newAccessToken = refreshResponse?.data?.token || refreshResponse?.data?.accessToken;
  const nextRefreshToken = refreshResponse?.data?.refreshToken || refreshResponse?.data?.refresh_token;

  if (!newAccessToken) {
    throw new Error('Refresh response did not include access token');
  }

  localStorage.setItem(STORAGE_KEYS.USER_TOKEN, newAccessToken);
  if (nextRefreshToken) {
    localStorage.setItem(STORAGE_KEYS.USER_REFRESH_TOKEN, nextRefreshToken);
  }

  return newAccessToken;
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
  async (config) => {
    const isPublicApi = Boolean(config.url && (config.url.includes('/faq/question') || config.url.includes('/admin/faq-questions')));

    config.headers = config.headers || {};

    if (!isPublicApi) {
      const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (token) {
        if (isTokenExpiredOrExpiring(token)) {
          try {
            const refreshedToken = await getOrRefreshAccessToken();
            config.headers.Authorization = `Bearer ${refreshedToken}`;
          } catch (_refreshError) {
            console.warn('Token refresh failed, clearing session');
            clearSessionData();
            broadcastAuthEvent(false, 'expired');
            return Promise.reject(new Error('Token expired'));
          }
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
        localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
      }
    }

    const method = String(config.method || '').toLowerCase();
    const requestPath = getRequestPathForSignature(config);
    const shouldSkipRequestEncryption = requestPath.startsWith('/api/auth/')
      || requestPath.startsWith('/api/otp/')
      || requestPath.startsWith('/api/public/')
      || requestPath.startsWith('/api/faq-question')
      || requestPath.startsWith('/api/faq-questions')
      || requestPath.startsWith('/api/faq/question');
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    const contentType = String(config.headers['Content-Type'] || config.headers['content-type'] || '').toLowerCase();
    const shouldEncryptBody = API_ENCRYPTION_ENABLED
      && !shouldSkipRequestEncryption
      && ['post', 'put', 'patch'].includes(method)
      && !isFormData
      && (!contentType || contentType.includes('application/json'));

    if (shouldEncryptBody && config.data && typeof config.data === 'object' && !('payload' in config.data)) {
      if (!ENCRYPTION_SECRET) {
        // In Option B we do not keep secrets in the browser; skip client-side encryption.
        console.warn('Skipping client-side request encryption: no ENCRYPTION_SECRET present');
      } else {
        const encryptedPayload = await encryptPayload(config.data);
        config.data = { payload: encryptedPayload };
        config.headers['Content-Type'] = 'application/json';
      }
    }

    if (shouldAttachLocationHeader(config.url)) {
      const locationHeader = await resolveUserLocationHeader();
      if (locationHeader) {
        config.headers['X-User-Location'] = locationHeader;
      }
    }

    if (GATEWAY_ENABLED) {
      if (!GATEWAY_CLIENT) {
        throw new Error('VITE_API_GATEWAY_CLIENT is required when gateway security is enabled');
      }
      const timestamp = String(Date.now());
      config.headers['X-Gateway-Client'] = GATEWAY_CLIENT;
      config.headers['X-Gateway-Timestamp'] = timestamp;
      const methodUpper = String(config.method || '').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) {
        const nonce = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `nonce-${timestamp}-${Math.random().toString(36).slice(2)}`;
        config.headers['X-Request-Nonce'] = nonce;
      }
    }

    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}${isPublicApi ? ' (public)' : ''}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
apiClient.interceptors.response.use(
  async (response) => {
    const responseUrl = String(response?.config?.url || '');
    if (!shouldIgnoreFallbackForUrl(responseUrl)) {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    }

    if (API_ENCRYPTION_ENABLED && ENCRYPTION_SECRET && response?.data && typeof response.data === 'object' && response.data.payload) {
      response.data = await decryptPayload(response.data.payload);
    }
    // Development logging
    if (import.meta.env.DEV) {
      console.debug(`[API] Response ${response.status} for ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Offline handling - queue POST/PUT/DELETE for retry
    if (!window.navigator.onLine && error.config && ['post', 'put', 'delete'].includes(error.config.method)) {
      queueAction(error.config);
      console.info('Request queued for offline retry');
      return Promise.resolve({ data: { offlineQueued: true, message: 'Request queued for when you are back online' } });
    }

    const status = error.response?.status;
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthEndpoint = requestUrl.includes('/auth/');
    const hadAuthHeader = Boolean(
      originalRequest?.headers?.Authorization || originalRequest?.headers?.authorization
    );

    if (status === 409 && GATEWAY_ENABLED && originalRequest && !originalRequest._gatewayReplayRetry) {
      const conflictMessage = String(error.response?.data?.message || '').toLowerCase();
      if (conflictMessage.includes('replay')) {
        originalRequest._gatewayReplayRetry = true;
        return apiClient(originalRequest);
      }
    }

    // Handle authentication errors
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (!hadAuthHeader) {
        const latestToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        if (latestToken) {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${latestToken}`;
          return apiClient(originalRequest);
        }
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem(STORAGE_KEYS.USER_REFRESH_TOKEN);
      if (!refreshToken) {
        clearSessionData();
        broadcastAuthEvent(false, 'unauthorized');
        sessionStorage.setItem('logoutReason', 'Your session has expired. Please log in again.');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newToken = await getOrRefreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearSessionData();
        broadcastAuthEvent(false, 'unauthorized');
        sessionStorage.setItem('logoutReason', 'Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    if ((status === 401 || status === 403) && hadAuthHeader) {
      const errorMessage = error.response?.data?.message || 'Session expired';
      
      console.warn(`Auth error (${status}):`, errorMessage);
      clearSessionData();
      broadcastAuthEvent(false, 'unauthorized');
      
      // Store logout reason so other parts of the app can display it.
      if (status === 401) {
        sessionStorage.setItem('logoutReason', 'Your session has expired. Please log in again.');
      } else {
        sessionStorage.setItem('logoutReason', 'You are not authorized to access this resource. Please log in again.');
      }

      // Do not force navigation here; leave routing decisions to the application.
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

    const isNetworkError = !error.response
      && (String(error.code || '').toUpperCase() === 'ERR_NETWORK'
        || String(error.message || '').toLowerCase().includes('network'));
    const isServerError = status >= 500;
    const shouldTriggerFallback = (isNetworkError || isServerError)
      && !isAuthEndpoint
      && !shouldIgnoreFallbackForUrl(requestUrl)
      && !originalRequest?._skipFallback;

    if (shouldTriggerFallback) {
      emitGlobalFallback({
        status,
        url: requestUrl,
        method: originalRequest?.method,
        message: error.response?.data?.message || error.message,
      });
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
