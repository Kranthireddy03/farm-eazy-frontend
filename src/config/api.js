import axios from 'axios';

const DEFAULT_BROWSER_SECURITY_FLAG = import.meta.env.PROD ? 'false' : 'true';
// Gateway in browser now only sends public client id + nonce/timestamp.
// Do NOT rely on browser-side secrets. Backend validates nonces in Redis.
const GATEWAY_ENABLED = (import.meta.env.VITE_API_GATEWAY_ENABLED || DEFAULT_BROWSER_SECURITY_FLAG) !== 'false';
const GATEWAY_CLIENT = import.meta.env.VITE_API_GATEWAY_CLIENT || '';

function getNextGatewayTimestamp() {
    const now = Date.now();
    const scope = globalThis;
    const last = Number(scope.__farmEazyGatewayLastTs || 0);
    const next = now > last ? now : last + 1;
    scope.__farmEazyGatewayLastTs = next;
    return String(next);
}

/**
 * API Configuration and Constants
 * 
 * This file centralizes all API configuration for communicating with the FarmEazy backend.
 */

// Backend API URL from environment variable — default to local development server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const NORMALIZED_API_URL = API_URL.replace(/\/$/, '').replace(/\/api$/, '');
export const API_BASE_URL = `${NORMALIZED_API_URL}/api`;

// Create a configured Axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('farmEazy_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Add public gateway headers for backend nonce-based validation.
        if (GATEWAY_ENABLED) {
            if (!GATEWAY_CLIENT) {
                throw new Error('VITE_API_GATEWAY_CLIENT is required when gateway security is enabled');
            }
            // Non-mutating requests don't need nonce, but include client id and timestamp for logging.
            const ts = String(Date.now());
            config.headers['X-Gateway-Client'] = GATEWAY_CLIENT;
            config.headers['X-Gateway-Timestamp'] = ts;
            // For mutating requests, attach a random nonce to be validated by backend via Redis.
            const method = String(config.method || '').toUpperCase();
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                // Use crypto.randomUUID() when available, fallback to timestamp+random
                const nonce = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `nonce-${ts}-${Math.random().toString(36).slice(2)}`;
                config.headers['X-Request-Nonce'] = nonce;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Centralized error handling (optional but recommended)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;
        const replayMessage = String(error.response?.data?.message || '').toLowerCase();

        if (status === 409 && GATEWAY_ENABLED && originalRequest && !originalRequest._gatewayReplayRetry && replayMessage.includes('replay')) {
            originalRequest._gatewayReplayRetry = true;
            return api(originalRequest);
        }

        // Handle common errors like 401 Unauthorized
        if (status === 401) {
            // For example, redirect to login or refresh token
            console.error('Unauthorized request. Redirecting to login.');
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);


// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
    GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
    GOOGLE_REGISTER: `${API_BASE_URL}/auth/google/register`,
    COMPLETE_GOOGLE_PROFILE: `${API_BASE_URL}/auth/google/complete-profile`,
        DEFER_GOOGLE_PROFILE: `${API_BASE_URL}/auth/google/defer-profile`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  REQUEST_OTP: `${API_BASE_URL}/auth/request-otp`,
  VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
    REGISTER_AVAILABILITY: `${API_BASE_URL}/auth/register/availability`,
  
  // OTP Login (phone-based)
    LOGIN_PREVIEW_USER: `${API_BASE_URL}/auth/login/preview-user`,
  LOGIN_REQUEST_OTP: `${API_BASE_URL}/auth/login/request-otp`,
  LOGIN_VERIFY_OTP: `${API_BASE_URL}/auth/login/verify-otp`,
  
  // Farms
  GET_FARMS: `${API_BASE_URL}/farms`,
  GET_FARM_BY_ID: (id) => `${API_BASE_URL}/farms/${id}`,
  CREATE_FARM: `${API_BASE_URL}/farms`,
  UPDATE_FARM: (id) => `${API_BASE_URL}/farms/${id}`,
  DELETE_FARM: (id) => `${API_BASE_URL}/farms/${id}`,
  
  // Crops
  GET_CROPS: `${API_BASE_URL}/crops`,
  GET_CROP_BY_ID: (id) => `${API_BASE_URL}/crops/${id}`,
  CREATE_CROP: `${API_BASE_URL}/crops`,
  UPDATE_CROP: (id) => `${API_BASE_URL}/crops/${id}`,
  DELETE_CROP: (id) => `${API_BASE_URL}/crops/${id}`,
  
  // Irrigation Schedules
  GET_IRRIGATION_SCHEDULES: `${API_BASE_URL}/irrigation`,
  GET_IRRIGATION_BY_ID: (id) => `${API_BASE_URL}/irrigation/${id}`,
  CREATE_IRRIGATION: `${API_BASE_URL}/irrigation`,
  UPDATE_IRRIGATION: (id) => `${API_BASE_URL}/irrigation/${id}`,
  DELETE_IRRIGATION: (id) => `${API_BASE_URL}/irrigation/${id}`,
  
  // Email
  SEND_EMAIL: `${API_BASE_URL}/email/send`,
  SEND_TEST_EMAIL: `${API_BASE_URL}/email/test`,
  SEND_WELCOME_EMAIL: `${API_BASE_URL}/email/welcome`,
  SEND_IRRIGATION_REMINDER: `${API_BASE_URL}/email/irrigation-reminder`,
  SEND_HARVEST_NOTIFICATION: `${API_BASE_URL}/email/harvest-notification`,
};

// Storage Keys
export const STORAGE_KEYS = {
    USER_TOKEN: 'farmEazy_token',
    USER_REFRESH_TOKEN: 'farmEazy_refresh_token',
    USER_EMAIL: 'farmEazy_email',
    USER_ID: 'farmEazy_userId',
    USER_USERNAME: 'farmEazy_username',
    USER_FULLNAME: 'farmEazy_fullName',
    USER_ROLES: 'farmEazy_roles',
    USER_PHONE: 'farmEazy_phone',
    USER_PROFILE_COMPLETION_REQUIRED: 'farmEazy_requires_profile_completion',
};

export default API_BASE_URL;
