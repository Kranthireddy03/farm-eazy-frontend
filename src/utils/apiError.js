/**
 * Normalize backend ApiErrorResponseDto envelopes and legacy error shapes.
 */

export function getApiErrorPayload(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return null;
  return data;
}

export function getApiErrorCode(error) {
  const data = getApiErrorPayload(error);
  if (!data) return null;
  if (data.error?.code) return data.error.code;
  if (data.code) return data.code;
  return null;
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const data = getApiErrorPayload(error);
  if (!data) return error?.message || fallback;
  return data.error?.message || data.message || error?.message || fallback;
}

export function isLocationRequiredError(error) {
  return getApiErrorCode(error) === 'LOCATION_REQUIRED';
}

export function isRateLimitError(error) {
  const code = getApiErrorCode(error);
  return error?.response?.status === 429 || code === 'RATE_LIMIT_EXCEEDED' || code === 'PASSWORD_RESET_RATE_LIMITED';
}
