/**
 * SMS Service
 * 
 * Frontend service for SMS-related operations
 * Handles SMS status checks and provides notification helpers
 */

import apiClient from './apiClient';

const SmsService = {
  /**
   * Check SMS service status
   * Returns status information for monitoring/debugging
   */
  getStatus: async () => {
    const response = await apiClient.get('/sms/status');
    return response.data;
  },

  /**
   * Send test SMS (admin only)
   * @param {string} phone - Phone number to send test SMS to
   * @param {string} testCode - Test code to send (default: 123456)
   */
  sendTestSms: async (phone, testCode = '123456') => {
    const response = await apiClient.post(`/sms/test?phone=${phone}&testCode=${testCode}`);
    return response.data;
  }
};

export default SmsService;
