/**
 * Farm Eazy API regression harness — mirrors frontend apiClient encryption/gateway headers.
 * Usage: node scripts/regression-api.mjs
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvLocal() {
  const path = join(ROOT, '.env.local');
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const API_BASE = (process.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '').replace(/\/api$/, '');
const API_ROOT = `${API_BASE}/api`;
const ENCRYPTION_SECRET = process.env.VITE_API_ENCRYPTION_SECRET || '';
const GATEWAY_CLIENT = process.env.VITE_API_GATEWAY_CLIENT || 'farmeazy-frontend';
const ENCRYPTION_ENABLED = (process.env.VITE_API_ENCRYPTION_ENABLED || 'true') !== 'false';
const GATEWAY_ENABLED = (process.env.VITE_API_GATEWAY_ENABLED || 'true') !== 'false';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function normalizeEncryptionKey(secret) {
  const secretBytes = textEncoder.encode(secret || '');
  if (secretBytes.length < 32) throw new Error('Encryption secret must be at least 32 characters');
  const keyBytes = new Uint8Array(32);
  keyBytes.set(secretBytes.subarray(0, 32));
  return keyBytes;
}

async function importAesKey() {
  const keyBytes = normalizeEncryptionKey(ENCRYPTION_SECRET);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function fromBase64(base64) {
  return Buffer.from(base64, 'base64');
}

async function encryptPayload(plainObject) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = textEncoder.encode(JSON.stringify(plainObject));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return toBase64(combined.buffer);
}

async function decryptPayload(encryptedPayload) {
  const key = await importAesKey();
  const combined = fromBase64(encryptedPayload);
  const iv = combined.subarray(0, 12);
  const cipherBytes = combined.subarray(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  return JSON.parse(textDecoder.decode(decrypted));
}

async function normalizeBody(data) {
  if (data && typeof data === 'object' && typeof data.payload === 'string' && ENCRYPTION_SECRET) {
    return decryptPayload(data.payload);
  }
  return data;
}

let gatewayTs = Date.now();

function nextGatewayTimestamp() {
  const now = Date.now();
  gatewayTs = now > gatewayTs ? now : gatewayTs + 1;
  return String(gatewayTs);
}

async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const url = path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { Accept: 'application/json', ...(options.headers || {}) };

  let body = options.body;
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (body && typeof body === 'object' && ENCRYPTION_ENABLED && ENCRYPTION_SECRET) {
    const encrypted = await encryptPayload(body);
    body = { payload: encrypted };
    headers['Content-Type'] = 'application/json';
  } else if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  if (GATEWAY_ENABLED) {
    headers['X-Gateway-Client'] = GATEWAY_CLIENT;
    headers['X-Gateway-Timestamp'] = nextGatewayTimestamp();
    if (isMutating) headers['X-Request-Nonce'] = randomUUID();
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  const data = await normalizeBody(json);
  return { status: response.status, ok: response.ok, data, raw: json };
}

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`${icon} | ${name}${detail ? ` — ${detail}` : ''}`);
}

async function run() {
  console.log('Farm Eazy API regression');
  console.log(`API_ROOT=${API_ROOT}`);
  console.log('---');

  // Public endpoints
  const blog = await apiRequest('/public/blog-posts');
  record('GET /api/public/blog-posts', blog.ok && Array.isArray(blog.data), `status=${blog.status}`);

  const faq = await apiRequest('/faq-questions?source=user');
  record('GET /api/faq-questions', faq.ok, `status=${faq.status}`);

  const health = await fetch(`${API_BASE}/actuator/health/readiness`);
  record('GET /actuator/health/readiness', health.ok, `status=${health.status}`);

  const system = await apiRequest('/system/full-status');
  record('GET /api/system/full-status', system.ok, `status=${system.status}`);

  // Auth
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'support@farm-eazy.com', password: 'DevAdmin123!' },
  });
  const token = login.data?.token;
  record('POST /api/auth/login', login.ok && token, `status=${login.status}`);

  if (!token) {
    console.log('Cannot continue authenticated tests without token.');
    printSummary();
    process.exit(1);
  }

  const me = await apiRequest('/users/me', { token });
  const hasProfile = me.ok && me.data?.email;
  const hasLocation = me.data?.effectiveLocation?.present === true;
  record('GET /api/users/me', hasProfile, `status=${me.status}, effectiveLocation=${me.data?.effectiveLocation?.present ?? 'n/a'}`);

  const addresses = await apiRequest('/addresses', { token });
  record('GET /api/addresses', addresses.ok && Array.isArray(addresses.data), `status=${addresses.status}, count=${Array.isArray(addresses.data) ? addresses.data.length : 'n/a'}`);

  let addrId = null;
  if (!hasLocation) {
    const createAddr = await apiRequest('/addresses', {
      method: 'POST',
      token,
      body: {
        fullName: 'Regression Tester',
        phoneNumber: '9876543210',
        email: 'support@farm-eazy.com',
        addressLine1: 'Regression test map location',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500001',
        country: 'India',
        label: 'Regression',
        latitude: 17.385,
        longitude: 78.4867,
        isDefault: false,
      },
    });
    addrId = createAddr.data?.id;
    record('POST /api/addresses (bootstrap location)', createAddr.ok && addrId, `status=${createAddr.status}, id=${addrId ?? 'n/a'}`);

    if (addrId) {
      const setCurrent = await apiRequest('/addresses/current', {
        method: 'PATCH',
        token,
        body: { addressId: addrId },
      });
      record('PATCH /api/addresses/current (bootstrap)', setCurrent.ok, `status=${setCurrent.status}`);

      const meAfter = await apiRequest('/users/me', { token });
      record(
        'GET /api/users/me after location set',
        meAfter.ok && meAfter.data?.effectiveLocation?.present === true,
        `present=${meAfter.data?.effectiveLocation?.present}`
      );
    }
  } else {
    record('Location bootstrap', true, 'effectiveLocation already present');
  }

  const coins = await apiRequest('/coins', { token });
  record('GET /api/coins', coins.ok, `status=${coins.status}`);

  const farms = await apiRequest('/farms', { token });
  record('GET /api/farms', farms.ok, `status=${farms.status}`);

  const products = await apiRequest('/products', { token });
  record('GET /api/products', products.ok, `status=${products.status}`);

  const orders = await apiRequest('/orders', { token });
  record('GET /api/orders', orders.ok, `status=${orders.status}`);

  const notifications = await apiRequest('/notifications/count', { token });
  record('GET /api/notifications/count', notifications.ok, `status=${notifications.status}`);

  const activities = await apiRequest('/activities?page=0&size=20', { token });
  record('GET /api/activities', activities.ok && Array.isArray(activities.data), `status=${activities.status}, count=${Array.isArray(activities.data) ? activities.data.length : 'n/a'}`);

  const listingEligibility = await apiRequest('/vendors/listing-eligibility?listingType=PRODUCT', { token });
  record('GET /api/vendors/listing-eligibility', listingEligibility.ok, `status=${listingEligibility.status}`);

  // Extra mutation test when we created a fresh address above
  if (!hasLocation && addrId) {
    record('POST /api/addresses (regression)', true, `used bootstrap id=${addrId}`);
  } else {
    const createAddr = await apiRequest('/addresses', {
      method: 'POST',
      token,
      body: {
        fullName: 'Regression Tester',
        phoneNumber: '9876543210',
        email: 'support@farm-eazy.com',
        addressLine1: 'Regression secondary address',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500002',
        country: 'India',
        label: 'Regression2',
        latitude: 17.39,
        longitude: 78.49,
        isDefault: false,
      },
    });
    const newId = createAddr.data?.id;
    record('POST /api/addresses (regression)', createAddr.ok && newId, `status=${createAddr.status}, id=${newId ?? 'n/a'}`);
  }

  printSummary();
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}

function printSummary() {
  const failed = results.filter((r) => !r.pass);
  console.log('---');
  console.log(`Total: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length) {
    console.log('Failures:', failed.map((f) => f.name).join(', '));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
