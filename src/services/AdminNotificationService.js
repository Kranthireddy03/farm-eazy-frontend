import apiClient from './apiClient';

/**
 * ADMIN NOTIFICATION SERVICE
 * 
 * Admin-only endpoints for sending notifications.
 * 
 * Endpoints:
 * - POST /api/admin/notifications/broadcast - Send to all users
 * - POST /api/admin/notifications/user/{userId} - Send to specific user
 * - GET /api/admin/notifications/broadcasts - Get all broadcasts
 * - DELETE /api/admin/notifications/{id} - Delete notification
 * - GET /api/admin/users - Get user list for targeting
 * - GET /api/admin/notification-types - Get available types
 */

const AdminNotificationService = {
  /**
   * Send broadcast notification to all users
   */
  broadcast: async (notification) => {
    const response = await apiClient.post('/admin/notifications/broadcast', {
      title: notification.title,
      message: notification.message,
      type: notification.type || 'SYSTEM',
      priority: notification.priority || 'NORMAL',
      actionUrl: notification.actionUrl,
      isBroadcast: true,
      expiresInDays: notification.expiresInDays || 30
    });
    return response.data;
  },

  /**
   * Send notification to a specific user
   */
  sendToUser: async (userId, notification) => {
    const response = await apiClient.post(`/admin/notifications/user/${userId}`, {
      title: notification.title,
      message: notification.message,
      type: notification.type || 'SYSTEM',
      priority: notification.priority || 'NORMAL',
      actionUrl: notification.actionUrl
    });
    return response.data;
  },

  /**
   * Get all broadcast notifications
   */
  getBroadcasts: async () => {
    const response = await apiClient.get('/admin/notifications/broadcasts');
    return response.data;
  },

  /**
   * Delete a notification (admin only)
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/admin/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Get list of users for targeting
   */
  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  /**
   * Get available notification types
   */
  getNotificationTypes: async () => {
    const response = await apiClient.get('/admin/notification-types');
    return response.data;
  },

  /**
   * Get admin dashboard stats
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Notification type options for dropdowns
   */
  notificationTypes: [
    { value: 'ORDER', label: 'Order Updates', icon: '📦' },
    { value: 'PAYMENT', label: 'Payment', icon: '💳' },
    { value: 'FARM', label: 'Farm Operations', icon: '🌾' },
    { value: 'IRRIGATION', label: 'Irrigation', icon: '💧' },
    { value: 'PRODUCT', label: 'Product/Marketplace', icon: '🛒' },
    { value: 'ACCOUNT', label: 'Account', icon: '👤' },
    { value: 'SYSTEM', label: 'System Announcement', icon: '⚙️' },
    { value: 'PROMO', label: 'Promotional', icon: '🎁' }
  ],

  /**
   * Priority options for dropdowns
   */
  priorityOptions: [
    { value: 'LOW', label: 'Low', color: 'gray' },
    { value: 'NORMAL', label: 'Normal', color: 'blue' },
    { value: 'HIGH', label: 'High', color: 'orange' },
    { value: 'URGENT', label: 'Urgent', color: 'red' }
  ]
};

export default AdminNotificationService;
