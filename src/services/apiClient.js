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
import {
  isApiEncryptionEnabled,
  isGatewayEnabled,
  resolveEncryptionSecret,
  resolveGatewayClient,
} from '../config/securityEnv';
import { getApiErrorCode, isLocationRequiredError, isRateLimitError } from '../utils/apiError';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import { enqueueLocationRetry } from './locationApiBridge';

const API_ENCRYPTION_ENABLED = isApiEncryptionEnabled();
const GATEWAY_ENABLED = isGatewayEnabled();
const ENCRYPTION_SECRET = resolveEncryptionSecret();
const GATEWAY_CLIENT = resolveGatewayClient();

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

function deriveLocationHeadersFromSelection(selectionValue) {
  if (!selectionValue) return null;
  try {
    const parsed = JSON.parse(selectionValue);
    if (parsed) {
      if (parsed.type === 'coords' && parsed.latitude != null && parsed.longitude != null) {
        const latitude = Number(parsed.latitude).toFixed(6);
        const longitude = Number(parsed.longitude).toFixed(6);
        return {
          legacy: `Lat ${latitude}, Lon ${longitude}`,
          latitude,
          longitude,
          addressId: null,
        };
      }
      if (parsed.type === 'address' && parsed.id != null) {
        return {
          legacy: `Address ${parsed.id}`,
          latitude: parsed.latitude != null ? Number(parsed.latitude).toFixed(6) : null,
          longitude: parsed.longitude != null ? Number(parsed.longitude).toFixed(6) : null,
          addressId: String(parsed.id),
        };
      }
    }
  } catch (_err) {
    return null;
  }
  return null;
}
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

const FALLBACK_IGNORE_URL_FRAGMENTS = [
  '/products/media/',
  '/health',
  '/actuator/',
  '/notifications/count',
  '/coins/',
  '/system/full-status',
  '/payment/create-order',
  '/faq-questions',
  '/support-tickets/stats/',
  '/blog-posts',
  '/public/',
];

function shouldIgnoreFallbackForUrl(url) {
  const value = String(url || '');
  return FALLBACK_IGNORE_URL_FRAGMENTS.some((fragment) => value.includes(fragment));
}

function shouldForceResilienceMode(error, requestUrl) {
  if (!window.navigator.onLine) {
    return true;
  }
  const status = error?.response?.status;
  if (status === 502 || status === 504) {
    return true;
  }
  const isNetworkError = !error.response
    && (String(error.code || '').toUpperCase() === 'ERR_NETWORK'
      || String(error.message || '').toLowerCase().includes('network'));
  if (!isNetworkError) {
    return false;
  }
  const criticalFragments = ['/users/me', '/auth/login', '/addresses'];
  return criticalFragments.some((fragment) => String(requestUrl || '').includes(fragment));
}

async function resolveUserLocationHeaders() {
  try {
    const selectedLocation = localStorage.getItem('farmeazy_selected_location');
    const derivedHeaders = deriveLocationHeadersFromSelection(selectedLocation);
    if (derivedHeaders?.legacy) {
      const cachedHeader = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedHeader === derivedHeaders.legacy) {
        return derivedHeaders;
      }
      try {
        localStorage.setItem(LOCATION_CACHE_KEY, derivedHeaders.legacy);
        localStorage.setItem(LOCATION_CACHE_TIME_KEY, String(Date.now()));
      } catch {
        // silently ignore storage errors
      }
      return derivedHeaders;
    }
  } catch {
    // ignore storage failures
  }

  return null;
}

function isPublicApiPath(path) {
  const publicPaths = [
    '/api/otp/',
    '/api/public/',
    '/api/faq-question',
    '/api/faq-questions',
    '/api/faq/question',
    '/api/support-tickets/guest',
    '/api/location-access/status',
  ];
  return publicPaths.some((publicPath) => path.startsWith(publicPath));
}

async function createGatewaySignature(message) {
  if (!GATEWAY_CLIENT) {
    throw new Error('Gateway client is not configured');
  }
  if (!import.meta.env.VITE_API_GATEWAY_SECRET) {
    throw new Error('Gateway signature secret is missing');
  }
  const keyData = textEncoder.encode(String(import.meta.env.VITE_API_GATEWAY_SECRET));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(message));
  return toBase64(signatureBuffer);
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

  window.dispatchEvent(new CustomEvent('farmeazy:service-degraded', {
    detail: {
      ...payload,
      userMessage: getUserFacingErrorMessage(
        { response: { status: payload.status, data: { message: payload.message } }, message: payload.message },
        'A background service is temporarily unavailable.',
      ),
    },
  }));

  if (payload.forceResilienceMode) {
    window.dispatchEvent(new CustomEvent(FALLBACK_EVENT_NAME, { detail: payload }));
  }
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
  const secretBytes = textEncoder.encode(secret || '');
  if (secretBytes.length < 32) {
    throw new Error('VITE_API_ENCRYPTION_SECRET must be at least 32 characters');
  }
  const keyBytes = new Uint8Array(32);
  keyBytes.set(secretBytes.subarray(0, 32));
  return keyBytes;
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

/**
 * Backend may encrypt responses even when the frontend request-encryption flag is off.
 * Always decrypt { payload } envelopes when a secret is configured.
 */
async function normalizeApiResponseBody(data) {
  if (data && typeof data === 'object' && typeof data.payload === 'string') {
    if (!ENCRYPTION_SECRET) {
      const error = new Error(
        'API returned an encrypted payload but VITE_API_ENCRYPTION_SECRET is not configured.'
      );
      error.code = 'API_ENCRYPTION_MISCONFIG';
      throw error;
    }
    return decryptPayload(data.payload);
  }
  return data;
}

async function importHmacKey() {
  // Browser HMAC is disabled for Option B (no secrets in browser). Calls should not reach here.
  throw new Error('Browser HMAC import is disabled under the Option B security model');
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
  // Fail-safe: if the token can't be decoded or has no exp, do NOT assume it's expired and
  // trigger a refresh that could clear a valid session right after login. The backend is the
  // authority — if the token is truly invalid it returns 401 and the interceptor handles it.
  const decoded = decodeJWT(token);
  if (!decoded || typeof decoded.exp !== 'number') return false;
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
  localStorage.removeItem('farmEazy_refresh_token');
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
  // Send an encrypted (empty) payload: the backend's ApiRequestDecryptionFilter requires
  // encrypted JSON for POST /auth/refresh. The refresh token itself travels in the HttpOnly
  // cookie (withCredentials), so the body only needs to be a valid encrypted object — sending
  // `null` previously produced `ENCRYPTED_PAYLOAD_REQUIRED` (400), which made every genuine
  // 401 → refresh attempt fail and incorrectly logged the user out.
  const refreshResponse = await apiClient.post('/auth/refresh', {}, {
    _skipAuthRefresh: true,
    timeout: 15000,
    withCredentials: true,
  });

  const newAccessToken = refreshResponse?.data?.token || refreshResponse?.data?.accessToken;

  if (!newAccessToken) {
    throw new Error('Refresh response did not include access token');
  }

  localStorage.setItem(STORAGE_KEYS.USER_TOKEN, newAccessToken);
  return newAccessToken;
}

// --- Create Axios Instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true,
});

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  async (config) => {
    const requestPath = getRequestPathForSignature(config);
    const isPublicApi = isPublicApiPath(requestPath);
    const skipAuthRefresh = Boolean(config._skipAuthRefresh);

    config.headers = config.headers || {};

    if (!isPublicApi && !skipAuthRefresh) {
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
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    // For multipart FormData, never send a manual Content-Type: the browser must generate
    // the multipart boundary. Otherwise the backend (consumes=MULTIPART_FORM_DATA) returns
    // "Content-Type 'application/json' is not supported" (415 -> 500).
    if (isFormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    const contentType = String(config.headers['Content-Type'] || config.headers['content-type'] || '').toLowerCase();
    const shouldEncryptBody = API_ENCRYPTION_ENABLED
      && !isFormData
      && (!contentType || contentType.includes('application/json'));
    const shouldEncrypt = shouldEncryptBody;

    if (shouldEncrypt && config.data && typeof config.data === 'object' && !('payload' in config.data)) {
      if (!ENCRYPTION_SECRET) {
        throw new Error('VITE_API_ENCRYPTION_SECRET is required when API encryption is enabled for this environment');
      }
      const encryptedPayload = await encryptPayload(config.data);
      config.data = { payload: encryptedPayload };
      config.headers['Content-Type'] = 'application/json';
    }

    const locationHeaders = await resolveUserLocationHeaders();
    if (locationHeaders?.legacy) {
      config.headers['X-User-Location'] = locationHeaders.legacy;
      if (locationHeaders.latitude && locationHeaders.longitude) {
        config.headers['X-Current-Latitude'] = locationHeaders.latitude;
        config.headers['X-Current-Longitude'] = locationHeaders.longitude;
      }
      if (locationHeaders.addressId) {
        config.headers['Current-Address-Id'] = locationHeaders.addressId;
      }
    }

    if (GATEWAY_ENABLED) {
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

    if (response?.data) {
      try {
        response.data = await normalizeApiResponseBody(response.data);
      } catch (decryptError) {
        const err = new Error(
          'Could not read the API response. If encryption is enabled on the backend, set VITE_API_ENCRYPTION_SECRET to the same value as API_ENCRYPTION_SECRET.'
        );
        err.code = 'API_DECRYPT_FAILED';
        err.cause = decryptError;
        return Promise.reject(err);
      }
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

    if (status === 403 && hadAuthHeader && isLocationRequiredError(error) && originalRequest && !originalRequest._skipLocationRetry) {
      const retryRequest = { ...originalRequest };
      retryRequest._skipLocationRetry = true;
      return enqueueLocationRetry(() => apiClient(retryRequest));
    }

    if (status === 403 && hadAuthHeader) {
      const errorCode = getApiErrorCode(error);
      if (errorCode === 'LOCATION_REQUIRED') {
        return Promise.reject(error);
      }

      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Not authorized';
      console.warn(`Forbidden (${status}):`, errorMessage);
      sessionStorage.setItem('logoutReason', 'You are not authorized to access this resource.');
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (status === 429 || isRateLimitError(error)) {
      const retryAfter = error.response?.headers?.['retry-after'];
      console.warn(`Rate limited. Retry after: ${retryAfter || 'unknown'} seconds`);
      error.isRateLimited = true;
      error.retryAfter = retryAfter;
      window.dispatchEvent(new CustomEvent('farmeazy:rate-limited', {
        detail: {
          retryAfter,
          message: error.response?.data?.error?.message || error.response?.data?.message || 'Too many requests. Please wait and try again.',
          code: getApiErrorCode(error),
        },
      }));
    }

    // Handle server errors
    if (status >= 500) {
      console.error(`Server error (${status}):`, error.response?.data?.message || 'Internal server error');
    }

    const isNetworkError = !error.response
      && (String(error.code || '').toUpperCase() === 'ERR_NETWORK'
        || String(error.message || '').toLowerCase().includes('network'));
    const isServerError = status >= 500 && status !== 503;
    const shouldNotifyDegraded = (isNetworkError || isServerError)
      && !isAuthEndpoint
      && !shouldIgnoreFallbackForUrl(requestUrl)
      && !originalRequest?._skipFallback;

    if (shouldNotifyDegraded) {
      const forceResilienceMode = shouldForceResilienceMode(error, requestUrl);
      emitGlobalFallback({
        status,
        url: requestUrl,
        method: originalRequest?.method,
        message: error.response?.data?.message || error.message,
        forceResilienceMode,
      });
    }

    error.userMessage = getUserFacingErrorMessage(error);
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
