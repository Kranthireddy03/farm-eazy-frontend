import apiClient from './apiClient'

export async function getPublicBlogPosts(category) {
  const params = {}
  if (category && category !== 'All') {
    params.category = category
  }
  const response = await apiClient.get('/public/blog-posts', { params })
  return Array.isArray(response.data) ? response.data : []
}

export async function getPublicBlogPostBySlug(slug) {
  const response = await apiClient.get(`/public/blog-posts/${slug}`)
  return response.data
}

export async function submitUserBlogPost(payload) {
  const response = await apiClient.post('/blog-posts/submissions', payload)
  return response.data
}

export async function getMyBlogSubmissions() {
  const response = await apiClient.get('/blog-posts/submissions/my')
  return Array.isArray(response.data) ? response.data : []
}

export async function submitBlogRating(slug, rating) {
  const response = await apiClient.post(`/blog-posts/${slug}/ratings`, { rating })
  return response.data
}
