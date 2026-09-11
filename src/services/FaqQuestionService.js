import apiClient from './apiClient'
import { unwrapApiList } from '../utils/apiResponse'

const faqCache = new Map()
const CACHE_TTL_MS = 60 * 1000 // 1 minute in-memory cache for instant repeated UI navigation

/**
 * Approved FAQs from backend (addedToFAQ=true, filtered by source + visibility).
 * @param {string} source - 'user' | 'admin' — matches backend source/visibility filter
 * @param {boolean} forceRefresh - bypass client-side cache
 */
export async function getApprovedFaqQuestions(source = 'user', forceRefresh = false) {
  const cacheKey = String(source || 'user').toLowerCase()
  const cached = faqCache.get(cacheKey)
  const now = Date.now()

  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data
  }

  const res = await apiClient.get('/faq-questions', { params: { source } })
  const unwrapped = unwrapApiList(res.data)
  faqCache.set(cacheKey, { data: unwrapped, timestamp: now })
  return unwrapped
}

export function clearFaqClientCache() {
  faqCache.clear()
}

