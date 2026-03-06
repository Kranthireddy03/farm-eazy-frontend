import React, { useEffect } from 'react';

/**
 * TOAST COMPONENT
 * 
 * PURPOSE: Display temporary notification messages.
 * Supports success, error, warning, and info types.
 * 
 * PROPS:
 * - message: Text to display
 * - type: 'success' | 'error' | 'warning' | 'info'
 * - onClose: Callback when toast should be dismissed
 * - duration: Auto-dismiss time in ms (default: 4000)
 */
function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  // Color schemes for different types
  const styles = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      border: 'border-green-600'
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      border: 'border-red-600'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      border: 'border-yellow-600'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      border: 'border-blue-600'
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div
      className={`${style.bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in border-l-4 ${style.border} min-w-[280px] max-w-[400px]`}
      role="alert"
    >
      <span className="text-xl font-bold flex-shrink-0">{style.icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

export default Toast;
