/**
 * Bridges API interceptors (non-React) with the location wizard (React).
 * Queues failed requests until the user selects a location, then retries them.
 */

const pendingRetries = [];
let openWizardHandler = null;
let locationReadyHandler = null;

export function registerLocationApiHandlers({ openWizard, onLocationReady }) {
  openWizardHandler = openWizard;
  locationReadyHandler = onLocationReady;
}

export function unregisterLocationApiHandlers() {
  openWizardHandler = null;
  locationReadyHandler = null;
}

export function requestLocationWizard(detail = {}) {
  if (openWizardHandler) {
    openWizardHandler(detail);
  } else {
    window.dispatchEvent(new CustomEvent('farmeazy:open-location-modal', { detail }));
  }
}

/**
 * Pause an axios request until location is saved, then retry via apiClient.
 */
export function enqueueLocationRetry(retryFn) {
  return new Promise((resolve, reject) => {
    pendingRetries.push({ retryFn, resolve, reject });
    requestLocationWizard({ reason: 'LOCATION_REQUIRED', blocking: false });
  });
}

export async function flushLocationRetryQueue() {
  const queue = pendingRetries.splice(0, pendingRetries.length);
  const results = queue.map(async ({ retryFn, resolve, reject }) => {
    try {
      const response = await retryFn();
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
  await Promise.allSettled(results);
  if (locationReadyHandler) {
    locationReadyHandler();
  }
}

export function hasPendingLocationRetries() {
  return pendingRetries.length > 0;
}
