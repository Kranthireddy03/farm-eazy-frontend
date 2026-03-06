
import React, { useEffect, useState, useRef } from 'react';

// Storage key for saved notifications only
const SAVED_NOTIFICATIONS_KEY = 'farmeazy_saved_notifications';

// Notification Center for header dropdown
// Session notifications are temporary, saved ones persist
export default function NotificationCenter({ anchorRef, onClose }) {
  // Session notifications (cleared when session ends)
  const [sessionNotifications, setSessionNotifications] = useState([]);
  
  // Saved notifications (persisted to localStorage)
  const [savedNotifications, setSavedNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_NOTIFICATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const dropdownRef = useRef();

  // Listen for custom notification events from anywhere in the app
  useEffect(() => {
    const handleNotification = (event) => {
      const { message, type = 'info', icon = '🔔' } = event.detail;
      const newNotif = {
        id: Date.now() + Math.random(),
        message,
        type,
        icon,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };
      setSessionNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep max 50 session notifications
    };

    window.addEventListener('app-notification', handleNotification);
    return () => window.removeEventListener('app-notification', handleNotification);
  }, []);

  // Save notification permanently
  const handleSave = (notification) => {
    setSavedNotifications(prev => {
      const updated = [{ ...notification, saved: true }, ...prev].slice(0, 100); // Max 100 saved
      localStorage.setItem(SAVED_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
    // Remove from session
    setSessionNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  // Delete notification
  const handleDeleteSession = (id) => {
    setSessionNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteSaved = (id) => {
    setSavedNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(SAVED_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all session notifications
  const clearAllSession = () => {
    setSessionNotifications([]);
  };

  // Clear all saved notifications
  const clearAllSaved = () => {
    setSavedNotifications([]);
    localStorage.removeItem(SAVED_NOTIFICATIONS_KEY);
  };

  const allNotifications = [
    ...sessionNotifications.map(n => ({ ...n, isSession: true })),
    ...savedNotifications.map(n => ({ ...n, isSession: false }))
  ];

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/40 border-l-4 border-green-500';
      case 'error':
        return 'bg-red-900/40 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-900/40 border-l-4 border-yellow-500';
      case 'info':
      default:
        return 'bg-blue-900/40 border-l-4 border-blue-500';
    }
  };

  const getTypeTextColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info':
      default: return 'text-blue-400';
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className="absolute right-0 mt-2 w-96 bg-slate-800 shadow-2xl rounded-xl z-50 border border-slate-700 overflow-hidden"
      style={{ top: '100%', maxHeight: '80vh' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <span className="font-bold text-lg text-white">Notifications</span>
          </div>
          <button 
            className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-700 rounded" 
            onClick={onClose} 
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>
        {/* Stats */}
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            {sessionNotifications.length} session
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {savedNotifications.length} saved
          </span>
        </div>
      </div>

      {/* Scrollable notification list */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
        {allNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="text-slate-400">No notifications yet</p>
            <p className="text-slate-500 text-xs mt-1">Actions like orders, cart updates, and more will appear here</p>
          </div>
        ) : (
          <>
            {/* Session Notifications */}
            {sessionNotifications.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-900/30 flex justify-between items-center sticky top-0">
                  <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    📋 Session ({sessionNotifications.length})
                  </span>
                  <button 
                    onClick={clearAllSession}
                    className="text-xs text-slate-500 hover:text-red-400 transition"
                  >
                    Clear all
                  </button>
                </div>
                {sessionNotifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`px-4 py-3 border-b border-slate-700/50 ${getTypeStyles(n.type)} transition-all hover:bg-slate-700/30`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{n.icon}</span>
                          <span className={`font-medium ${getTypeTextColor(n.type)} truncate`}>
                            {n.message}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">{n.time}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => handleSave(n)}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition"
                          title="Save permanently"
                        >
                          💾 Save
                        </button>
                        <button 
                          onClick={() => handleDeleteSession(n.id)}
                          className="px-2 py-1 text-xs bg-slate-600 hover:bg-red-500 text-white rounded transition"
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Saved Notifications */}
            {savedNotifications.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-900/30 flex justify-between items-center sticky top-0">
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                    💾 Saved ({savedNotifications.length})
                  </span>
                  <button 
                    onClick={clearAllSaved}
                    className="text-xs text-slate-500 hover:text-red-400 transition"
                  >
                    Clear all
                  </button>
                </div>
                {savedNotifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`px-4 py-3 border-b border-slate-700/50 ${getTypeStyles(n.type)} transition-all hover:bg-slate-700/30`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{n.icon}</span>
                          <span className={`font-medium ${getTypeTextColor(n.type)} truncate`}>
                            {n.message}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">{n.date} at {n.time}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSaved(n.id)}
                        className="px-2 py-1 text-xs bg-slate-600 hover:bg-red-500 text-white rounded transition shrink-0"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/50 text-center">
        <p className="text-xs text-slate-500">
          💡 Session notifications clear when you leave. Save important ones!
        </p>
      </div>
    </div>
  );
}

// Helper function to dispatch notifications from anywhere
export function sendNotification(message, type = 'info', icon = '🔔') {
  window.dispatchEvent(new CustomEvent('app-notification', {
    detail: { message, type, icon }
  }));
}
