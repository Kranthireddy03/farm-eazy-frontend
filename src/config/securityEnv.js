/**
 * Resolves browser API security env vars for local and production builds.
 */

const PLACEHOLDER_SECRETS = new Set([
  'your-strong-32-plus-character-secret',
  'your-gateway-hmac-secret',
  'change-me',
  'changeme',
]);

function isPlaceholderSecret(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return true;
  if (PLACEHOLDER_SECRETS.has(trimmed)) return true;
  return /^your[-_]/i.test(trimmed);
}

export function resolveEncryptionSecret() {
  const configured = String(import.meta.env.VITE_API_ENCRYPTION_SECRET || '').trim();
  if (isPlaceholderSecret(configured)) {
    return '';
  }
  return configured;
}

export function isApiEncryptionEnabled() {
  if (import.meta.env.VITE_API_ENCRYPTION_ENABLED === 'false') {
    return false;
  }
  return Boolean(resolveEncryptionSecret());
}

export function isGatewayEnabled() {
  const flag = import.meta.env.VITE_API_GATEWAY_ENABLED;
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  // Match config/api.js — gateway on by default in local dev
  return !import.meta.env.PROD;
}

export function resolveGatewayClient() {
  const configured = String(import.meta.env.VITE_API_GATEWAY_CLIENT || '').trim();
  return configured || 'farmeazy-frontend';
}
