import apiClient from './apiClient';

const BASE = '/live/conversations';

export async function startLiveConversation() {
  const response = await apiClient.post(`${BASE}/start`);
  return response.data;
}

export async function getLiveConversation(displayId) {
  const response = await apiClient.get(`${BASE}/${displayId}`);
  return response.data;
}

export async function getLiveMessages(displayId) {
  const response = await apiClient.get(`${BASE}/${displayId}/messages`);
  return response.data;
}

export async function sendLiveMessage(displayId, payload) {
  const response = await apiClient.post(`${BASE}/${displayId}/messages`, payload);
  return response.data;
}

export async function closeLiveConversation(displayId, resolved = true) {
  const response = await apiClient.post(`${BASE}/${displayId}/close?resolved=${resolved}`);
  return response.data;
}

export async function escalateLiveConversation(displayId) {
  const response = await apiClient.post(`${BASE}/${displayId}/escalate`);
  return response.data;
}

export async function submitLiveRating(displayId, rating, feedbackComment) {
  await apiClient.post(`${BASE}/${displayId}/rating`, {
    rating,
    feedbackComment,
  });
}

export async function getAgentsOnline() {
  const response = await apiClient.get(`${BASE}/agents-online`);
  return response.data;
}

export async function uploadLiveAttachment(displayId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`${BASE}/${displayId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
