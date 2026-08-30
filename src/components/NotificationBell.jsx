import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationService from '../services/NotificationService';
import { subscribeUserNotifications } from '../services/supportStompClient';

/**
 * NOTIFICATION BELL COMPONENT
 *
 * Bell icon in header that shows notification count badge.
 * Opening the dropdown shows recent notifications; once the user clicks away,
 * all notifications are marked read and cleared from the bell (session view).
 * They remain available on the Notifications page for this session.
 *
 * Clicking a notification navigates to its linked page (product / service /
 * ticket / order) when an actionUrl is present, else a sensible default.
 */
function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const clearedRef = useRef(false);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('farmEazy_token');
    const email = localStorage.getItem('farmEazy_email');
    if (!token || !email) {
      setUnreadCount(0);
      return;
    }

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
    const token = localStorage.getItem('farmEazy_token');
    const email = localStorage.getItem('farmEazy_email');
    if (!token || !email) {
      setNotifications([]);
      return;
    }

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

  // Real-time push notifications via STOMP (instant). Polling above remains as a fallback so
  // the bell always works even if the WebSocket is unavailable.
  useEffect(() => {
    const token = localStorage.getItem('farmEazy_token');
    if (!token) {
      return undefined;
    }
    let subscription = null;
    let cancelled = false;

    const onLiveNotification = () => {
      if (cancelled) {
        return;
      }
      fetchUnreadCount();
      if (!clearedRef.current) {
        fetchNotifications();
      }
    };

    subscribeUserNotifications(onLiveNotification)
      .then((sub) => {
        subscription = sub;
      })
      .catch(() => {
        // STOMP unavailable -> polling fallback keeps working; never throw or crash.
      });

    return () => {
      cancelled = true;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (_) {
          // best effort
        }
      }
    };
  }, [fetchUnreadCount, fetchNotifications]);

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

  // Reset the bell to a clean state after logout (session notifications flushed)
  useEffect(() => {
    const onLogout = () => {
      clearedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
    };
    window.addEventListener('farmeazy:auth-logout', onLogout);
    return () => window.removeEventListener('farmeazy:auth-logout', onLogout);
  }, []);

  // Close dropdown when clicking outside -> mark all read and clear the bell view
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        clearBell();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark all as read + clear the bell (session view). Backend keeps history for the session.
  const clearBell = async () => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      try {
        await NotificationService.markAllAsRead();
      } catch (error) {
        console.error('Failed to mark all as read:', error);
      }
    }
    setNotifications([]);
    setUnreadCount(0);
    setOpen(false);
    window.dispatchEvent(new Event('notifications-changed'));
  };

  const toggleDropdown = () => {
    if (open) {
      clearBell();
    } else {
      setOpen(true);
    }
  };

  const defaultLinkFor = (notification) => {
    const type = String(notification?.type || '').toUpperCase();
    switch (type) {
      case 'PRODUCT':
        return '/products';
      case 'ORDER':
      case 'PAYMENT':
        return '/products/orders';
      case 'FARM':
        return '/farms';
      case 'IRRIGATION':
        return '/irrigation';
      case 'SERVICE':
        return '/services';
      case 'SUPPORT':
        return '/support';
      default:
        return '/notifications';
    }
  };

  const handleOpen = async (notification) => {
    if (!notification) return;
    try {
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    const target = notification.actionUrl || defaultLinkFor(notification);
    clearedRef.current = true;
    setNotifications([]);
    setUnreadCount(0);
    setOpen(false);
    window.dispatchEvent(new Event('notifications-changed'));
    navigate(target);
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
      SERVICE: 'border-l-teal-500',
      ACCOUNT: 'border-l-border',
      SYSTEM: 'border-l-orange-500',
      PROMO: 'border-l-pink-500'
    };
    return colors[type] || 'border-l-border';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button - Styled to match header */}
      <button
        data-tour="notifications-button"
        className="relative w-10 h-10 flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full transition-all border border-white/20"
        onClick={toggleDropdown}
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
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1rem))] bg-white dark:bg-muted border border-gray-200 dark:border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground dark:text-white text-lg">Notifications</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Once you click away, these clear from the bell for this session.</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={clearBell}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="p-6 text-center text-muted-foreground dark:text-muted-foreground">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-border border-t-blue-500 rounded-full"></div>
              </li>
            ) : notifications.length === 0 ? (
              <li className="p-6 text-muted-foreground dark:text-muted-foreground text-center">
                <span className="text-4xl block mb-2">📭</span>
                No notifications
              </li>
            ) : (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => handleOpen(notification)}
                  className={`p-4 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-l-4 cursor-pointer ${getTypeColorClass(notification.type)} ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground dark:text-white' : 'text-muted-foreground dark:text-muted-foreground'}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 block">{notification.timeAgo}</span>
                      <span className="text-[10px] text-blue-400 mt-1 block">Tap to open →</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-border space-y-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Notification history
            </Link>
            <p className="text-center text-[10px] text-muted-foreground">
              Session notifications are cleared from the bell after viewing and flushed on logout. Save important ones on the history page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
