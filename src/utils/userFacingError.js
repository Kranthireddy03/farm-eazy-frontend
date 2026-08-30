import { getApiErrorCode, getApiErrorMessage } from './apiError';

/**
 * Map API/network failures to clear, user-safe messages (no stack traces or secrets).
 */
export function getUserFacingErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  const code = getApiErrorCode(error);

  if (code === 'LOCATION_REQUIRED') {
    return 'Set your service location to continue. Open the location wizard and choose an address or map pin.';
  }

  if (code === 'RATE_LIMIT_EXCEEDED' || code === 'PASSWORD_RESET_RATE_LIMITED') {
    return getApiErrorMessage(error, 'Too many requests. Please wait a moment and try again.');
  }

  if (error?.code === 'API_DECRYPT_FAILED' || error?.code === 'API_ENCRYPTION_MISCONFIG') {
    return 'We could not read a secure server response. If this continues, contact support.';
  }

  if (error?.isRateLimited) {
    return getApiErrorMessage(error, 'Too many requests. Please wait and try again.');
  }

  if (!error.response) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('network') || error.code === 'ERR_NETWORK') {
      return 'Network connection issue. Check your internet connection and try again.';
    }
    return error.message || 'Network connection issue. Please try again.';
  }

  const status = error.response?.status;
  if (status === 503) {
    return getApiErrorMessage(
      error,
      'This feature is temporarily unavailable. Our team has been notified — try again shortly.',
    );
  }

  if (status === 403) {
    return getApiErrorMessage(error, 'You do not have permission to perform this action.');
  }

  if (status === 404) {
    return getApiErrorMessage(error, 'The requested item could not be found.');
  }

  return getApiErrorMessage(error, fallback);
}
