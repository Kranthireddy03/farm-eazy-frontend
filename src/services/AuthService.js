/**
 * Authentication Service
 * 
 * Handles all user authentication operations:
 * - User registration
 * - User login
 * - Token management
 * - Session tracking
 * - Local storage persistence
 * 
 * Note: For React components, prefer using the useAuth() hook from AuthContext
 * for reactive session management. This service is used internally by AuthContext
 * and for non-React code.
 */

import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api';

// Session tracking keys
const SESSION_KEYS = {
  LAST_ACTIVITY: 'farmEazy_lastActivity',
  SESSION_START: 'farmEazy_sessionStart',
  TOKEN_EXPIRY: 'farmEazy_tokenExpiry',
};

class AuthService {
  /**
   * Register a new user
   * @param {string} username - User's unique username (required)
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} phone - User's phone number
   * @returns {Promise} Response with user data and JWT token
   */
  async register(username, email, password, phone) {
    try {
      const payload = {
        username,
        email,
        password,
        phone,
      };

      const response = await axios.post(API_ENDPOINTS.REGISTER, payload);

      // Store token and user info in local storage
      if (response.data.token) {
        this.setSession(response.data);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {string} identifier - User's email, username, or user ID
   * @param {string} password - User's password
   * @returns {Promise} Response with JWT token
   */
  async login(identifier, password) {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        identifier,
        password,
      });

      // Store token and user info in local storage
      if (response.data.token) {
        this.setSession(response.data);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set session data after successful login/register
   * @param {Object} userData - User data from API response
   */
  setSession(userData) {
    const now = Date.now();
    
    // Store user data
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, userData.token);
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, userData.email);
    localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id?.toString() || '');
    localStorage.setItem(STORAGE_KEYS.USER_USERNAME, userData.username || '');
    // Note: fullName is no longer used - username is the display name
    localStorage.setItem(STORAGE_KEYS.USER_FULLNAME, userData.username || '');
    
    // Store session tracking
    localStorage.setItem(SESSION_KEYS.SESSION_START, now.toString());
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, now.toString());
    
    // Extract and store token expiry
    const tokenExpiry = this.getTokenExpiry(userData.token);
    if (tokenExpiry) {
      localStorage.setItem(SESSION_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());
    }
    
    // Broadcast auth state change
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { isAuthenticated: true } 
    }));
  }

  /**
   * Extract expiry time from JWT token
   * @param {string} token - JWT token
   * @returns {number|null} Expiry timestamp in milliseconds
   */
  getTokenExpiry(token) {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token (optional, uses stored token if not provided)
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token = null) {
    const t = token || this.getToken();
    if (!t) return true;
    
    const expiry = this.getTokenExpiry(t);
    if (!expiry) return true;
    
    return Date.now() >= expiry;
  }

  /**
   * Get remaining session time in milliseconds
   * @returns {number} Time remaining until token expires
   */
  getSessionTimeRemaining() {
    const token = this.getToken();
    if (!token) return 0;
    
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;
    
    return Math.max(0, expiry - Date.now());
  }

  /**
   * Get JWT token from storage
   * @returns {string|null} JWT token or null if not found
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  }

  /**
   * Get user email from storage
   * @returns {string|null} User email or null if not found
   */
  getUserEmail() {
    return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
  }

  /**
   * Get user ID from storage
   * @returns {string|null} User ID or null if not found
   */
  getUserId() {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Get user full name from storage
   * @returns {string|null} User full name or null if not found
   */
  getUserFullName() {
    return localStorage.getItem(STORAGE_KEYS.USER_FULLNAME);
  }

  /**
   * Check if user is logged in (token exists and not expired)
   * @returns {boolean} True if user is authenticated
   */
  isLoggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Update last activity timestamp (call on user interaction)
   */
  updateActivity() {
    if (this.isLoggedIn()) {
      localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
    }
  }

  /**
   * Logout user - clear all stored data
   * @param {string} reason - Reason for logout (user, expired, inactivity, unauthorized)
   */
  logout(reason = 'user') {
    // Clear auth data
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.USER_FULLNAME);
    
    // Clear session tracking
    localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(SESSION_KEYS.SESSION_START);
    localStorage.removeItem(SESSION_KEYS.TOKEN_EXPIRY);
    
    // Broadcast auth state change
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { isAuthenticated: false, reason } 
    }));
    
    // Store logout reason for login page
    if (reason !== 'user') {
      const messages = {
        expired: 'Your session has expired. Please log in again.',
        inactivity: 'You have been logged out due to inactivity.',
        unauthorized: 'Your session is no longer valid. Please log in again.',
      };
      sessionStorage.setItem('logoutReason', messages[reason] || 'Please log in again.');
    }
  }

  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise} Response with message
   */
  async forgotPassword(email) {
    try {
      const response = await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request OTP for verification
   * @param {string} email - User's email
   * @param {string} phone - User's phone number
   * @param {string} purpose - Purpose of OTP (e.g., 'LOGIN', 'REGISTER', 'RESET_PASSWORD')
   * @returns {Promise} Response with message
   */
  async requestOtp(email, phone, purpose) {
    try {
      const response = await axios.post(API_ENDPOINTS.REQUEST_OTP, {
        email,
        phone,
        purpose,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - User's email
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} purpose - Purpose of OTP verification
   * @returns {Promise} Response with verification status
   */
  async verifyOtp(email, otpCode, purpose) {
    try {
      const response = await axios.post(API_ENDPOINTS.VERIFY_OTP, {
        email,
        otpCode,
        purpose,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise} Response with message
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD, {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========== OTP-BASED LOGIN ==========

  /**
   * Request OTP for phone-based login
   * @param {string} phone - 10-digit phone number
   * @returns {Promise} Response with OTP send status
   */
  async requestLoginOtp(phone) {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN_REQUEST_OTP, {
        phone,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify OTP and login
   * @param {string} phone - 10-digit phone number
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise} Response with JWT token and user data
   */
  async loginWithOtp(phone, otpCode) {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN_VERIFY_OTP, {
        phone,
        otpCode,
      });

      // Store token and user info in local storage
      if (response.data.token) {
        this.setSession(response.data);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * Creates an error object with status, errorCode, and message
   * for proper error handling in components
   * @param {Error} error - Axios error object
   * @returns {Object} Formatted error with message, status, and errorCode
   */
  handleError(error) {
    const errorData = error.response?.data;
    const status = error.response?.status;
    
    // Create a custom error object with all relevant info
    const customError = new Error(
      errorData?.message || 
      errorData?.errors?.[0] || 
      error.message || 
      'An error occurred'
    );
    
    // Attach additional properties for error handling
    customError.status = status;
    customError.errorCode = errorData?.errorCode || null;
    customError.errors = errorData?.errors || null;
    
    return customError;
  }
}

export default new AuthService();
