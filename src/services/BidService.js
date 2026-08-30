import apiClient from './apiClient';

const BidService = {
  submitBid: async (listingId, { bidAmount, quantity, message }) => {
    const response = await apiClient.post(`/listings/${listingId}/bids`, { bidAmount, quantity, message });
    return response.data;
  },

  getBidsForListing: async (listingId) => {
    const response = await apiClient.get(`/listings/${listingId}/bids`);
    return response.data;
  },

  getBidsForServiceListing: async (listingId) => {
    const response = await apiClient.get(`/services/listings/${listingId}/bids`);
    return response.data;
  },

  getMyBids: async () => {
    const response = await apiClient.get('/bids/my');
    return response.data;
  },

  getBid: async (bidId) => {
    const response = await apiClient.get(`/bids/${bidId}`);
    return response.data;
  },

  acceptBid: async (bidId) => {
    const response = await apiClient.post(`/bids/${bidId}/accept`);
    return response.data;
  },

  rejectBid: async (bidId) => {
    const response = await apiClient.post(`/bids/${bidId}/reject`);
    return response.data;
  },

  startVendorConversation: async (listingId, bidId) => {
    const response = await apiClient.post('/vendor-conversations/start', { listingId, bidId });
    return response.data;
  },

  getOrder: async (bidId) => {
    const response = await apiClient.get(`/bids/${bidId}/order`);
    return response.data;
  },

  getMyConversations: async () => {
    const response = await apiClient.get('/vendor-conversations/my');
    return response.data;
  },
};

export default BidService;
