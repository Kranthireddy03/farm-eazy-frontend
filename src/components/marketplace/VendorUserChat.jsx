import { useEffect, useRef, useState } from 'react';
import {
  connectSupportStomp,
  subscribeConversation,

  releaseSupportStomp,
  startChatPresenceHeartbeat,
  stopChatPresenceHeartbeat,
} from '../../services/supportStompClient';
import { getLiveMessages } from '../../services/vendorConversationApi';
import { useToast } from '../../hooks/useToast';

/**
 * Private vendor <-> user chat window for a VENDOR_USER conversation. Participant
 * authorization is enforced by the backend on REST (message history) and on the STOMP
 * subscription; changing conversationId cannot grant access to another conversation.
 */
export default function VendorUserChat({ displayId, participantName }) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connState, setConnState] = useState('CONNECTING'); // CONNECTING | CONNECTED | RECONNECTING | OFFLINE
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const idRef = useRef(displayId);
  idRef.current = displayId;

  const loadHistory = async (did) => {
    setLoading(true);
    try {
      const list = await getLiveMessages(did);
      setMessages(Array.isArray(list) ? list : []);
    } catch (e) {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(displayId);
  }, [displayId]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    let timer = null;
    let attempt = 0;
    const MAX_ATTEMPTS = 6;

    const clearSocket = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      try { unsubscribe(); } catch (_) {}
      unsubscribe = () => {};
    };

    const connect = async () => {
      if (!active) return;
      setConnState(attempt === 0 ? 'CONNECTING' : 'RECONNECTING');
      try {
        await connectSupportStomp();
        if (!active) return;
        setConnState('CONNECTED');
        attempt = 0;
        // Refresh the backend presence key while the chat is open.
        startChatPresenceHeartbeat(30000);
        unsubscribe = subscribeConversation(displayId, (evt) => {
          if (evt && evt.type === 'MESSAGE' && evt.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === evt.message.id)) return prev;
              return [...prev, evt.message];
            });
          }
        });
      } catch (e) {
        if (!active) return;
        attempt += 1;
        if (attempt >= MAX_ATTEMPTS) {
          setConnState('OFFLINE');
          showToast('Chat is offline. Messages will sync when you reconnect.', 'error');
          return;
        }
        setConnState('RECONNECTING');
        const delay = Math.min(1500 * Math.pow(2, attempt - 1), 15000);
        clearSocket();
        timer = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      active = false;
      clearSocket();
      stopChatPresenceHeartbeat();
      releaseSupportStomp();
    };
  }, [displayId, showToast]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setSending(true);
    const clientMessageId = 'c-' + Date.now();
    try {
      await stompSendMessage(displayId, {
        conversationDisplayId: displayId,
        content,
        messageType: 'TEXT',
        clientMessageId,
      });
      setMessages((prev) => [...prev, { id: clientMessageId, content, senderType: 'AGENT', sentByMe: true }]);
      setInput('');
    } catch (err) {
      try {
        const { sendLiveMessage } = await import('../../services/vendorConversationApi');
        await sendLiveMessage(displayId, { content, messageType: 'TEXT', clientMessageId });
        setMessages((prev) => [...prev, { id: clientMessageId, content, senderType: 'AGENT', sentByMe: true }]);
        setInput('');
      } catch (e2) {
        showToast('Failed to send message', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const isMine = (m) => m.sentByMe || (m.sender && m.sender === 'AGENT');

  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden h-[min(70vh,34rem)] max-h-[calc(100dvh-8rem)]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div>
          <p className="font-semibold text-sm">Private chat</p>
          <p className="text-xs text-muted-foreground">{participantName || 'Vendor conversation'}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            connState === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-500'
              : connState === 'OFFLINE' ? 'bg-rose-500/15 text-rose-500'
              : connState === 'RECONNECTING' ? 'bg-amber-500/15 text-amber-500'
              : 'bg-slate-500/15 text-slate-300'
          }`}
        >
          {connState === 'CONNECTED' ? 'Connected'
            : connState === 'RECONNECTING' ? 'Reconnecting…'
            : connState === 'OFFLINE' ? 'Offline'
            : 'Connecting…'}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background min-h-0">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id ?? m.clientMessageId} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMine(m) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p>{m.content || m.message}</p>
                <p className={`text-[10px] mt-1 ${isMine(m) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="p-3 border-t border-border flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
