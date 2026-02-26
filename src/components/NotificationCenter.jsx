
import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../hooks/useToast';

// Notification Center for header dropdown
export default function NotificationCenter({ anchorRef, onClose }) {
  const [notifications, setNotifications] = useState(() => {
    // Load saved notifications from localStorage
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [unread, setUnread] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef();

  // Add new toast as notification
  useEffect(() => {
    if (toast && toast.message) {
      setNotifications(prev => {
        const newNotif = {
          id: Date.now(),
          message: toast.message,
          type: toast.type,
          time: new Date().toLocaleTimeString(),
          saved: false,
          read: false,
        };
        const updated = [newNotif, ...prev];
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setUnread(true);
    }
  }, [toast]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (anchorRef && anchorRef.current) {
      setUnread(false);
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    }
  }, [anchorRef]);

  // Save notification
  const handleSave = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, saved: true } : n);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove all unsaved notifications when closed
  useEffect(() => {
    return () => {
      setNotifications(prev => {
        const updated = prev.filter(n => n.saved);
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    };
  }, []);

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-96 bg-slate-800 shadow-lg rounded-lg z-50 border border-slate-700" style={{top: '100%'}}>
      <div className="px-4 py-3 border-b border-slate-700 font-bold text-lg text-white flex justify-between items-center">
        <span>Notifications</span>
        <button className="text-slate-400 hover:text-red-400" onClick={onClose} aria-label="Close notifications">✕</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-slate-400 text-center">No notifications yet.</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-slate-700 last:border-b-0 flex flex-col gap-1 ${n.type === 'error' ? 'bg-red-900/30' : n.type === 'success' ? 'bg-green-900/30' : 'bg-blue-900/30'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${n.type === 'error' ? 'text-red-400' : n.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>{n.message}</span>
                <span className="text-xs text-slate-500 ml-2">{n.time}</span>
              </div>
              <div className="flex gap-2 mt-1">
                {!n.saved && (
                  <button className="btn btn-xs btn-primary" onClick={() => handleSave(n.id)}>Save</button>
                )}
                <button className="btn btn-xs btn-secondary" onClick={() => handleDelete(n.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
