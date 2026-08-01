import apiClient from './apiClient';

/**
 * Canonical user profile from GET /api/users/me.
 */
class UserProfileService {
  async getMe() {
    const response = await apiClient.get('/users/me', { _skipLocationRetry: true });
    return response.data;
  }
}

export default new UserProfileService();
