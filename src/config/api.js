import axios from 'axios';

/**
 * API Configuration and Constants
 * 
 * This file centralizes all API configuration for communicating with the FarmEazy backend.
 */

// Backend API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'https://farm-eazy-backend.onrender.com';
export const API_BASE_URL = `${API_URL}/api`;

// Create a configured Axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('farmEazy_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
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
        // Handle common errors like 401 Unauthorized
        if (error.response && error.response.status === 401) {
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
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  
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
  USER_EMAIL: 'farmEazy_email',
  USER_ID: 'farmEazy_userId',
  USER_USERNAME: 'farmEazy_username',
  USER_FULLNAME: 'farmEazy_fullName',
};

export default API_BASE_URL;
