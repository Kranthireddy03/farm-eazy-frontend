import apiClient from './apiClient';

const LocationService = {
  getStates: async () => {
    const response = await apiClient.get('/locations/states');
    return response.data;
  },

  searchPincodes: async (query, page = 0, size = 20) => {
    const response = await apiClient.get('/locations/pincodes', { params: { query, page, size } });
    return response.data?.content || [];
  },

  getPincode: async (pincode) => {
    const response = await apiClient.get(`/locations/pincodes/${pincode}`);
    return response.data;
  },
};

export default LocationService;
