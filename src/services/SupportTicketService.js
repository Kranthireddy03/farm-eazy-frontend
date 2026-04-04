/**
 * Support Ticket Service
 * 
 * Handles API calls for customer support tickets.
 */

import apiClient from './apiClient';

const ENDPOINT = '/support-tickets';

/**
 * Create a new support ticket
 * @param {Object} ticket - Ticket data
 * @param {string} ticket.subject - Ticket subject
 * @param {string} ticket.description - Ticket description
 * @param {string} ticket.category - Category: GENERAL, ORDER_ISSUE, PAYMENT_ISSUE, etc.
 * @param {string} ticket.priority - Priority: LOW, MEDIUM, HIGH, URGENT
 * @param {string} ticket.contactEmail - Contact email
 * @param {string} ticket.contactPhone - Contact phone
 * @returns {Promise} Created ticket
 */
export const createTicket = async (ticket) => {
  const response = await apiClient.post(ENDPOINT, ticket);
  return response.data;
};

/**
 * Create a new support ticket with an attachment
 * @param {Object} ticket - Ticket data
 * @param {File} file - Optional attachment
 * @returns {Promise} Created ticket
 */
export const createTicketWithAttachment = async (ticket, file) => {
  const formData = new FormData();
  formData.append('subject', ticket.subject || 'Support Request');
  formData.append('description', ticket.description || '');
  formData.append('contactEmail', ticket.contactEmail || '');
  if (ticket.contactPhone) formData.append('contactPhone', ticket.contactPhone);
  if (ticket.category) formData.append('category', ticket.category);
  if (ticket.priority) formData.append('priority', ticket.priority);
  if (ticket.orderId) formData.append('orderId', ticket.orderId);
  if (ticket.serviceId) formData.append('serviceId', ticket.serviceId);
  if (ticket.source) formData.append('source', ticket.source);
  if (ticket.roleRequest) formData.append('roleRequest', ticket.roleRequest);
  if (file) formData.append('file', file);

  const response = await apiClient.post(ENDPOINT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Get all tickets for current user
 * @returns {Promise} List of tickets
 */
export const getTickets = async () => {
  const response = await apiClient.get(ENDPOINT);
  return response.data;
};

/**
 * Get a specific ticket by display ID
 * @param {string} displayId - Ticket display ID (e.g., INC00001)
 * @returns {Promise} Ticket details
 */
export const getTicket = async (displayId) => {
  const response = await apiClient.get(`${ENDPOINT}/${displayId}`);
  return response.data;
};

export const getTicketMessages = async (displayId) => {
  const response = await apiClient.get(`${ENDPOINT}/${displayId}/messages`);
  return response.data?.messages || [];
};

/**
 * Cancel a ticket
 * @param {string} displayId - Ticket display ID
 * @returns {Promise} Updated ticket
 */
export const cancelTicket = async (displayId) => {
  const response = await apiClient.post(`${ENDPOINT}/${displayId}/cancel`);
  return response.data;
};

/**
 * Add response to a ticket
 * @param {string} displayId - Ticket display ID
 * @param {string} response - Response text
 * @returns {Promise} Updated ticket
 */
export const addResponse = async (displayId, responseText) => {
  const response = await apiClient.post(`${ENDPOINT}/${displayId}/respond`, {
    response: responseText,
  });
  return response.data;
};

/**
 * Get count of active tickets
 * @returns {Promise} { activeTickets: number }
 */
export const getActiveCount = async () => {
  const response = await apiClient.get(`${ENDPOINT}/count/active`);
  return response.data;
};

export const getUserChatStats = async () => {
  const response = await apiClient.get(`${ENDPOINT}/stats/chat`);
  return response.data;
};

export const getAdminChatStats = async () => {
  const response = await apiClient.get('/admin/tickets/stats/chat');
  return response.data;
};

/**
 * Ticket categories for UI
 */
export const TICKET_CATEGORIES = [
  { value: 'GENERAL', label: 'General Inquiry', icon: '❓' },
  { value: 'ORDER_ISSUE', label: 'Order Issue', icon: '📦' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue', icon: '💳' },
  { value: 'SERVICE_ISSUE', label: 'Service Issue', icon: '🚜' },
  { value: 'ACCOUNT_ISSUE', label: 'Account Issue', icon: '👤' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue', icon: '🔧' },
  { value: 'REFUND_REQUEST', label: 'Refund Request', icon: '💰' },
  { value: 'FEEDBACK', label: 'Feedback', icon: '💬' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

/**
 * Ticket priorities for UI
 */
export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'green' },
  { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
];

/**
 * Ticket statuses for UI
 */
export const TICKET_STATUSES = {
  OPEN: { label: 'Open', color: 'blue', icon: '🔵' },
  IN_PROGRESS: { label: 'In Progress', color: 'yellow', icon: '🟡' },
  PENDING_USER: { label: 'Awaiting Your Response', color: 'orange', icon: '🟠' },
  RESOLVED: { label: 'Resolved', color: 'green', icon: '🟢' },
  CLOSED: { label: 'Closed', color: 'gray', icon: '⚫' },
  CANCELLED: { label: 'Cancelled', color: 'gray', icon: '❌' },
};

export default {
  createTicket,
  createTicketWithAttachment,
  getTickets,
  getTicket,
  getTicketMessages,
  cancelTicket,
  addResponse,
  getActiveCount,
  getUserChatStats,
  getAdminChatStats,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
};
