import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Email Service
 * Handles all email-related API calls
 */
const EmailService = {
  /**
   * Send a generic email
   */
  sendEmail: async (emailData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_EMAIL, emailData);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Send a test email
   */
  sendTestEmail: async (email) => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.SEND_TEST_EMAIL}?email=${email}`);
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },

  /**
   * Send welcome email
   */
  sendWelcomeEmail: async (email, name) => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.SEND_WELCOME_EMAIL}?email=${email}&name=${name}`
      );
      return response.data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  },

  /**
   * Send irrigation reminder
   */
  sendIrrigationReminder: async (email, farmName, cropName, scheduledTime) => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.SEND_IRRIGATION_REMINDER}?email=${email}&farmName=${farmName}&cropName=${cropName}&scheduledTime=${scheduledTime}`
      );
      return response.data;
    } catch (error) {
      console.error('Error sending irrigation reminder:', error);
      throw error;
    }
  },

  /**
   * Send harvest notification
   */
  sendHarvestNotification: async (email, farmName, cropName, estimatedDate) => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.SEND_HARVEST_NOTIFICATION}?email=${email}&farmName=${farmName}&cropName=${cropName}&estimatedDate=${estimatedDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Error sending harvest notification:', error);
      throw error;
    }
  },
};

export default EmailService;
