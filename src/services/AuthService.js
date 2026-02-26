/**
 * Authentication Service
 * 
 * Handles all user authentication operations:
 * - User registration
 * - User login
 * - Token management
 * - Local storage persistence
 */

import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api';

class AuthService {
  /**
   * Register a new user
   * @param {string} fullName - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} phone - User's phone number
   * @param {string} username - User's username (optional, auto-generated if not provided)
   * @returns {Promise} Response with user data and JWT token
   */
  async register(fullName, email, password, phone, username = null) {
    try {
      const payload = {
        fullName,
        email,
        password,
        phone,
      };

      // Only include username if provided
      if (username) {
        payload.username = username;
      }

      const response = await axios.post(API_ENDPOINTS.REGISTER, payload);

      // Store token and user info in local storage
      if (response.data.token) {
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.data.token);
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, response.data.email);
        localStorage.setItem(STORAGE_KEYS.USER_ID, response.data.id);
        localStorage.setItem(STORAGE_KEYS.USER_USERNAME, response.data.username);
        localStorage.setItem(STORAGE_KEYS.USER_FULLNAME, response.data.fullName);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Response with JWT token
   */
  async login(email, password) {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      // Store token and user info in local storage
      if (response.data.token) {
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.data.token);
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, response.data.email);
        localStorage.setItem(STORAGE_KEYS.USER_ID, response.data.id);
        localStorage.setItem(STORAGE_KEYS.USER_USERNAME, response.data.username);
        localStorage.setItem(STORAGE_KEYS.USER_FULLNAME, response.data.fullName);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
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
   * Check if user is logged in
   * @returns {boolean} True if token exists
   */
  isLoggedIn() {
    return !!this.getToken();
  }

  /**
   * Logout user - clear all stored data
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.USER_FULLNAME);
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
