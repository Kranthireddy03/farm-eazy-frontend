import apiClient from './apiClient'

/**
 * Approved FAQs from backend (addedToFAQ=true, filtered by source + visibility).
 * @param {string} source - 'user' | 'admin' — matches backend source/visibility filter
 */
export async function getApprovedFaqQuestions(source = 'user') {
  const res = await apiClient.get('/faq-questions', { params: { source } })
  return Array.isArray(res.data) ? res.data : []
}
