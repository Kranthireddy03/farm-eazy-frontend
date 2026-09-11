import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  X,
  ShieldAlert,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Store,
  Wrench,
} from 'lucide-react';
import {
  startProductChat,
  startServiceChat,
  getMarketplaceMessages,
  sendMarketplaceMessage,
} from '../../services/marketplaceChatApi';
import {
  connectSupportStomp,
  subscribeConversation,
  stompSendMessage,
  stompSendTyping,
  releaseSupportStomp,
  startChatPresenceHeartbeat,
  stopChatPresenceHeartbeat,
} from '../../services/supportStompClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export default function MarketplaceDirectChatModal({
  open,
  onClose,
  product = null,
  service = null,
  conversationDisplayId = null,
}) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connState, setConnState] = useState('CONNECTING'); // CONNECTING | CONNECTED | RECONNECTING | OFFLINE
  const [peerTyping, setPeerTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeDisplayIdRef = useRef(null);

  const displayId = conversation?.displayId || conversationDisplayId;
  activeDisplayIdRef.current = displayId;

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerTyping, scrollToBottom]);

  // Initialize Conversation
  useEffect(() => {
    if (!open || !isAuthenticated) return;

    let isMounted = true;

    const initConversation = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let convData = null;
        if (conversationDisplayId) {
          convData = { displayId: conversationDisplayId };
        } else if (product?.id) {
          convData = await startProductChat(product.id);
        } else if (service?.id) {
          convData = await startServiceChat(service.id);
        } else {
          setErrorMsg('Invalid conversation parameters.');
          setLoading(false);
          return;
        }

        if (!isMounted) return;
        setConversation(convData);

        // Fetch history
        const history = await getMarketplaceMessages(convData.displayId);
        if (isMounted) {
          setMessages(Array.isArray(history) ? history : []);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          'Unable to start direct chat. The seller or provider may have disabled direct messaging.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [open, isAuthenticated, product?.id, service?.id, conversationDisplayId, showToast]);

  // STOMP WebSocket Live Connection
  useEffect(() => {
    if (!open || !displayId || !isAuthenticated) return;

    let active = true;
    let unsubscribe = () => {};
    let reconnectTimer = null;
    let attempt = 0;
    const MAX_ATTEMPTS = 6;

    const clearSocket = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        unsubscribe();
      } catch (_) {}
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

        startChatPresenceHeartbeat(30000);

        unsubscribe = subscribeConversation(displayId, (event) => {
          if (!active) return;
          if (event?.type === 'MESSAGE' && event?.message) {
            const m = event.message;
            setMessages((prev) => {
              const existingIdx = prev.findIndex(
                (item) =>
                  (m.id && item.id === m.id) ||
                  (m.clientMessageId && item.clientMessageId === m.clientMessageId)
              );
              if (existingIdx > -1) {
                const copy = [...prev];
                copy[existingIdx] = m;
                return copy;
              }
              return [...prev, m];
            });
            setPeerTyping(false);
          } else if (event?.type === 'TYPING') {
            const currentEmail = user?.email || localStorage.getItem('farmEazy_email');
            if (event.typing && event.senderEmail !== currentEmail) {
              setPeerTyping(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 4000);
            } else if (!event.typing) {
              setPeerTyping(false);
            }
          }
        });
      } catch (err) {
        if (!active) return;
        attempt += 1;
        if (attempt >= MAX_ATTEMPTS) {
          setConnState('OFFLINE');
          return;
        }
        setConnState('RECONNECTING');
        const delay = Math.min(1500 * Math.pow(2, attempt - 1), 15000);
        clearSocket();
        reconnectTimer = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      active = false;
      clearSocket();
      stopChatPresenceHeartbeat();
      releaseSupportStomp();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [open, displayId, isAuthenticated, user?.email]);

  // Handle Typing Notification
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (displayId) {
      stompSendTyping(displayId, e.target.value.trim().length > 0);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = input.trim();
    if (!content || !displayId || sending) return;

    setSending(true);
    const clientMessageId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: clientMessageId,
      clientMessageId,
      content,
      senderType: 'CUSTOMER',
      senderEmail: user?.email || localStorage.getItem('farmEazy_email'),
      senderName: user?.fullName || 'You',
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    if (displayId) {
      stompSendTyping(displayId, false);
    }

    try {
      // Try STOMP first
      await stompSendMessage(displayId, {
        conversationDisplayId: displayId,
        content,
        messageType: 'TEXT',
        clientMessageId,
      });
    } catch {
      // Fall back to REST endpoint
      try {
        const saved = await sendMarketplaceMessage(displayId, {
          content,
          messageType: 'TEXT',
          clientMessageId,
        });
        setMessages((prev) =>
          prev.map((m) => (m.clientMessageId === clientMessageId ? saved : m))
        );
      } catch (restErr) {
        showToast('Failed to deliver message. Please check your network.', 'error');
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId ? { ...m, failed: true } : m
          )
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const currentEmail = (user?.email || localStorage.getItem('farmEazy_email') || '').toLowerCase();
  const itemName = product?.productName || service?.title || service?.serviceName || 'Listing';
  const itemPrice = product ? `₹${product.price} / ${product.unit || 'unit'}` : (service ? `₹${service.basePrice || service.price || 0}` : '');
  const itemThumbnail = product?.imageUrls?.split(',')[0]?.trim() || (Array.isArray(product?.mediaUrls) ? product.mediaUrls[0] : null) || service?.imageUrl || null;
  const sellerName = product?.sellerFullName || product?.sellerEmail || service?.providerName || service?.providerEmail || 'Seller / Provider';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl h-[85vh] max-h-[720px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 via-background to-cyan-500/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {itemThumbnail ? (
              <img
                src={itemThumbnail}
                alt={itemName}
                className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                {product ? <Store className="w-5 h-5 text-primary" /> : <Wrench className="w-5 h-5 text-primary" />}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">{itemName}</h3>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  {product ? 'Product' : 'Service'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {sellerName} {itemPrice && <span className="text-primary font-semibold"> • {itemPrice}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                connState === 'CONNECTED'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : connState === 'RECONNECTING'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse'
                  : connState === 'OFFLINE'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connState === 'CONNECTED'
                    ? 'bg-emerald-500'
                    : connState === 'RECONNECTING'
                    ? 'bg-amber-500'
                    : connState === 'OFFLINE'
                    ? 'bg-rose-500'
                    : 'bg-muted-foreground'
                }`}
              />
              {connState === 'CONNECTED'
                ? 'Live'
                : connState === 'RECONNECTING'
                ? 'Reconnecting'
                : connState === 'OFFLINE'
                ? 'Offline'
                : 'Connecting'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-2 flex items-start gap-2.5 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
            <strong>Security Notice:</strong> Do NOT share passwords, OTPs, bank/card details, or UPI PINs. FarmEazy is not responsible for off-platform financial transactions.
          </p>
        </div>

        {/* Chat Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Connecting to direct messaging…</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Direct Chat Unavailable</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{errorMsg}</p>
              </div>
              <Button size="sm" variant="outline" onClick={onClose} className="mt-2 text-xs">
                Close Chat
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Start the conversation</p>
              <p className="text-[11px] max-w-xs">
                Ask the seller about product condition, availability, delivery timelines, or bulk orders.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const senderEmail = (m.senderEmail || '').toLowerCase();
              const isMe =
                m.sentByMe ||
                (currentEmail && senderEmail && currentEmail === senderEmail) ||
                m.senderType === 'CUSTOMER';
              const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={m.id || m.clientMessageId || idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[80%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card border border-border text-foreground rounded-bl-none'
                      }`}
                    >
                      {!isMe && m.senderName && (
                        <p className="text-[10px] font-bold text-primary mb-1">{m.senderName}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.content || m.message}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        }`}
                      >
                        <span>{timeStr}</span>
                        {isMe && (
                          <span>
                            {m.failed ? (
                              <span className="text-destructive font-bold">Failed</span>
                            ) : m.sending ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <CheckCheck className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {peerTyping && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>{sellerName} is typing…</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        {!errorMsg && (
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about this listing…"
              disabled={loading || Boolean(errorMsg)}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || sending || loading || Boolean(errorMsg)}
              className="gap-1.5 rounded-xl text-xs h-9 px-4 font-semibold"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
