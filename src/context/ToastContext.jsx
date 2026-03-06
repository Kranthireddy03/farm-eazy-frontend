import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

/**
 * TOAST CONTEXT
 * 
 * PURPOSE: Global toast notification system for the app.
 * Provides a consistent way to show success/error/warning messages.
 * 
 * FEATURES:
 * - Support for success, error, warning, and info toasts
 * - SMS notification display support
 * - Auto-dismiss with configurable duration
 * - Queue support for multiple toasts
 * 
 * USAGE:
 * 1. Wrap your app with <ToastProvider>
 * 2. Use the useGlobalToast() hook in any component
 * 3. Call showToast('message', 'type') to display a toast
 * 
 * EXAMPLE:
 * const { showToast, showSmsNotification } = useGlobalToast();
 * showToast('Operation successful!', 'success');
 * showSmsNotification({ displayMessage: 'OTP sent to your mobile', success: true });
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Show SMS-specific notification from API response
  const showSmsNotification = useCallback((smsResponse) => {
    if (!smsResponse) return;

    const { success, displayMessage, sentVia } = smsResponse;
    const type = success ? 'success' : 'warning';
    
    // Build message with channel info
    let message = displayMessage || (success ? 'Notification sent' : 'Notification failed');
    if (sentVia && sentVia.length > 0) {
      message += ` (via ${sentVia.join(' & ')})`;
    }

    return showToast(message, type, 5000);
  }, [showToast]);

  // Show OTP-specific notification
  const showOtpNotification = useCallback((otpResponse) => {
    if (!otpResponse) return;

    const { success, displayMessage, sentVia } = otpResponse;
    const type = success ? 'success' : 'error';
    
    let message = displayMessage || (success ? 'OTP sent successfully' : 'Failed to send OTP');
    if (sentVia && sentVia.length > 0) {
      const channels = sentVia.join(' & ').toLowerCase();
      message = `OTP sent to your ${channels}`;
    }

    return showToast(message, type, 5000);
  }, [showToast]);

  // Convenience methods
  const success = useCallback((message) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message) => showToast(message, 'info', 3000), [showToast]);

  const value = {
    showToast,
    removeToast,
    showSmsNotification,
    showOtpNotification,
    success,
    error,
    warning,
    info,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container - renders all active toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" aria-live="polite">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(-${index * 10}px)`,
              zIndex: 50 - index
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook to access global toast functionality
 * @returns Toast context methods
 */
export function useGlobalToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
