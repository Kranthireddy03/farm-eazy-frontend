import apiClient from './apiClient';

/**
 * NOTIFICATION SERVICE
 * 
 * Handles all notification-related API calls.
 * 
 * Endpoints:
 * - GET /api/notifications - Get all notifications
 * - GET /api/notifications/count - Get unread count
 * - GET /api/notifications/recent - Get recent notifications
 * - PUT /api/notifications/{id}/read - Mark as read
 * - PUT /api/notifications/read-all - Mark all as read
 * - DELETE /api/notifications/{id} - Dismiss notification
 */

const NotificationService = {
  /**
   * Get all notifications for current user
   */
  getAll: async () => {
    const response = await apiClient.get('/notifications', {
      validateStatus: (status) => status < 500,
    });
    if (response.status !== 200) {
      return [];
    }
    return response.data;
  },

  /**
   * Get unread notification count (for bell badge)
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/count', {
      validateStatus: (status) => status < 500,
    });
    if (response.status !== 200) {
      return { unreadCount: 0, count: 0 };
    }
    return response.data;
  },

  /**
   * Get recent notifications (for dropdown)
   */
  getRecent: async (limit = 10) => {
    const response = await apiClient.get(`/notifications/recent?limit=${limit}`, {
      validateStatus: (status) => status < 500,
    });
    if (response.status !== 200) {
      return [];
    }
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  /**
   * Dismiss (delete) a notification
   */
  dismiss: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
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
