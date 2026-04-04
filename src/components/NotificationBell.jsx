import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NotificationService from '../services/NotificationService';

/**
 * NOTIFICATION BELL COMPONENT
 * 
 * Bell icon in header that shows notification count badge.
 * Clicking opens dropdown with recent notifications.
 * 
 * Features:
 * - Fetches unread count from backend
 * - Shows recent notifications in dropdown
 * - Mark as read / dismiss actions
 * - Auto-refresh every 30 seconds
 */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await NotificationService.getUnreadCount();
      const nextCount = Number(data?.unreadCount ?? data?.count ?? 0);
      setUnreadCount(Number.isFinite(nextCount) ? nextCount : 0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  // Fetch recent notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getRecent(10);
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    const refreshIfVisible = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    refreshIfVisible();
    const interval = setInterval(refreshIfVisible, 60000); // Refresh every 60 seconds when tab is visible
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Keep bell state synced when notifications are updated from other pages
  useEffect(() => {
    const handleNotificationChange = () => {
      fetchUnreadCount();
      if (open) {
        fetchNotifications();
      }
    };

    window.addEventListener('notifications-changed', handleNotificationChange);
    return () => window.removeEventListener('notifications-changed', handleNotificationChange);
  }, [fetchUnreadCount, fetchNotifications, open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const handleMarkRead = async (id) => {
    try {
      const current = notifications.find(n => n.id === id);
      await NotificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      if (current && !current.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Dismiss notification
  const handleDismiss = async (id) => {
    try {
      await NotificationService.dismiss(id);
      setNotifications(prev => {
        const dismissed = prev.find(n => n.id === id);
        if (dismissed && !dismissed.isRead) {
          setUnreadCount(current => Math.max(0, current - 1));
        }
        return prev.filter(n => n.id !== id);
      });
      window.dispatchEvent(new Event('notifications-changed'));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewDetails = async (notification) => {
    if (!notification) return;

    try {
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setOpen(false);
      setSelectedNotification({ ...notification, isRead: true });
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to open notification details:', error);
    }
  };

  const handleAcknowledgeNotification = async () => {
    if (!selectedNotification || acknowledging) return;

    setAcknowledging(true);
    try {
      await NotificationService.dismiss(selectedNotification.id);
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      setSelectedNotification(null);
      window.dispatchEvent(new Event('notifications-changed'));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
    } finally {
      setAcknowledging(false);
    }
  };

  // Get icon for notification type
  const getIcon = (type) => {
    return NotificationService.getTypeIcon(type);
  };

  // Get color class for notification type
  const getTypeColorClass = (type) => {
    const colors = {
      ORDER: 'border-l-blue-500',
      PAYMENT: 'border-l-green-500',
      FARM: 'border-l-yellow-500',
      IRRIGATION: 'border-l-cyan-500',
      PRODUCT: 'border-l-purple-500',
      ACCOUNT: 'border-l-gray-500',
      SYSTEM: 'border-l-orange-500',
      PROMO: 'border-l-pink-500'
    };
    return colors[type] || 'border-l-gray-500';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button - Styled to match header */}
      <button
        data-tour="notifications-button"
        className="relative w-10 h-10 flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full transition-all border border-white/20"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1 border-2 border-teal-600">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white text-lg">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="p-6 text-center text-gray-500 dark:text-slate-400">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-500 border-t-blue-500 rounded-full"></div>
              </li>
            ) : notifications.length === 0 ? (
              <li className="p-6 text-gray-500 dark:text-slate-400 text-center">
                <span className="text-4xl block mb-2">📭</span>
                No notifications
              </li>
            ) : (
              notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`p-4 border-b border-gray-200 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-l-4 ${getTypeColorClass(notification.type)} ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-slate-700/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                      <span className="text-xs text-gray-500 dark:text-slate-500 mt-1 block">{notification.timeAgo}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                          className="text-xs text-blue-400 hover:text-blue-300 p-1"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(notification.id); }}
                        className="text-xs text-gray-500 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Click to navigate */}
                  {notification.actionUrl && (
                    <button
                      type="button"
                      onClick={() => handleViewDetails(notification)}
                      className="text-xs text-blue-400 hover:underline mt-2 block"
                    >
                      View details →
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
              <Link
                to="/notifications"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-xl rounded-2xl border shadow-2xl bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Details</h2>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="text-sm rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedNotification.title}</span>
                {selectedNotification.priority && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white">
                    {selectedNotification.priority}
                  </span>
                )}
                {selectedNotification.type && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
                    {selectedNotification.type}
                  </span>
                )}
              </div>

              <div className="rounded-xl p-4 border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Received: {selectedNotification.timeAgo || 'just now'}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleAcknowledgeNotification}
                disabled={acknowledging}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {acknowledging ? 'Please wait...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
