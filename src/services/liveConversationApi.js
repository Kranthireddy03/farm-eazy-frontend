import apiClient from './apiClient';

const BASE = '/live/conversations';

export async function startLiveConversation() {
  const email = localStorage.getItem('farmEazy_email') || localStorage.getItem('user_email');
  const phone = localStorage.getItem('farmEazy_phone');
  const response = await apiClient.post(`${BASE}/start`, {
    email: email || undefined,
    phone: phone || undefined,
  });
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

export async function getAgentAvailability() {
  const response = await apiClient.get(`${BASE}/agent-availability`);
  return response.data;
}

export async function submitLiveRating(displayId, rating, feedbackComment) {
  await apiClient.post(`${BASE}/${displayId}/rating`, {
    rating,
    feedbackComment,
  });
}

