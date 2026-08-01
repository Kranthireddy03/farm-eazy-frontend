import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL, STORAGE_KEYS } from '../config/api';

function wsUrl() {
  const apiRoot = String(API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');
  const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN) || '';
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${apiRoot}/ws/support${qs}`;
}

/**
 * Singleton STOMP client for live support conversations.
 */
let client = null;
let connecting = null;

export function getSupportStompClient() {
  if (client?.connected) {
    return client;
  }

  if (!client) {
    client = new Client({
      webSocketFactory: () => new SockJS(wsUrl()),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: () => {
        const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      onStompError: (frame) => {
        console.warn('[LiveSupport STOMP]', frame.headers?.message || frame.body);
      },
    });
  }

  return client;
}

export async function connectSupportStomp() {
  const stomp = getSupportStompClient();
  if (stomp.connected) {
    return stomp;
  }
  if (connecting) {
    return connecting;
  }

  connecting = new Promise((resolve, reject) => {
    stomp.onConnect = () => {
      connecting = null;
      resolve(stomp);
    };
    stomp.onWebSocketClose = () => {
      connecting = null;
    };
    stomp.onDisconnect = () => {
      connecting = null;
    };
    stomp.onStompError = (frame) => {
      connecting = null;
      reject(new Error(frame.headers?.message || 'STOMP connection failed'));
    };
    if (!stomp.active) {
      stomp.activate();
    }
  });

  return connecting;
}

export function disconnectSupportStomp() {
  if (client?.active) {
    client.deactivate();
  }
  client = null;
  connecting = null;
}

export function subscribeConversation(displayId, handler) {
  const topic = `/topic/conversation.${displayId}`;
  return connectSupportStomp().then((stomp) => {
    return stomp.subscribe(topic, (message) => {
      try {
        const body = JSON.parse(message.body);
        handler(body);
      } catch {
        handler({ type: 'RAW', raw: message.body });
      }
    });
  });
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
  return connectSupportStomp().then((stomp) => {
    return stomp.subscribe('/topic/admin.dashboard', (message) => {
      try {
        handler(JSON.parse(message.body));
      } catch {
        handler(null);
      }
    });
  });
}
