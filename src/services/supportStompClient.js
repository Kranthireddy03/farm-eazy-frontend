import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL, STORAGE_KEYS } from '../config/api';
import apiClient from './apiClient';

function wsUrl() {
  const apiRoot = String(API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');
  const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN) || '';
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${apiRoot}/ws/support${qs}`;
}

/**
 * Singleton STOMP client for live support conversations.
 *
 * The client is shared between chat and the notification bell. To avoid one
 * consumer tearing the connection down while another is still using it, every
 * subscription acquires a reference (refCount) and releases it on unsubscribe.
 * The connection is only deactivated once the last reference is released.
 */

let client = null;
let connecting = null;
let refCount = 0;
let connectedToken = null;

function createClient() {
  const stomp = new Client({
    webSocketFactory: () => new SockJS(wsUrl()),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: () => {
      const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    onStompError: (frame) => {
      // Log only the error category, never the raw frame body.
      if (import.meta.env.DEV) {
        console.warn('[LiveSupport STOMP] server error received; frame id=' + (frame.headers?.message || 'unknown'));
      }
    },
  });
  return stomp;
}

/**
 * Rebuild the client if it belongs to a different session token. This prevents
 * the app from reusing a stale connection after a logout/login cycle.
 */
function currentToken() {
  return localStorage.getItem(STORAGE_KEYS.USER_TOKEN) || '';
}

export function getSupportStompClient() {
  const token = currentToken();
  if (client?.connected && connectedToken !== token) {
    try { client.deactivate(); } catch (_) {}
    client = null;
    connectedToken = null;
  }
  if (client?.connected) {
    return client;
  }
  if (!client) {
    client = createClient();
  }
  return client;
}

function teardown() {
  try {
    if (client?.active) {
      client.deactivate();
    }
  } catch (_) {}
  client = null;
  connecting = null;
  connectedToken = null;
}

/**
 * Connects the shared STOMP client WITHOUT acquiring a reference.
 * Use for one-shot operations (sends) or before an explicit subscription.
 * Throws if the user is not authenticated so we never dial the socket
 * without a token (the source of the WebSocket errors seen on login).
 */
export async function connectSupportStomp() {
  const token = currentToken();
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }
  const stomp = getSupportStompClient();
  if (stomp.connected) {
    connectedToken = token;
    return stomp;
  }
  if (connecting) {
    return connecting;
  }

  connecting = new Promise((resolve, reject) => {
    let settled = false;
    const settleError = (msg) => {
      connecting = null;
      if (!settled) {
        settled = true;
        reject(new Error(msg));
      }
    };
    stomp.onConnect = () => {
      connecting = null;
      connectedToken = token;
      settled = true;
      resolve(stomp);
    };
    stomp.onWebSocketClose = () => settleError('WebSocket closed');
    stomp.onDisconnect = () => settleError('Disconnected');
    stomp.onStompError = (frame) => settleError(frame.headers?.message || 'STOMP connection failed');
    if (!stomp.active) {
      stomp.activate();
    }
  });

  return connecting;
}

/**
 * Releases one reference to the shared connection. The socket is only closed
 * once the last active consumer (notification bell, chat) releases it.
 */
export function releaseSupportStomp() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    teardown();
  }
}

/**
 * Force-tears down the shared connection (e.g. on logout).
 */
export function disconnectSupportStomp() {
  refCount = 0;
  teardown();
}

// Tear down the shared socket when the session ends so the next login always
// starts with a clean, freshly-authenticated connection.
if (typeof window !== 'undefined') {
  window.addEventListener('farmeazy:auth-logout', () => disconnectSupportStomp());
  window.addEventListener('authStateChange', (e) => {
    if (e?.detail && e.detail.isAuthenticated === false) {
      disconnectSupportStomp();
    }
  });
}

// ---- Chat presence heartbeat (backend keeps chat:active:user:{email} with a 90s TTL) ----
let heartbeatTimer = null;

/**
 * Sends a presence heartbeat to the backend every interval while a chat is active.
 * Single timer (deduped); returns a stop() function. Backend owns Redis state; the
 * frontend only calls the heartbeat API and never writes presence directly.
 */
export function startChatPresenceHeartbeat(intervalMs = 30000) {
  if (heartbeatTimer) {
    return () => stopChatPresenceHeartbeat();
  }
  const beat = async () => {
    try {
      await apiClient.post('/live/conversations/presence/heartbeat');
    } catch (_e) {
      // heartbeat is best-effort; never break chat or log the user out
    }
  };
  beat();
  heartbeatTimer = setInterval(beat, intervalMs);
  return () => stopChatPresenceHeartbeat();
}

export function stopChatPresenceHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function parseBody(message) {
  try {
    return JSON.parse(message.body);
  } catch {
    return { type: 'RAW', raw: message.body };
  }
}

/** Acquire a reference, connect, and wrap the subscription to auto-release. */
function withSubscription(subscribeFn) {
  refCount += 1;
  return connectSupportStomp()
    .then(subscribeFn)
    .then((sub) => {
      const originalUnsubscribe = sub.unsubscribe.bind(sub);
      sub.unsubscribe = () => {
        try { originalUnsubscribe(); } catch (_) {}
        releaseSupportStomp();
      };
      return sub;
    })
    .catch((err) => {
      releaseSupportStomp();
      throw err;
    });
}

export function subscribeConversation(displayId, handler) {
  const topic = `/topic/conversation.${displayId}`;
  return withSubscription((stomp) => stomp.subscribe(topic, (message) => handler(parseBody(message))));
}

export async function stompSendMessage(displayId, payload) {
  const stomp = await connectSupportStomp();
  stomp.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({
      conversationDisplayId: displayId,
      ...payload,
    }),
  });
}

export async function stompSendTyping(displayId, typing) {
  const stomp = await connectSupportStomp();
  stomp.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({
      conversationDisplayId: displayId,
      typing,
    }),
  });
}

export async function stompMarkRead(displayId, upToMessageId) {
  const stomp = await connectSupportStomp();
  stomp.publish({
    destination: '/app/chat.read',
    body: JSON.stringify({
      conversationDisplayId: displayId,
      upToMessageId,
    }),
  });
}

export async function stompMarkDelivered(messageId, userEmail) {
  const stomp = await connectSupportStomp();
  stomp.publish({
    destination: '/app/chat.delivered',
    body: JSON.stringify({ messageId }),
  });
}

export function subscribeAdminDashboard(handler) {
  return withSubscription((stomp) => stomp.subscribe('/topic/admin.dashboard', (message) => handler(parseBody(message))));
}

export function subscribeUserNotifications(handler) {
  return withSubscription((stomp) => stomp.subscribe('/user/queue/notifications', (message) => handler(parseBody(message))));
}
