import apiClient from './apiClient'
import { unwrapApiList, unwrapApiData } from '../utils/apiResponse'

const BASE = '/admin/blog-posts'

const AdminBlogService = {
  async getAll() {
    const response = await apiClient.get(BASE)
    return unwrapApiList(response.data)
  },

  async create(payload) {
    const response = await apiClient.post(BASE, payload)
    return unwrapApiData(response.data)
  },

  async update(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload)
    return unwrapApiData(response.data)
  },

  async publish(id) {
    const response = await apiClient.post(`${BASE}/${id}/publish`)
    return unwrapApiData(response.data)
  },

  async submitApproval(id) {
    const response = await apiClient.post(`${BASE}/${id}/submit-approval`)
    return unwrapApiData(response.data)
  },

  async approve(id) {
    const response = await apiClient.post(`${BASE}/${id}/approve`)
    return unwrapApiData(response.data)
  },

  async unpublish(id) {
    const response = await apiClient.post(`${BASE}/${id}/unpublish`)
    return unwrapApiData(response.data)
  },

  async remove(id) {
    const response = await apiClient.delete(`${BASE}/${id}`)
    return unwrapApiData(response.data)
  },
}

export default AdminBlogService
