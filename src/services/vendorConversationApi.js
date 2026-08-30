import apiClient from './apiClient';

const BASE = '/vendor-conversations';

export async function getLiveMessages(displayId) {
  const response = await apiClient.get(`${BASE}/${displayId}/messages`);
  return response.data;
}

export async function sendLiveMessage(displayId, payload) {
  const response = await apiClient.post(`${BASE}/${displayId}/messages`, payload);
  return response.data;
}
