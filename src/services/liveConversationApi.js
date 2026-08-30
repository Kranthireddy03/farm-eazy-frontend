import apiClient from './apiClient';

const BASE = '/live/conversations';

export async function startLiveConversation() {
  const response = await apiClient.post(`${BASE}/start`);
  return response.data;
}

export async function getLiveMessages(displayId) {
  const response = await apiClient.get(`${BASE}/${displayId}/messages`);
  return response.data;
}

export async function closeLiveConversation(displayId) {
  const response = await apiClient.post(`${BASE}/${displayId}/close`);
  return response.data;
}

export async function submitLiveRating(displayId, rating, feedbackComment) {
  await apiClient.post(`${BASE}/${displayId}/rating`, {
    rating,
    feedbackComment,
  });
}
