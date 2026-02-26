import apiClient from './apiClient';

const OtpService = {
  sendOtp: async (email, purpose) => {
    const response = await apiClient.post('/otp/send', { email, purpose });
    return response.data;
  },

  verifyOtp: async (email, otpCode, purpose) => {
    const response = await apiClient.post('/otp/verify', { email, otpCode, purpose });
    return response.data;
  }
};

export default OtpService;
