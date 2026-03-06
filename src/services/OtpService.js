import apiClient from './apiClient';

/**
 * OTP Service
 * 
 * Handles OTP sending and verification
 * Now includes detailed response with SMS status for popup notifications
 */
const OtpService = {
  /**
   * Send OTP (legacy - simple response)
   * @returns {Promise<{message: string}>}
   */
  sendOtp: async (email, purpose) => {
    const response = await apiClient.post('/otp/send', { email, purpose });
    return response.data;
  },

  /**
   * Send OTP with detailed response
   * Returns information about which channels (Email/SMS) were used
   * Use this for showing user-friendly popup notifications
   * 
   * @param {string} email - User's email
   * @param {string} purpose - OTP purpose (REGISTRATION, LOGIN, etc.)
   * @param {string} phone - Optional phone number for SMS
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   displayMessage: string,
   *   sentVia: string[],
   *   failedVia: string[],
   *   smsResponse: object
   * }>}
   */
  sendOtpDetailed: async (email, purpose, phone = null) => {
    const payload = { email, purpose };
    if (phone) {
      payload.phone = phone;
    }
    const response = await apiClient.post('/otp/send-detailed', payload);
    return response.data;
  },

  /**
   * Verify OTP
   * @returns {Promise<{verified: boolean, message: string}>}
   */
  verifyOtp: async (email, otpCode, purpose) => {
    const response = await apiClient.post('/otp/verify', { email, otpCode, purpose });
    return response.data;
  }
};

export default OtpService;
