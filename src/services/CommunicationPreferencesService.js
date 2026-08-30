/**
 * Communication Preferences Service
 * 
 * Handles API calls for user notification channel preferences
 * (Email, SMS, or Both) for different notification types.
 */

import apiClient from './apiClient';

const ENDPOINT = '/communication-preferences';

/**
 * Get current user's communication preferences
 * @returns {Promise} Response with preferences
 */
export const getPreferences = async () => {
  const response = await apiClient.get(ENDPOINT);
  return response.data;
};

/**
 * Update user's communication preferences
 * @param {Object} preferences - Preference settings
 * @param {string} preferences.otpChannel - OTP delivery: EMAIL_ONLY, SMS_ONLY, BOTH
 * @param {string} preferences.orderChannel - Order updates: EMAIL_ONLY, SMS_ONLY, BOTH
 * @param {string} preferences.serviceChannel - Service notifications: EMAIL_ONLY, SMS_ONLY, BOTH
 * @param {string} preferences.irrigationChannel - Irrigation alerts: EMAIL_ONLY, SMS_ONLY, BOTH
 * @param {string} preferences.marketingChannel - Marketing: EMAIL_ONLY, SMS_ONLY, BOTH
 * @param {boolean} preferences.smsConsent - User consent for SMS
 * @returns {Promise} Updated preferences
 */
export const updatePreferences = async (preferences) => {
  const response = await apiClient.put(ENDPOINT, preferences);
  return response.data;
};

/**
 * Channel options for UI dropdowns
 */
export const CHANNEL_OPTIONS = [
  { value: 'EMAIL_ONLY', label: 'Email Only', icon: '📧' },
  { value: 'SMS_ONLY', label: 'SMS Only', icon: '📱' },
  { value: 'BOTH', label: 'Both Email & SMS', icon: '📬' },
];

/**
 * Notification type configurations for UI
 */
export const NOTIFICATION_TYPES = [
  {
    key: 'otpChannel',
    title: 'OTP & Verification',
    description: 'Login OTP, password reset, and verification codes',
    icon: '🔐',
    critical: true,
    defaultRecommendation: 'SMS_ONLY',
  },
  {
    key: 'orderChannel',
    title: 'Order Updates',
    description: 'Payment confirmations, booking updates, and cancellations',
    icon: '🛒',
    critical: true,
    defaultRecommendation: 'BOTH',
  },
  {
    key: 'serviceChannel',
    title: 'Service Notifications',
    description: 'Service completion and farm activity alerts',
    icon: '🚜',
    critical: false,
    defaultRecommendation: 'EMAIL_ONLY',
  },
  {
    key: 'irrigationChannel',
    title: 'Irrigation Reminders',
    description: 'Scheduled irrigation and water management alerts',
    icon: '💧',
    critical: false,
    defaultRecommendation: 'EMAIL_ONLY',
  },
  {
    key: 'marketingChannel',
    title: 'Promotions & Updates',
    description: 'New features, offers, and FarmEazy news',
    icon: '📢',
    critical: false,
    defaultRecommendation: 'EMAIL_ONLY',
  },
];

export default {
  getPreferences,
  updatePreferences,
  CHANNEL_OPTIONS,
  NOTIFICATION_TYPES,
};
