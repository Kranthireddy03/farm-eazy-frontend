import apiClient from './apiClient';
import { unwrapApiData } from '../utils/apiResponse';

export const getPublicStats = async () => {
  const res = await apiClient.get('/public/stats');
  return unwrapApiData(res.data) || {};
};
