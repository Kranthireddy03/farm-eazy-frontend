import { useCallback, useEffect, useRef, useState } from 'react';
import {
  closeLiveConversation,
  escalateLiveConversation,
  getAgentsOnline,
  getLiveMessages,
  sendLiveMessage,
  startLiveConversation,
  submitLiveRating,
  uploadLiveAttachment,
} from '../services/liveConversationApi';
import {
  connectSupportStomp,
  disconnectSupportStomp,
  stompMarkDelivered,
  stompMarkRead,
  stompSendMessage,
  stompSendTyping,
  subscribeConversation,
} from '../services/supportStompClient';

const CLOSED_STATUSES = new Set(['CLOSED', 'RESOLVED']);

export function normalizeLiveMessage(message) {
  if (!message) return null;
  const senderType = String(message.senderType || '').toUpperCase();
  const sender = senderType === 'CUSTOMER' || senderType === 'USER' ? 'user' : 'support';
  const text = String(message.content || message.message || '').trim();
  if (!text && !message.attachmentUrl) return null;

  const attachments = [];
  if (message.attachmentUrl) {
    attachments.push({
      url: message.attachmentUrl,
      fileName: message.attachmentName || 'attachment',
    });
  }

  return {
    id: message.id,
    sender,
    text,
    senderName: message.senderName,
    createdAt: message.createdAt || null,
    deliveryStatus: message.deliveryStatus,
    attachments,
    clientMessageId: message.clientMessageId,
  };
}

function mergeLiveMessages(existing, incoming) {
  const byKey = new Map();
  existing.forEach((msg) => {
    const key = msg.id ? `id:${msg.id}` : `${msg.sender}:${msg.text}:${msg.createdAt || ''}`;
    byKey.set(key, msg);
  });
  incoming.forEach((msg) => {
    const key = msg.id ? `id:${msg.id}` : `${msg.sender}:${msg.text}:${msg.createdAt || ''}`;
    byKey.set(key, msg);
  });
  return Array.from(byKey.values());
}

export function useLiveSupportChat({ enabled, sessionKey = 0, onFallback }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [typingFrom, setTypingFrom] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const subscriptionRef = useRef(null);
  const typingHideRef = useRef(null);
  const onFallbackRef = useRef(onFallback);
  const bootstrapInFlightRef = useRef(false);
  const conversationId = conversation?.displayId;

  useEffect(() => {
    onFallbackRef.current = onFallback;
  }, [onFallback]);

  const applyStompEvent = useCallback((event) => {
    if (!event?.type) return;

    if (event.type === 'STATUS' && event.conversation) {
      setConversation(event.conversation);
      if (CLOSED_STATUSES.has(String(event.conversation.status || '').toUpperCase())) {
        setShowRating(true);
      }
      return;
    }

    if (event.type === 'MESSAGE' && event.message) {
      const normalized = normalizeLiveMessage(event.message);
      if (normalized) {
        setMessages((prev) => mergeLiveMessages(prev, [normalized]));
        if (normalized.id && normalized.sender !== 'user') {
          stompMarkDelivered(normalized.id).catch(() => {});
        }
      }
      return;
    }

    if (event.type === 'TYPING' && event.typing) {
      const senderType = String(event.typing.senderType || '').toUpperCase();
      if (senderType === 'CUSTOMER' || senderType === 'USER') {
        setTypingFrom(event.typing.senderName || 'Customer');
        if (typingHideRef.current) clearTimeout(typingHideRef.current);
        typingHideRef.current = setTimeout(() => setTypingFrom(null), 3000);
      }
      return;
    }

    if (event.type === 'DELIVERED' && event.messageId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === event.messageId ? { ...msg, deliveryStatus: 'DELIVERED' } : msg
        )
      );
      return;
    }

    if (event.type === 'READ') {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, deliveryStatus: 'READ' }))
      );
    }
  }, []);

  const bootstrapLive = useCallback(async () => {
    if (bootstrapInFlightRef.current) return;
    bootstrapInFlightRef.current = true;
    setConnecting(true);
    try {
      const online = await getAgentsOnline();
      setLiveAvailable(Boolean(online?.agentsOnline));

      const conv = await startLiveConversation();
      setConversation(conv);
      setLiveMode(true);

      const history = await getLiveMessages(conv.displayId);
      const normalized = (history || []).map(normalizeLiveMessage).filter(Boolean);
      setMessages(normalized);

      await connectSupportStomp();
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      subscriptionRef.current = await subscribeConversation(conv.displayId, applyStompEvent);

      const lastId = normalized.length ? normalized[normalized.length - 1].id : null;
      if (lastId) {
        stompMarkRead(conv.displayId, lastId).catch(() => {});
      }

      if (CLOSED_STATUSES.has(String(conv.status || '').toUpperCase())) {
        setShowRating(true);
      }
    } catch (err) {
      setLiveMode(false);
      if (onFallbackRef.current) onFallbackRef.current(err);
    } finally {
      bootstrapInFlightRef.current = false;
      setConnecting(false);
    }
  }, [applyStompEvent]);

  useEffect(() => {
    if (!enabled) return undefined;

    bootstrapLive();

    return () => {
      bootstrapInFlightRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (typingHideRef.current) clearTimeout(typingHideRef.current);
    };
  }, [enabled, sessionKey, bootstrapLive]);

  useEffect(() => {
    if (!enabled) {
      disconnectSupportStomp();
    }
  }, [enabled]);

  const sendMessage = async (text, file = null) => {
    if (!conversationId || loading) return false;
    const clean = String(text || '').trim();
    if (!clean && !file) return false;

    setLoading(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      if (file) {
        const uploaded = await uploadLiveAttachment(conversationId, file);
        attachmentUrl = uploaded?.url;
        attachmentName = uploaded?.name || file.name;
      }

      const clientMessageId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        content: clean || `Attachment: ${attachmentName || 'file'}`,
        messageType: attachmentUrl ? 'ATTACHMENT' : 'TEXT',
        attachmentUrl,
        attachmentName,
        clientMessageId,
      };

      const optimistic = normalizeLiveMessage({
        senderType: 'CUSTOMER',
        content: payload.content,
        attachmentUrl,
        attachmentName,
        clientMessageId,
        createdAt: new Date().toISOString(),
      });
      if (optimistic) {
        setMessages((prev) => mergeLiveMessages(prev, [optimistic]));
      }

      try {
        await stompSendMessage(conversationId, payload);
      } catch {
        const saved = await sendLiveMessage(conversationId, payload);
        const normalized = normalizeLiveMessage(saved);
        if (normalized) {
          setMessages((prev) => mergeLiveMessages(prev, [normalized]));
        }
      }

      stompSendTyping(conversationId, false).catch(() => {});

      return true;
    } finally {
      setLoading(false);
    }
  };

  const notifyTyping = (typing) => {
    if (!conversationId || !liveMode) return;
    stompSendTyping(conversationId, typing).catch(() => {});
  };

  const submitRating = async (rating, feedbackComment) => {
    if (!conversationId) return;
    await submitLiveRating(conversationId, rating, feedbackComment);
    setShowRating(false);
  };

  const requestHuman = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const updated = await escalateLiveConversation(conversationId);
      setConversation(updated);
    } finally {
      setLoading(false);
    }
  };

  const closeConversation = async (resolved = true) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const updated = await closeLiveConversation(conversationId, resolved);
      setConversation(updated);
      setShowRating(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    conversation,
    conversationId,
    messages,
    loading,
    connecting,
    liveAvailable,
    liveMode,
    typingFrom,
    showRating,
    sendMessage,
    notifyTyping,
    submitRating,
    requestHuman,
    closeConversation,
    refreshAgentsOnline: async () => {
      const online = await getAgentsOnline();
      setLiveAvailable(Boolean(online?.agentsOnline));
    },
  };
}
