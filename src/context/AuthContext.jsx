/**
 * AuthContext - Professional Session Management
 * 
 * Features:
 * - Centralized authentication state
 * - JWT token expiration handling
 * - Automatic session refresh
 * - Inactivity timeout (120 seconds + 30 second warning)
 * - Session persistence with secure storage
 * - Cross-tab synchronization
 * - Token validation on app load
 * 
 * Usage:
 *   const { user, isAuthenticated, login, logout, sessionTimeRemaining } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../config/api';

// Session configuration
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 120 * 1000,         // 120 seconds inactivity triggers warning
  WARNING_COUNTDOWN: 30 * 1000,           // 30 seconds countdown after warning
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000,    // Refresh 5 minutes before expiry
  SESSION_CHECK_INTERVAL: 1 * 1000,       // Check session every second for accurate countdown
  WARNING_BEFORE_LOGOUT: 30 * 1000,       // Show warning 30 seconds before auto-logout
};

// Storage keys for session management
const SESSION_KEYS = {
  LAST_ACTIVITY: 'farmEazy_lastActivity',
  SESSION_START: 'farmEazy_sessionStart',
  TOKEN_EXPIRY: 'farmEazy_tokenExpiry',
};

/**
 * Decode JWT token without external library
 * Returns null if token is invalid
 */
function decodeJWT(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const expiryTime = decoded.exp * 1000;
  return Date.now() >= expiryTime;
}

/**
 * Get token expiry time in milliseconds
 */
function getTokenExpiry(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;
  return decoded.exp * 1000;
}

/**
 * Get remaining time until token expires
 */
function getTokenTimeRemaining(token) {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
}

// Create context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const [warningCountdown, setWarningCountdown] = useState(30); // 30 seconds countdown
  const [logoutReason, setLogoutReason] = useState(null); // Track why user was logged out
  
  const sessionCheckIntervalRef = useRef(null);
  const warningStartTimeRef = useRef(null); // Track when warning started

  /**
   * Load user from storage on mount
   */
  const loadUserFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      // Validate token expiration
      if (isTokenExpired(token)) {
        console.warn('Token expired, clearing session');
        clearSession();
        return false;
      }

      // Load user data
      const userData = {
        id: localStorage.getItem(STORAGE_KEYS.USER_ID),
        email: localStorage.getItem(STORAGE_KEYS.USER_EMAIL),
        username: localStorage.getItem(STORAGE_KEYS.USER_USERNAME),
        token: token,
      };

      setUser(userData);
      setIsAuthenticated(true);
      
      // Store token expiry for monitoring
      const expiry = getTokenExpiry(token);
      if (expiry) {
        localStorage.setItem(SESSION_KEYS.TOKEN_EXPIRY, expiry.toString());
      }

      return true;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      clearSession();
      return false;
    }
  }, []);

  /**
   * Clear all session data
   */
  const clearSession = useCallback(() => {
    // Clear auth data
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_USERNAME);
    
    // Clear session tracking
    localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(SESSION_KEYS.SESSION_START);
    localStorage.removeItem(SESSION_KEYS.TOKEN_EXPIRY);
    
    // Clear interval
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    setUser(null);
    setIsAuthenticated(false);
    setSessionWarning(false);
    setSessionTimeRemaining(null);
  }, []);

  /**
   * Update last activity timestamp
   * Only tracks activity - checkSession handles warning and logout
   */
  const updateActivity = useCallback(() => {
    if (!isAuthenticated) return;
    
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
    
    // Reset warning state when user becomes active
    setSessionWarning(false);
    setWarningCountdown(30);
    warningStartTimeRef.current = null;
  }, [isAuthenticated]);

  /**
   * Login - called after successful authentication
   */
  const login = useCallback((userData) => {
    // Store user data
    if (userData.token) {
      localStorage.setItem(STORAGE_KEYS.USER_TOKEN, userData.token);
    }
    if (userData.email) {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, userData.email);
    }
    if (userData.id) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id.toString());
    }
    if (userData.username) {
      localStorage.setItem(STORAGE_KEYS.USER_USERNAME, userData.username);
    }

    // Set session tracking
    const now = Date.now();
    localStorage.setItem(SESSION_KEYS.SESSION_START, now.toString());
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, now.toString());
    
    if (userData.token) {
      const expiry = getTokenExpiry(userData.token);
      if (expiry) {
        localStorage.setItem(SESSION_KEYS.TOKEN_EXPIRY, expiry.toString());
      }
    }

    setUser(userData);
    setIsAuthenticated(true);
    updateActivity();

    // Dispatch event for cross-tab sync
    window.dispatchEvent(new CustomEvent('authStateChange', { detail: { isAuthenticated: true } }));
  }, [updateActivity]);

  /**
   * Logout - clear session and redirect
   */
  const logout = useCallback((reason = 'user') => {
    clearSession();
    setLogoutReason(reason);

    // Dispatch event for cross-tab sync
    window.dispatchEvent(new CustomEvent('authStateChange', { detail: { isAuthenticated: false, reason } }));

    // Redirect to session-expired page for non-user initiated logouts
    if (reason === 'inactivity' || reason === 'expired' || reason === 'unauthorized') {
      // Use direct navigation to ensure redirect works from any context
      window.location.href = `/session-expired?reason=${reason}`;
    }
  }, [clearSession]);

  /**
   * Extend session (for "Stay logged in" button)
   */
  const extendSession = useCallback(() => {
    updateActivity();
    setSessionWarning(false);
    setWarningCountdown(30);
    warningStartTimeRef.current = null;
  }, [updateActivity]);

  /**
   * Check session validity
   */
  const checkSession = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    
    if (!token) {
      if (isAuthenticated) {
        setLogoutReason('unauthorized');
        logout('unauthorized');
      }
      return;
    }

    // Check token expiration
    if (isTokenExpired(token)) {
      console.warn('Token expired during session check');
      setLogoutReason('expired');
      logout('expired');
      return;
    }

    // Update remaining time
    const remaining = getTokenTimeRemaining(token);
    setSessionTimeRemaining(remaining);

    // Check inactivity
    const lastActivity = parseInt(localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY) || '0', 10);
    const inactiveTime = Date.now() - lastActivity;
    
    // Total timeout = 120s inactivity + 30s warning = 150s
    const totalTimeout = SESSION_CONFIG.INACTIVITY_TIMEOUT + SESSION_CONFIG.WARNING_COUNTDOWN;
    
    if (inactiveTime >= totalTimeout) {
      // 150 seconds of total inactivity - force logout
      console.log('Force logout after 150s total inactivity');
      setLogoutReason('inactivity');
      logout('inactivity');
    } else if (inactiveTime >= SESSION_CONFIG.INACTIVITY_TIMEOUT) {
      // 120+ seconds inactive - show warning with countdown
      if (!sessionWarning) {
        console.log('Showing warning at', Math.floor(inactiveTime / 1000), 'seconds of inactivity');
        setSessionWarning(true);
        warningStartTimeRef.current = Date.now();
      }
      
      // Calculate remaining countdown time based on when warning started
      const warningElapsed = warningStartTimeRef.current 
        ? Date.now() - warningStartTimeRef.current 
        : 0;
      const remainingSeconds = Math.max(0, Math.ceil((SESSION_CONFIG.WARNING_COUNTDOWN - warningElapsed) / 1000));
      setWarningCountdown(remainingSeconds);
    } else {
      // User is active - reset warning state
      if (sessionWarning) {
        setSessionWarning(false);
        setWarningCountdown(30);
        warningStartTimeRef.current = null;
      }
    }
  }, [isAuthenticated, logout, sessionWarning]);

  /**
   * Handle storage events for cross-tab synchronization
   */
  const handleStorageChange = useCallback((event) => {
    if (event.key === STORAGE_KEYS.USER_TOKEN) {
      if (!event.newValue) {
        // Token was removed in another tab
        clearSession();
      } else if (event.newValue !== user?.token) {
        // Token changed in another tab, reload user
        loadUserFromStorage();
      }
    }
  }, [user, clearSession, loadUserFromStorage]);

  /**
   * Handle auth state change events
   */
  const handleAuthStateChange = useCallback((event) => {
    const { isAuthenticated: newAuthState, reason } = event.detail;
    
    if (!newAuthState && isAuthenticated) {
      clearSession();
      if (reason && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, [isAuthenticated, clearSession]);

  /**
   * Setup activity listeners
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  /**
   * Setup session check interval
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    sessionCheckIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [isAuthenticated, checkSession]);

  /**
   * Setup cross-tab synchronization
   */
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChange', handleAuthStateChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, [handleStorageChange, handleAuthStateChange]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const hasSession = loadUserFromStorage();
    
    if (hasSession) {
      updateActivity();
    }
    
    setIsLoading(false);
  }, [loadUserFromStorage, updateActivity]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
    };
  }, []);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    sessionWarning,
    sessionTimeRemaining,
    warningCountdown,
    logoutReason,
    
    // Methods
    login,
    logout,
    extendSession,
    updateActivity,
    clearLogoutReason: () => setLogoutReason(null),
    
    // Helpers
    getUserEmail: () => user?.email || localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '',
    getUserId: () => user?.id || localStorage.getItem(STORAGE_KEYS.USER_ID) || '',
    getUserName: () => user?.username || localStorage.getItem(STORAGE_KEYS.USER_USERNAME) || '',
    getToken: () => user?.token || localStorage.getItem(STORAGE_KEYS.USER_TOKEN) || '',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Session Warning Modal Component
 * Shows when session is about to expire
 */
export function SessionWarningModal() {
  const { sessionWarning, extendSession, logout, sessionTimeRemaining } = useAuth();
  
  if (!sessionWarning) return null;

  const minutes = Math.floor((sessionTimeRemaining || 0) / 60000);
  const seconds = Math.floor(((sessionTimeRemaining || 0) % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md mx-4 animate-fadeIn">
        <div className="text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Session Expiring Soon
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mb-4">
            Your session will expire in{' '}
            <span className="font-bold text-orange-500">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            {' '}due to inactivity.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={extendSession}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Stay Logged In
            </button>
            <button
              onClick={() => logout('user')}
              className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthContext;
