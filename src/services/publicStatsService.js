import apiClient from './apiClient';

export const getPublicStats = async () => {
  const res = await apiClient.get('/public/stats');
  return res.data;
};
