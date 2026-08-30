import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startLiveConversation,
  getLiveMessages,
  closeLiveConversation,
  submitLiveRating,
} from '../services/liveConversationApi';
import {
  connectSupportStomp,
  releaseSupportStomp,
  subscribeConversation,
  stompSendMessage,
  stompSendTyping,
  startChatPresenceHeartbeat,
  stopChatPresenceHeartbeat,
} from '../services/supportStompClient';

export function useLiveSupportChat({ enabled, sessionKey }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const subscriptionRef = useRef(null);

  // In-memory queue of pending message payloads waiting for ACK
  const pendingQueueRef = useRef([]);

  const displayId = conversation?.displayId;

  const initChat = useCallback(async () => {
    setLoading(true);
    setConnecting(true);
    try {
      const conv = await startLiveConversation();
      setConversation(conv);
      // Refresh the backend presence key while this support chat is active.
      startChatPresenceHeartbeat(30000);

      const history = await getLiveMessages(conv.displayId);
      
      const historyMessages = history.map(m => ({
        id: m.id || m.clientMessageId,
        sender: m.senderType === 'CUSTOMER' ? 'user' : 'support',
        text: m.content,
        senderName: m.senderName,
        createdAt: m.createdAt,
      }));

      // Combine history with in-memory pending items
      const combined = [...historyMessages];
      pendingQueueRef.current.forEach(p => {
        if (!combined.some(h => h.id === p.id)) {
          combined.push({
            id: p.id,
            sender: 'user',
            text: p.text,
            sending: true,
          });
        }
      });

      setMessages(combined);
      if (String(conv.mode || '').toUpperCase() === 'AI_BOT') {
        setLiveMode(false);
        return;
      }
      setLiveMode(true);
      
      await connectSupportStomp();
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      subscriptionRef.current = await subscribeConversation(conv.displayId, (event) => {
        if (event.type === 'MESSAGE' && event.message) {
          const m = event.message;
          setMessages(prev => {
            // Remove from in-memory pending queue
            pendingQueueRef.current = pendingQueueRef.current.filter(item => item.id !== m.clientMessageId);

            const existingIndex = prev.findIndex(x => x.id === m.clientMessageId || (m.id && x.id === m.id));
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                id: m.id || m.clientMessageId,
                sender: m.senderType === 'CUSTOMER' ? 'user' : 'support',
                text: m.content,
                senderName: m.senderName,
                createdAt: m.createdAt,
                sending: false,
              };
              return updated;
            }
            return [...prev, {
              id: m.id || m.clientMessageId,
              sender: m.senderType === 'CUSTOMER' ? 'user' : 'support',
              text: m.content,
              senderName: m.senderName,
              createdAt: m.createdAt,
            }];
          });
        } else if (event.type === 'TYPING') {
          if (event.typing && event.senderEmail !== localStorage.getItem('farmEazy_email')) {
            setTypingUser(event.senderEmail);
          } else {
            setTypingUser(null);
          }
        } else if (event.type === 'STATUS' && event.conversation) {
          setConversation(event.conversation);
          if (event.conversation.status === 'CLOSED') {
            setShowRating(true);
          }
        }
      });

      // Flush any in-memory pending messages
      for (const msg of pendingQueueRef.current) {
        await stompSendMessage(conv.displayId, {
          content: msg.text,
          clientMessageId: msg.id,
        });
      }
    } catch (e) {
      setLiveMode(false);
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      initChat();
    } else {
      setConversation(null);
      setMessages([]);
      setLiveMode(false);
      pendingQueueRef.current = [];
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      releaseSupportStomp();
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, sessionKey, initChat]);

  const sendMessage = async (text) => {
    if (!text.trim() || !displayId) return;
    const clientMessageId = 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Add locally immediately with sending indicator
    const newMsg = {
      id: clientMessageId,
      sender: 'user',
      text,
      sending: true,
    };
    setMessages(prev => [...prev, newMsg]);

    // Store in in-memory queue
    pendingQueueRef.current.push({ id: clientMessageId, text });

    try {
      await stompSendMessage(displayId, {
        content: text,
        clientMessageId,
      });
    } catch {
      // Retried automatically upon reconnection sync loop in initChat.
    }
  };

  const notifyTyping = (typing) => {
    if (displayId) {
      stompSendTyping(displayId, typing);
    }
  };

  const closeChat = async () => {
    stopChatPresenceHeartbeat();
    if (displayId) {
      await closeLiveConversation(displayId);
      setLiveMode(false);
      setShowRating(true);
    }
  };

  // Stop the heartbeat if the component unmounts (chat no longer active).
  useEffect(() => () => stopChatPresenceHeartbeat(), []);

  const submitRatingValue = async (rating, comment) => {
    if (displayId) {
      await submitLiveRating(displayId, rating, comment);
      setShowRating(false);
    }
  };

  return {
    conversationId: displayId,
    conversation,
    messages,
    loading,
    connecting,
    liveMode,
    typingUser,
    showRating,
    sendMessage,
    notifyTyping,
    closeChat,
    submitRating: submitRatingValue,
  };
}
