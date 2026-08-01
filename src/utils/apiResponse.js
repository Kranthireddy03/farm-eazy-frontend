/**
 * Normalize API response bodies after apiClient interceptors.
 * Handles encrypted envelopes left undecrypted, paginated wrappers, and legacy shapes.
 */

export function isEncryptedEnvelope(data) {
  return Boolean(
    data
    && typeof data === 'object'
    && typeof data.payload === 'string'
    && Object.keys(data).length <= 2
  );
}

const LIST_KEYS = ['content', 'data', 'items', 'results', 'questions', 'posts', 'records', 'entries'];

/**
 * Extract an array from common API list response shapes.
 */
export function unwrapApiList(data, fallback = []) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return fallback;
  }

  if (isEncryptedEnvelope(data)) {
    console.error(
      '[FarmEazy API] Expected a list but received an encrypted payload envelope. '
      + 'Set VITE_API_ENCRYPTION_SECRET to match the backend API_ENCRYPTION_SECRET.'
    );
    return fallback;
  }

  for (const key of LIST_KEYS) {
    const candidate = data[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return fallback;
}

/**
 * Extract a single object from wrapped API responses.
 */
export function unwrapApiData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (isEncryptedEnvelope(data)) {
    console.error(
      '[FarmEazy API] Expected JSON but received an encrypted payload envelope. '
      + 'Set VITE_API_ENCRYPTION_SECRET to match the backend API_ENCRYPTION_SECRET.'
    );
    return null;
  }

  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
}

/**
 * Derive a short blog excerpt when the API omits excerpt.
 */
export function deriveBlogExcerpt(item) {
  if (item?.excerpt?.trim()) {
    return item.excerpt.trim();
  }

  const raw = item?.content || item?.body || item?.summary || '';
  if (typeof raw !== 'string' || !raw.trim()) {
    return 'Read more on the FarmEazy knowledge feed.';
  }

  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) {
    return 'Read more on the FarmEazy knowledge feed.';
  }

  return plain.length > 220 ? `${plain.slice(0, 217)}…` : plain;
}
