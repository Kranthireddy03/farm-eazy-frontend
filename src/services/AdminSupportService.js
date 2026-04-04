// AdminSupportService.js
// Handles admin ticket actions: get, reply, resolve
import apiClient from './apiClient';

export const getAllTickets = async (params = {}) => {
  const res = await apiClient.get('/admin/tickets', { params });
  return res.data;
}

export const replyToTicket = async (displayId, reply) => {
  return apiClient.put(`/admin/tickets/${displayId}`, { description: reply });
}

export const resolveTicket = async (displayId, resolution = 'Resolved by admin') => {
  return apiClient.put(`/admin/tickets/${displayId}`, { status: 'RESOLVED', description: resolution });
}

export const setImportant = async (displayId, important) => {
  const res = await apiClient.post(`/admin/tickets/${displayId}/important`, null, { params: { important } });
  return res.data;
}

export const setArchived = async (displayId, archived) => {
  const res = await apiClient.post(`/admin/tickets/${displayId}/archive`, null, { params: { archived } });
  return res.data;
}

export const setSla = async (displayId, slaIso) => {
  const res = await apiClient.post(`/admin/tickets/${displayId}/sla`, { slaBy: slaIso });
  return res.data;
}
