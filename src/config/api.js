import axios from 'axios';

const GATEWAY_ENABLED = (import.meta.env.VITE_API_GATEWAY_ENABLED || 'true') !== 'false';
const GATEWAY_CLIENT = import.meta.env.VITE_API_GATEWAY_CLIENT || '';
const GATEWAY_SECRET = import.meta.env.VITE_API_GATEWAY_SECRET || '';

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

        if (GATEWAY_ENABLED) {
            if (!GATEWAY_CLIENT) {
                throw new Error('VITE_API_GATEWAY_CLIENT is required when gateway security is enabled');
            }
            if (!GATEWAY_SECRET) {
                throw new Error('VITE_API_GATEWAY_SECRET is required when gateway security is enabled');
            }

            const requestUrl = String(config.url || '');
            let requestPath = '/';

            if (/^https?:\/\//i.test(requestUrl)) {
                requestPath = new URL(requestUrl).pathname;
            } else {
                const base = new URL(String(config.baseURL || API_BASE_URL), 'http://localhost');
                const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
                if (!requestUrl || requestUrl === '/') {
                    requestPath = basePath || '/';
                } else if (requestUrl.startsWith(`${basePath}/`) || requestUrl === basePath) {
                    requestPath = requestUrl;
                } else {
                    const normalized = requestUrl.startsWith('/') ? requestUrl.slice(1) : requestUrl;
                    requestPath = `${basePath}/${normalized}`.replace(/\/+/g, '/');
                    if (!requestPath.startsWith('/')) requestPath = `/${requestPath}`;
                }
            }

            requestPath = requestPath.split('?')[0].split('#')[0];

            const ts = getNextGatewayTimestamp();
            const message = `${GATEWAY_CLIENT}:${ts}:${(config.method || 'GET').toUpperCase()}:${requestPath}`;
            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(GATEWAY_SECRET),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
            const bytes = new Uint8Array(signatureBytes);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 1) {
                binary += String.fromCharCode(bytes[i]);
            }

            config.headers['X-Gateway-Client'] = GATEWAY_CLIENT;
            config.headers['X-Gateway-Timestamp'] = ts;
            config.headers['X-Gateway-Signature'] = btoa(binary);
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
