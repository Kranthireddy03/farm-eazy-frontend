import apiClient from './apiClient';

export const getAdminUsers = async () => {
  const res = await apiClient.get('/admin/users');
  return res.data;
};

export const assignRoleByEmail = async (email, role) => {
  const res = await apiClient.put(`/admin/users/${encodeURIComponent(email)}/role`, null, { params: { role } });
  return res.data;
};

export const manageUserRoleById = async (userId, role, assign = true) => {
  // Assign or remove role by userId
  const res = await apiClient.put(`/admin/users/id/${userId}/role`, null, { params: { role, assign } });
  return res.data;
};

// Fetch roles by user ID
export const getRolesById = async (userId) => {
  const res = await apiClient.get(`/admin/users/id/${userId}/roles`);
  return res.data;
};

// Fetch roles by email
export const getRolesByEmail = async (email) => {
  const res = await apiClient.get(`/admin/users/${encodeURIComponent(email)}/roles`);
  return res.data;
};
