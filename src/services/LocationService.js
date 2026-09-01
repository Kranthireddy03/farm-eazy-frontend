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

  getActiveZones: async () => {
    try {
      const response = await apiClient.get('/location-access/active-zones');
      return Array.isArray(response.data) ? response.data : [];
    } catch (_err) {
      return [];
    }
  },

  checkLocationStatus: async (payload = {}) => {
    try {
      const response = await apiClient.post('/location-access/check', payload);
      return response.data;
    } catch (err) {
      return {
        allowed: false,
        message: err?.response?.data?.message || 'Unable to verify location serviceability',
        activeZones: [],
      };
    }
  },

  getCurrentLocationStatus: async () => {
    try {
      const response = await apiClient.get('/location-access/status');
      return response.data;
    } catch (err) {
      return {
        allowed: false,
        message: err?.response?.data?.message || 'Location access required',
        activeZones: [],
      };
    }
  },

  submitLocationRequest: async (payload = {}) => {
    const response = await apiClient.post('/location-access/requests', payload);
    return response.data;
  },

  getLocationDemand: async (params = {}) => {
    try {
      const response = await apiClient.get('/location-access/demand', { params });
      return response.data?.demandCount || 0;
    } catch (_err) {
      return 0;
    }
  },
};

export default LocationService;
