import apiClient from './apiClient';

/**
 * NOTIFICATION SERVICE
 * 
 * Handles all notification-related API calls:
 * - GET /api/notifications - Get all notifications
 * - GET /api/notifications/count - Get unread & saved count
 * - GET /api/notifications/recent - Get recent notifications
 * - GET /api/notifications/saved - Get saved notifications
 * - POST /api/notifications/{id}/save - Save a notification
 * - DELETE /api/notifications/{id}/save - Unsave a notification
 * - PUT /api/notifications/{id}/read - Mark as read
 * - PUT /api/notifications/{id}/unread - Mark as unread
 * - PUT /api/notifications/read-all - Mark all as read
 * - DELETE /api/notifications/{id} - Dismiss notification
 * - GET /api/notifications/preferences - Get in-app notification preferences
 * - PUT /api/notifications/preferences - Update in-app notification preferences
 */

const NotificationService = {
  /**
   * Get all notifications for current user
   */
  getAll: async () => {
    try {
      const response = await apiClient.get('/notifications', {
        validateStatus: (status) => status < 500,
      });
      if (response && response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.warn('NotificationService.getAll error:', err?.message || err);
      return [];
    }
  },

  /**
   * Get unread notification count (for bell badge)
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/count', {
        validateStatus: (status) => status < 500,
      });
      if (response && response.status === 200 && response.data) {
        return response.data;
      }
      return { unreadCount: 0, count: 0, savedCount: 0 };
    } catch (err) {
      console.warn('NotificationService.getUnreadCount error:', err?.message || err);
      return { unreadCount: 0, count: 0, savedCount: 0 };
    }
  },

  /**
   * Get recent notifications (for dropdown)
   */
  getRecent: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/notifications/recent?limit=${limit}`, {
        validateStatus: (status) => status < 500,
      });
      if (response && response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.warn('NotificationService.getRecent error:', err?.message || err);
      return [];
    }
  },

  /**
   * Get saved notifications from server
   */
  getSaved: async () => {
    try {
      const response = await apiClient.get('/notifications/saved', {
        validateStatus: (status) => status < 500,
      });
      if (response && response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.warn('NotificationService.getSaved error:', err?.message || err);
      return [];
    }
  },

  /**
   * Save a notification permanently
   */
  saveNotification: async (notificationId) => {
    try {
      const response = await apiClient.post(`/notifications/${notificationId}/save`, null, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.saveNotification error:', err?.message || err);
      return null;
    }
  },

  /**
   * Remove a notification from saved
   */
  unsaveNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}/save`, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.unsaveNotification error:', err?.message || err);
      return null;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`, null, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.markAsRead error:', err?.message || err);
      return null;
    }
  },

  /**
   * Mark notification as unread
   */
  markAsUnread: async (notificationId) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/unread`, null, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.markAsUnread error:', err?.message || err);
      return null;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all', null, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.markAllAsRead error:', err?.message || err);
      return null;
    }
  },

  /**
   * Dismiss (delete) a notification
   */
  dismiss: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.dismiss error:', err?.message || err);
      return null;
    }
  },

  /**
   * Get user's in-app notification preferences
   */
  getPreferences: async () => {
    try {
      const response = await apiClient.get('/notifications/preferences', {
        validateStatus: (status) => status < 500,
      });
      if (response && response.status === 200) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.warn('NotificationService.getPreferences error:', err?.message || err);
      return null;
    }
  },

  /**
   * Update user's in-app notification preferences
   */
  updatePreferences: async (preferencesDto) => {
    try {
      const response = await apiClient.put('/notifications/preferences', preferencesDto, {
        validateStatus: (status) => status < 500,
      });
      return response?.data || null;
    } catch (err) {
      console.warn('NotificationService.updatePreferences error:', err?.message || err);
      return null;
    }
  },

  /**
   * Get notification type icon
   */
  getTypeIcon: (type) => {
    const icons = {
      ORDER: '📦',
      PAYMENT: '💳',
      FARM: '🌾',
      IRRIGATION: '💧',
      PRODUCT: '🛒',
      SERVICE: '🚜',
      COIN: '🪙',
      COUPON: '🎟️',
      SUPPORT: '💬',
      BANK: '🏦',
      ACCOUNT: '👤',
      SYSTEM: '⚙️',
      PROMO: '🎁'
    };
    return icons[type] || '🔔';
  },

  /**
   * Get notification type color
   */
  getTypeColor: (type) => {
    const colors = {
      ORDER: 'blue',
      PAYMENT: 'green',
      FARM: 'yellow',
      IRRIGATION: 'cyan',
      PRODUCT: 'purple',
      SERVICE: 'teal',
      COIN: 'amber',
      COUPON: 'pink',
      SUPPORT: 'indigo',
      BANK: 'emerald',
      ACCOUNT: 'gray',
      SYSTEM: 'orange',
      PROMO: 'pink'
    };
    return colors[type] || 'gray';
  },

  /**
   * Get priority badge styles
   */
  getPriorityStyles: (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white animate-pulse';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-blue-500 text-white';
      case 'LOW':
        return 'bg-muted/500 text-white';
      default:
        return 'bg-muted/500 text-white';
    }
  }
};

export default NotificationService;
