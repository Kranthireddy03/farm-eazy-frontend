import apiClient from './apiClient'
import { unwrapApiList, unwrapApiData } from '../utils/apiResponse'

export async function getPublicBlogPosts(category) {
  const params = {}
  if (category && category !== 'All') {
    params.category = category
  }
  const response = await apiClient.get('/public/blog-posts', { params })
  return unwrapApiList(response.data)
}

export async function getPublicBlogPostBySlug(slug) {
  const response = await apiClient.get(`/public/blog-posts/${slug}`)
  return unwrapApiData(response.data)
}

export async function submitUserBlogPost(payload) {
  const response = await apiClient.post('/blog-posts/submissions', payload)
  return unwrapApiData(response.data)
}

export async function getMyBlogSubmissions() {
  const response = await apiClient.get('/blog-posts/submissions/my')
  return unwrapApiList(response.data)
}

export async function submitBlogRating(slug, rating) {
  const response = await apiClient.post(`/blog-posts/${slug}/ratings`, { rating })
  return unwrapApiData(response.data)
}

export async function getBlogComments(slug) {
  const response = await apiClient.get(`/blog-posts/${slug}/comments`)
  return unwrapApiList(response.data)
}

export async function submitBlogComment(slug, content) {
  const response = await apiClient.post(`/blog-posts/${slug}/comments`, { content })
  return unwrapApiData(response.data)
}
