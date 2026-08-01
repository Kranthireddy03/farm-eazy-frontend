import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';

/**
 * NOTIFICATIONS PAGE
 * 
 * Full page view of all notifications.
 * Allows users to view, filter, and manage all notifications.
 * Note: Layout is provided by parent route, do not wrap in Layout here.
 */
export default function Notifications() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await NotificationService.dismiss(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleView = async (notification) => {
    try {
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }
      window.dispatchEvent(new Event('notifications-changed'));

      setSelectedNotification(notification);
    } catch (error) {
      console.error('Failed to open notification action:', error);
    }
  };

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const getIcon = (type) => NotificationService.getTypeIcon(type);

  const getTypeColorClass = (type) => {
    const colors = {
      ORDER: isDark ? 'border-l-blue-500 bg-blue-900/20' : 'border-l-blue-500 bg-blue-50',
      PAYMENT: isDark ? 'border-l-green-500 bg-green-900/20' : 'border-l-green-500 bg-green-50',
      FARM: isDark ? 'border-l-yellow-500 bg-yellow-900/20' : 'border-l-yellow-500 bg-yellow-50',
      IRRIGATION: isDark ? 'border-l-cyan-500 bg-cyan-900/20' : 'border-l-cyan-500 bg-cyan-50',
      PRODUCT: isDark ? 'border-l-purple-500 bg-purple-900/20' : 'border-l-purple-500 bg-purple-50',
      ACCOUNT: isDark ? 'border-l-border bg-muted/20' : 'border-l-border bg-muted/50',
      SYSTEM: isDark ? 'border-l-orange-500 bg-orange-900/20' : 'border-l-orange-500 bg-orange-50',
      PROMO: isDark ? 'border-l-pink-500 bg-pink-900/20' : 'border-l-pink-500 bg-pink-50'
    };
    return colors[type] || (isDark ? 'border-l-border bg-muted/20' : 'border-l-border bg-muted/50');
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      URGENT: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      NORMAL: 'bg-blue-500 text-white',
      LOW: 'bg-muted/500 text-white'
    };
    return styles[priority] || styles.NORMAL;
  };

  return (
    <>
    <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
            🔔 Notifications
          </h1>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            
            {/* Mark All Read */}
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Mark All Read
            </button>

            <button
              onClick={fetchNotifications}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${isDark ? 'border-border text-muted-foreground hover:bg-muted' : 'border-border text-foreground hover:bg-muted'}`}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{notifications.length}</div>
            <div className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Total</div>
          </div>
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
            <div className={`text-3xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{notifications.filter(n => !n.isRead).length}</div>
            <div className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Unread</div>
          </div>
          <div className={`rounded-xl p-4 border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
            <div className={`text-3xl font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{notifications.filter(n => n.isRead).length}</div>
            <div className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Read</div>
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-border border-t-blue-500 rounded-full"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={`rounded-xl p-12 text-center border ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
            <span className="text-6xl block mb-4">📭</span>
            <p className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}>No notifications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl p-4 border ${isDark ? 'border-border' : 'border-border'} border-l-4 ${getTypeColorClass(notification.type)} ${
                  !notification.isRead ? 'ring-1 ring-blue-500/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <span className="text-3xl flex-shrink-0">{getIcon(notification.type)}</span>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${!notification.isRead ? (isDark ? 'text-white' : 'text-foreground') : (isDark ? 'text-muted-foreground' : 'text-foreground')}`}>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {notification.isBroadcast && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                          📢 Broadcast
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>{notification.message}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{notification.timeAgo}</span>
                      <span className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>•</span>
                      <span className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{notification.type}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${isDark ? 'bg-muted text-muted-foreground hover:bg-red-600 hover:text-white' : 'bg-muted text-foreground hover:bg-red-600 hover:text-white'}`}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleView(notification)}
                      className="px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary transition-colors text-center"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedNotification && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/55 px-4">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>Notification Details</h2>
              <button
                type="button"
                onClick={closeNotificationModal}
                className={`text-sm rounded-lg px-2 py-1 ${isDark ? 'text-muted-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted'}`}
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-base font-semibold ${isDark ? 'text-foreground' : 'text-foreground'}`}>{selectedNotification.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(selectedNotification.priority)}`}>
                  {selectedNotification.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'border-border text-muted-foreground' : 'border-border text-foreground'}`}>
                  {selectedNotification.type}
                </span>
              </div>

              <div className={`rounded-xl p-4 border ${isDark ? 'border-border bg-muted/40' : 'border-border bg-muted/30'}`}>
                <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {selectedNotification.message}
                </p>
              </div>

              <div className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Received: {selectedNotification.timeAgo || 'just now'}
              </div>
            </div>

            <div className={`px-5 py-4 border-t flex items-center justify-end gap-2 ${isDark ? 'border-border' : 'border-border'}`}>
              <button
                type="button"
                onClick={closeNotificationModal}
                className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
