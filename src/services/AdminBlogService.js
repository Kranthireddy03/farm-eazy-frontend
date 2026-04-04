import apiClient from './apiClient'

const BASE = '/admin/blog-posts'

const AdminBlogService = {
  async getAll() {
    const response = await apiClient.get(BASE)
    return Array.isArray(response.data) ? response.data : []
  },

  async create(payload) {
    const response = await apiClient.post(BASE, payload)
    return response.data
  },

  async update(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload)
    return response.data
  },

  async publish(id) {
    const response = await apiClient.post(`${BASE}/${id}/publish`)
    return response.data
  },

  async submitApproval(id) {
    const response = await apiClient.post(`${BASE}/${id}/submit-approval`)
    return response.data
  },

  async approve(id) {
    const response = await apiClient.post(`${BASE}/${id}/approve`)
    return response.data
  },

  async unpublish(id) {
    const response = await apiClient.post(`${BASE}/${id}/unpublish`)
    return response.data
  },

  async remove(id) {
    const response = await apiClient.delete(`${BASE}/${id}`)
    return response.data
  },
}

export default AdminBlogService
