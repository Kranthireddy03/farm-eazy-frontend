import apiClient from './apiClient';

const BASE = '/marketplace/chat';

export async function startProductChat(productId) {
  const response = await apiClient.post(`${BASE}/product/${productId}/start`);
  return response.data;
}

export async function startServiceChat(serviceId) {
  const response = await apiClient.post(`${BASE}/service/${serviceId}/start`);
  return response.data;
}

export async function getMyMarketplaceConversations() {
  const response = await apiClient.get(`${BASE}/my`);
  return response.data;
}

export async function getMarketplaceMessages(displayId) {
  const response = await apiClient.get(`${BASE}/${displayId}/messages`);
  return response.data;
}

export async function sendMarketplaceMessage(displayId, payload) {
  const response = await apiClient.post(`${BASE}/${displayId}/messages`, payload);
  return response.data;
}
