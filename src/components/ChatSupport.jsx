// FarmEazy In-App Unified Chat Support Component
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addResponse,
  addResponseWithAttachment,
  createTicket,
  createTicketWithAttachment,
  getTicket,
  getTicketMessages,
  getTickets,
  getUserChatStats,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '../services/SupportTicketService';
import apiClient from '../services/apiClient';
import { unwrapApiList } from '../utils/apiResponse';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import { useGlobalToast } from '../context/ToastContext';
import { STORAGE_KEYS } from '../config/api';
import { releaseSupportStomp } from '../services/supportStompClient';
import { useLiveSupportChat } from '../hooks/useLiveSupportChat';
import { getAgentAvailability } from '../services/liveConversationApi';
import { Button } from './ui/button';
import {
  Loader2,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  PlusCircle,
  Bell,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Paperclip,
  X,
  ChevronRight,
  Headphones,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_GREETING = '👋 Welcome to FarmEazy Support! Ask a question or chat with our support team.';
const CHAT_POLL_MS = 5000;

function extractUploadPath(url) {
  if (!url) return null;
  const raw = String(url);
  const match = raw.match(/\/uploads\/[^\s?#)]+/i);
  return match ? match[0] : null;
}

function normalizeAttachmentKey(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  return extractUploadPath(raw) || raw;
}

function toAbsoluteAttachmentUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isGreeting(text) {
  return /^(hi|hello|hey|hii|namaste|good\s+(morning|afternoon|evening))\b/.test(normalizeText(text));
}

function isHumanRequest(text) {
  return /(human|agent|executive|person|support team|real[- ]?time|live chat|talk to support|call me)/i.test(text);
}

function inferCategory(text) {
  const value = normalizeText(text);
  if (/(payment|razorpay|checkout|order failed|place order|refund|coin)/.test(value)) return 'PAYMENT_ISSUE';
  if (/(vendor|selling|listing|product|service)/.test(value)) return 'SERVICE_ISSUE';
  if (/(farm|crop|irrigat|water|schedule)/.test(value)) return 'TECHNICAL_ISSUE';
  if (/(account|login|otp|password|email|phone)/.test(value)) return 'ACCOUNT_ISSUE';
  return 'GENERAL';
}

function inferPriority(text) {
  const value = normalizeText(text);
  if (/(failed|error|urgent|blocked|cannot|can't|not working)/.test(value)) return 'HIGH';
  return 'MEDIUM';
}

function buildQuickReply(text, faqs) {
  const value = normalizeText(text);
  const matches = [
    { keywords: ['add a farm', 'create a farm', 'farm'], answer: 'Go to Farms, open Add Farm, and complete the farm details. If you need help with a specific error, you can raise a ticket.' },
    { keywords: ['schedule irrigation', 'irrigation'], answer: 'Open Irrigation, choose a farm and crop, then save the schedule. If the page is failing, our support team can assist.' },
    { keywords: ['order', 'checkout', 'payment', 'place order', 'razorpay'], answer: 'For orders, select an address first and then choose a payment method. If payment is failing, you can create a payment support ticket.' },
    { keywords: ['vendor', 'selling', 'listing', 'product', 'service'], answer: 'Vendor access is separate from listing approval. If verification is done but publishing still fails, our team can help.' },
    { keywords: ['support', 'ticket', 'contact'], answer: 'You can chat with our team here or raise a dedicated ticket for follow-up.' },
  ];

  for (const item of matches) {
    if (item.keywords.some((keyword) => value.includes(keyword))) {
      return item.answer;
    }
  }

  const faqMatch = (faqs || []).find((faq) => {
    const question = normalizeText(faq.question || faq.q);
    return question && (value.includes(question) || question.split(' ').some((word) => word.length > 4 && value.includes(word)));
  });

  if (faqMatch) {
    return faqMatch.answer || faqMatch.a || 'I found a related answer in the help center.';
  }

  return null;
}

function normalizeIncomingMessage(message) {
  if (!message) return null;
  const senderType = String(message.senderType || '').toUpperCase();
  const sender = senderType === 'USER' || senderType === 'CUSTOMER' ? 'user' : 'support';
  const text = String(message.message || message.content || '').trim();
  if (!text) return null;
  return {
    sender,
    text,
    createdAt: message.createdAt || null,
  };
}

function mergeMessages(existingMessages, incomingMessages) {
  const existing = new Set(existingMessages.map((msg) => `${msg.sender}:${msg.text}:${msg.createdAt || ''}`));
  const merged = [...existingMessages];
  incomingMessages.forEach((msg) => {
    const key = `${msg.sender}:${msg.text}:${msg.createdAt || ''}`;
    if (!existing.has(key)) {
      merged.push(msg);
      existing.add(key);
    }
  });
  return merged;
}

const stripAttachmentLines = (text) =>
  String(text || '')
    .replace(/^.*Attachment[s]?:\s*([^\n\r]+?)\s*\((https?:\/\/(?:[^\s)]+)|\/uploads\/[^\s)]+)\).*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const parseAttachmentsFromMessage = (message) => {
  if (!message) return [];
  const collected = [];
  const seen = new Set();

  const addAttachment = (url, fallbackName = 'attachment') => {
    const normalizedUrl = String(url || '').trim();
    const key = normalizeAttachmentKey(normalizedUrl);
    if (!normalizedUrl || !key || seen.has(key)) return;
    seen.add(key);
    const fileName = fallbackName || normalizedUrl.split('/').filter(Boolean).pop() || 'attachment';
    collected.push({ url: normalizedUrl, fileName });
  };

  const directUrl = message.attachmentUrl || message.attachment_url;
  if (directUrl) addAttachment(directUrl);

  const body = String(message.message || message.content || message.text || '');
  const regex = /Attachment[s]?:\s*([^\n\r]+?)\s*\((https?:\/\/(?:[^\s)]+)|\/uploads\/[^\s)]+)\)/gi;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const explicitName = String(match[1] || '').trim() || 'attachment';
    addAttachment(match[2], explicitName);
  }

  return collected;
};

export default function ChatSupport({ className = '' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.USER_TOKEN)));
  const [open, setOpen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden);
  
  // Single Unified Mode: 'chat' | 'ticket_form'
  const [viewMode, setViewMode] = useState('chat');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  // Agent Availability & Offline handling
  const [liveStatus, setLiveStatus] = useState('unknown'); // 'unknown' | 'available' | 'offline'
  const [agentAvailability, setAgentAvailability] = useState(null);
  const [notifyWhenOnline, setNotifyWhenOnline] = useState(false);
  const [hasOnlineAgentAlert, setHasOnlineAgentAlert] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState([{ sender: 'support', text: DEFAULT_GREETING }]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [liveSessionKey, setLiveSessionKey] = useState(0);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('GENERAL');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketEmail, setTicketEmail] = useState(() => localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || localStorage.getItem('farmEazy_email') || '');
  const [ticketPhone, setTicketPhone] = useState(() => localStorage.getItem('farmEazy_phone') || '');
  const [ticketFile, setTicketFile] = useState(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const { showToast } = useGlobalToast();
  const messagesEndRef = useRef(null);

  const viewingLegacyTicket = Boolean(ticketId);

  // Live STOMP chat connection (only activated when open, authenticated, and not reviewing a specific ticket)
  const liveChat = useLiveSupportChat({
    enabled: open && isAuthenticated && !viewingLegacyTicket && liveStatus === 'available',
    sessionKey: liveSessionKey,
  });

  const useLiveStream = liveChat.liveMode && !viewingLegacyTicket && open && liveStatus === 'available';
  const displayMessages = useLiveStream ? liveChat.messages : messages;
  const chatLoading = useLiveStream ? liveChat.loading || liveChat.connecting : loading;

  const currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID) || 'anonymous';
  const storageKey = `farmEazy_chat_history_${currentUserId}`;

  // Auth sync
  useEffect(() => {
    const handleAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem(STORAGE_KEYS.USER_TOKEN)));
    };
    window.addEventListener('authStateChange', handleAuthState);
    window.addEventListener('storage', handleAuthState);
    return () => {
      window.removeEventListener('authStateChange', handleAuthState);
      window.removeEventListener('storage', handleAuthState);
    };
  }, []);

  // Listen for open custom event from any button in the app
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('farmeazy:open-live-chat', openChat);
    return () => window.removeEventListener('farmeazy:open-live-chat', openChat);
  }, []);

  // Tab visibility tracker
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (open && viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages, open, viewMode, liveChat.typingUser]);

  // CRITICAL: Agent Availability Check - ONLY runs when open & authenticated & tab visible!
  // Zero background API calls when widget is closed!
  useEffect(() => {
    if (!isAuthenticated || !open) return;

    let cancelled = false;

    const checkAvailability = async () => {
      if (!isTabVisible) return;
      try {
        const avail = await getAgentAvailability();
        if (cancelled) return;
        if (avail != null) {
          setAgentAvailability(avail);
          const isAvail = Boolean(avail.available);
          const nextStatus = isAvail ? 'available' : 'offline';

          // Notify user if they requested to be notified and agent just became online
          if (isAvail && (notifyWhenOnline || hasOnlineAgentAlert)) {
            showToast('🎉 Live Support Agent is now online! You can chat now.', 'success');
            setHasOnlineAgentAlert(true);
            setNotifyWhenOnline(false);
          }

          setLiveStatus(nextStatus);
          return;
        }
      } catch {
        // fall back to chat stats or business hours if live API fails
      }

      try {
        const stats = await getUserChatStats();
        if (cancelled) return;
        if (stats?.agentsOnline != null) {
          const isAvail = Boolean(stats.agentsOnline);
          if (isAvail && notifyWhenOnline) {
            showToast('🎉 Live Support Agent is now online! You can chat now.', 'success');
            setHasOnlineAgentAlert(true);
            setNotifyWhenOnline(false);
          }
          setLiveStatus(isAvail ? 'available' : 'offline');
          return;
        }
      } catch {
        // fall back to hours
      }

      const hour = new Date().getHours();
      const isHours = hour >= 9 && hour < 19;
      setLiveStatus(isHours ? 'available' : 'offline');
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 30000); // 30s poll while open

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, open, isTabVisible, notifyWhenOnline, hasOnlineAgentAlert, showToast]);

  // Load ticket history and FAQs ONLY when open
  useEffect(() => {
    if (!isAuthenticated || !open) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        setHistoryLoading(true);
        const [ticketsRes, faqsRes] = await Promise.allSettled([
          getTickets(),
          apiClient.get('/faq-questions', { params: { source: 'user' } }),
        ]);

        if (cancelled) return;

        if (ticketsRes.status === 'fulfilled') {
          const normalized = Array.isArray(ticketsRes.value) ? ticketsRes.value : [];
          setTicketHistory(normalized);
        }

        if (faqsRes.status === 'fulfilled') {
          setFaqs(unwrapApiList(faqsRes.value?.data));
        }
      } catch {
        // Non-blocking
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, open]);

  // Poll ticket messages when viewing an active ticket
  useEffect(() => {
    if (!ticketId || !open || !isTabVisible) return undefined;

    const interval = setInterval(async () => {
      try {
        const ticket = await getTicket(ticketId);
        if (ticket?.resolution) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.sender === 'support' && msg.text === ticket.resolution)) {
              return prev;
            }
            return [...prev, { sender: 'support', text: ticket.resolution }];
          });
        }

        const syncedMessages = await getTicketMessages(ticketId);
        const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
        if (normalized.length > 0) {
          setMessages((prev) => mergeMessages(prev, normalized));
        }
      } catch {
        // Silent poll
      }
    }, CHAT_POLL_MS);

    return () => clearInterval(interval);
  }, [ticketId, open, isTabVisible]);

  // Handlers
  const appendSupportMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'support', text }]);
  };

  const appendUserMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
  };

  const handleNotifyWhenOnline = () => {
    setNotifyWhenOnline(true);
    setOfflineDismissed(true);
    showToast('Notification set! We will notify you right here when an agent is online.', 'info');
    appendSupportMessage(
      '🙏 We apologize for the inconvenience! We have set a notification for you. As soon as a support agent comes online, you will be notified immediately right here so you can chat.'
    );
  };

  const handleStartOnlineChatFromAlert = () => {
    setHasOnlineAgentAlert(false);
    setOfflineDismissed(false);
    setTicketId(null);
    setViewMode('chat');
    setLiveSessionKey((k) => k + 1);
    appendSupportMessage('👋 Connected with support! How can we help you today?');
  };

  const handleDirectTicketSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim() || !ticketEmail.trim()) {
      showToast('Please fill in Subject, Description, and Contact Email.', 'error');
      return;
    }
    setTicketSubmitting(true);
    try {
      const payload = {
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        contactEmail: ticketEmail.trim(),
        contactPhone: ticketPhone.trim() || undefined,
        source: 'CHAT_SUPPORT',
      };
      const ticket = ticketFile
        ? await createTicketWithAttachment(payload, ticketFile)
        : await createTicket(payload);

      showToast(`Support Ticket ${ticket.displayId} created successfully!`, 'success');
      setTicketSubject('');
      setTicketDescription('');
      setTicketFile(null);
      setTicketId(ticket.displayId);
      setViewMode('chat');

      // Refresh ticket history
      try {
        const tickets = await getTickets();
        setTicketHistory(Array.isArray(tickets) ? tickets : []);
      } catch (_) {}

      appendSupportMessage(
        `✅ Support ticket #${ticket.displayId} has been created! Our support team will review your request and reply here shortly.`
      );
    } catch (err) {
      showToast(getUserFacingErrorMessage(err, 'Failed to submit support ticket.'), 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleSelectTicket = async (displayId) => {
    if (!displayId || chatLoading) return;
    setLoading(true);
    try {
      setTicketId(displayId);
      setShowHistoryDrawer(false);
      const syncedMessages = await getTicketMessages(displayId);
      const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
      if (normalized.length > 0) {
        setMessages(normalized);
      } else {
        setMessages([{ sender: 'support', text: `Viewing support ticket #${displayId}. You can post your follow-up replies below.` }]);
      }
    } catch {
      showToast('Could not load ticket conversation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetToLiveChat = () => {
    setTicketId(null);
    setAttachment(null);
    setShowHistoryDrawer(false);
    setViewMode('chat');
    setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
    releaseSupportStomp();
    setLiveSessionKey((k) => k + 1);
  };

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    const text = input.trim();
    setInput('');

    if (useLiveStream) {
      await liveChat.sendMessage(text);
      return;
    }

    appendUserMessage(text);

    // If active ticket, append response to ticket
    if (ticketId) {
      setLoading(true);
      try {
        if (attachment) {
          await addResponseWithAttachment(ticketId, text, attachment);
          setAttachment(null);
        } else {
          await addResponse(ticketId, text);
        }
        const synced = await getTicketMessages(ticketId);
        const norm = synced.map(normalizeIncomingMessage).filter(Boolean);
        if (norm.length > 0) setMessages((prev) => mergeMessages(prev, norm));
      } catch (err) {
        appendSupportMessage(getUserFacingErrorMessage(err, 'Could not send message to ticket thread.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Quick FAQ check
    const faqAns = buildQuickReply(text, faqs);
    if (isGreeting(text)) {
      appendSupportMessage('Hello! How can we assist you with FarmEazy today?');
      return;
    }

    if (faqAns && !isHumanRequest(text)) {
      appendSupportMessage(faqAns);
      appendSupportMessage('If you need more help, you can chat with our team or raise a support ticket.');
      return;
    }

    // If agents are offline and user asks for human/ticket
    if (liveStatus !== 'available' || isHumanRequest(text)) {
      appendSupportMessage(
        'Our live agents are currently offline (Support Hours: Mon–Sat 9AM–7PM IST). Would you like to raise a support ticket?'
      );
      return;
    }

    appendSupportMessage('I have recorded your request. Connecting you with our support team...');
  };

  const handleFAQ = (question) => {
    if (chatLoading) return;
    setInput('');
    if (useLiveStream) {
      liveChat.sendMessage(question);
    } else {
      appendUserMessage(question);
      const ans = buildQuickReply(question, faqs);
      if (ans) appendSupportMessage(ans);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setAttachment(file);
    appendSupportMessage(`📎 Attachment ready: "${file.name}". Send your message to submit it.`);
  };

  const quickSuggestions = useMemo(
    () => [
      { label: '💳 Payment Help', text: 'My payment or checkout is having an issue.' },
      { label: '🚜 Machinery/Service Help', text: 'How do I book or list farm machinery services?' },
      { label: '💧 Irrigation Setup', text: 'How do I schedule irrigation on my farm?' },
      { label: '👨‍💼 Talk to Agent', text: 'I want to speak with a customer support executive.' },
    ],
    []
  );

  if (!isAuthenticated) return null;

  return (
    <div className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex justify-end ${className}`}>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-4 py-3.5 shadow-2xl shadow-emerald-950/40 hover:shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-white/20 cursor-pointer"
          aria-label="Open support chat"
        >
          <Headphones className="w-5 h-5 animate-pulse" />
          <span className="font-semibold text-xs tracking-wide">Live Support</span>
          {hasOnlineAgentAlert && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] font-bold text-white items-center justify-center">!</span>
            </span>
          )}
        </button>
      )}

      {/* Main Support Window */}
      {open && (
        <div className="w-[94vw] sm:w-[24.5rem] max-w-[420px] h-[36rem] max-h-[calc(100dvh-5.5rem)] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-slate-950/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative p-2 rounded-2xl bg-white/10 ring-1 ring-white/20 shrink-0">
                <Headphones className="w-4 h-4 text-emerald-200" />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-teal-800 ${
                    liveStatus === 'available' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm tracking-tight truncate flex items-center gap-1.5">
                  FarmEazy Support
                  {useLiveStream && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-md border border-emerald-400/30">Live</span>}
                  {viewingLegacyTicket && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-cyan-500/30 text-cyan-200 rounded-md border border-cyan-400/30">Ticket</span>}
                </div>
                <div className="text-[11px] text-emerald-100/85 truncate flex items-center gap-1">
                  {viewMode === 'ticket_form' ? (
                    'Create Support Ticket'
                  ) : viewingLegacyTicket ? (
                    `Ticket #${ticketId}`
                  ) : useLiveStream && liveChat.conversation?.assignedAgentEmail ? (
                    `Connected with ${liveChat.conversation.assignedAgentEmail}`
                  ) : liveStatus === 'available' ? (
                    '🟢 Support Agent Online'
                  ) : (
                    '🕒 Offline (Mon–Sat 9AM–7PM IST)'
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {viewMode === 'ticket_form' || viewingLegacyTicket ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetToLiveChat}
                  className="h-7 px-2 text-[11px] font-semibold text-white bg-white/15 hover:bg-white/25 rounded-full border border-white/20 hover:text-white"
                  title="Return to Live Chat"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Chat
                </Button>
              ) : ticketHistory.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className="h-7 px-2 text-[11px] font-semibold text-white bg-white/15 hover:bg-white/25 rounded-full border border-white/20 hover:text-white"
                  title="View Past Tickets"
                >
                  <FileText className="w-3 h-3 mr-1" /> Tickets ({ticketHistory.length})
                </Button>
              ) : null}

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-full"
                aria-label="Close support chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Past Tickets Drawer (Collapsible) */}
          {showHistoryDrawer && (
            <div className="bg-muted/70 border-b border-border p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
              <div className="flex items-center justify-between font-semibold text-muted-foreground mb-1 text-[11px]">
                <span>Your Support Tickets</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryDrawer(false);
                    setViewMode('ticket_form');
                  }}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-bold text-[11px]"
                >
                  <PlusCircle className="w-3 h-3" /> New Ticket
                </button>
              </div>
              {historyLoading && <div className="text-center py-2 text-muted-foreground">Loading tickets...</div>}
              {!historyLoading && ticketHistory.length === 0 && (
                <div className="text-center py-2 text-muted-foreground">No previous tickets found.</div>
              )}
              {!historyLoading &&
                ticketHistory.map((t) => (
                  <button
                    key={t.displayId}
                    type="button"
                    onClick={() => handleSelectTicket(t.displayId)}
                    className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition ${
                      ticketId === t.displayId
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold truncate text-[11px]">#{t.displayId}: {t.subject || 'Support Case'}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.category} • {t.status}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
            </div>
          )}

          {/* VIEW MODE 1: RAISE SUPPORT TICKET FORM */}
          {viewMode === 'ticket_form' ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-card text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Raise a Support Ticket</h3>
                  <p className="text-[11px] text-muted-foreground">We typically resolve tickets within 2–4 business hours.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('chat')}
                  className="h-7 text-xs rounded-xl"
                >
                  Cancel
                </Button>
              </div>

              {liveStatus !== 'available' && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">Live Agents Currently Offline:</span> Mon–Sat, 9:00 AM – 7:00 PM IST. Submit your ticket and our team will get back to you promptly.
                  </div>
                </div>
              )}

              <form onSubmit={handleDirectTicketSubmit} className="space-y-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Issue Subject *</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Payment deduction issue, machine rental booking"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Provide details, order/booking ID, error message, or steps to reproduce..."
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Attachment (Optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
                    className="w-full text-[11px] text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground cursor-pointer"
                  />
                </div>

                <div className="pt-1 flex gap-2">
                  <Button
                    type="submit"
                    disabled={ticketSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl py-2 text-xs font-semibold hover:opacity-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    {ticketSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Support Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* VIEW MODE 2: UNIFIED CHAT CONVERSATION */
            <div className="flex-1 flex flex-col min-h-0 bg-background">
              
              {/* Alert: Agent came online notification banner */}
              {hasOnlineAgentAlert && (
                <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 animate-in slide-in-from-top-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200 text-[11px]">
                      A support agent is now online!
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleStartOnlineChatFromAlert}
                    className="h-6 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
                  >
                    Start Chat
                  </Button>
                </div>
              )}

              {/* Quick Topic Suggestions (Only if in live chat and not viewing a closed/legacy ticket) */}
              {!viewingLegacyTicket && liveStatus === 'available' && (
                <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5 shrink-0">
                  {quickSuggestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleFAQ(item.text)}
                      className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition active:scale-95"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
                {displayMessages.map((msg, idx) => {
                  const attachmentsSource = []
                    .concat(msg?.attachments || [])
                    .concat(parseAttachmentsFromMessage(msg) || []);

                  const seen = new Set();
                  const attachments = (attachmentsSource || [])
                    .map((a) => {
                      if (!a) return null;
                      const url =
                        typeof a === 'string'
                          ? a.startsWith('/')
                            ? window.location.origin + a
                            : a
                          : a.url || a.attachmentUrl || a.url;
                      const fileName = a.fileName || a.name || (url ? decodeURIComponent(url.split('/').pop()) : 'attachment');
                      const key = url || fileName;
                      if (!key || seen.has(key)) return null;
                      seen.add(key);
                      return { url, fileName };
                    })
                    .filter(Boolean);

                  const displayText = msg.text || '';
                  const stripped = stripAttachmentLines(displayText);
                  const bubbleText = stripped || (attachments.length > 0 ? 'Attachment included' : '');
                  const isUser = msg.sender === 'user';

                  return (
                    <div key={idx} className={isUser ? 'text-right' : 'text-left'}>
                      <div
                        className={`inline-block max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-sm'
                            : 'bg-card text-foreground border border-border rounded-bl-none shadow-sm'
                        }`}
                      >
                        {bubbleText}
                      </div>

                      {attachments.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 justify-start">
                          {attachments.map((att) => (
                            <a
                              key={att.url}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted border border-border text-[10px] font-medium text-foreground hover:bg-accent transition"
                            >
                              <Paperclip className="w-3 h-3 text-emerald-500" />
                              <span className="truncate max-w-[120px]">{att.fileName}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Offline Prompt Card inside Chat Flow */}
                {liveStatus === 'offline' && !viewingLegacyTicket && !offlineDismissed && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5 text-xs text-foreground shadow-sm">
                    <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <div className="font-bold text-xs">Live Support Executives Currently Offline</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Support Hours: Mon–Sat, 9:00 AM – 7:00 PM IST.
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Would you like to raise a support ticket instead so our team can follow up with you?
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => setViewMode('ticket_form')}
                        className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Raise Support Ticket
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNotifyWhenOnline}
                        className="h-8 px-3 text-xs font-semibold rounded-xl border-border hover:bg-muted"
                      >
                        <Bell className="w-3.5 h-3.5 mr-1 text-amber-500" /> Notify Me When Online
                      </Button>
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {liveChat.typingUser && useLiveStream && (
                  <div className="text-[11px] text-emerald-500 px-2 py-1 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Support agent is typing...
                  </div>
                )}

                {/* Rating Card when conversation is closed */}
                {liveChat.showRating && useLiveStream && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2.5 shadow-sm">
                    <p className="text-xs font-bold text-foreground">Rate your support experience</p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`text-xl transition ${ratingStars >= star ? 'text-amber-400 scale-110' : 'text-muted-foreground/40 hover:text-amber-300'}`}
                          onClick={() => setRatingStars(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full rounded-xl bg-background border border-border text-xs p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      rows={2}
                      placeholder="Optional feedback..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!ratingStars) {
                          showToast('Please choose a star rating.', 'error');
                          return;
                        }
                        await liveChat.submitRating(ratingStars, ratingComment);
                        showToast('Thank you for your rating!', 'success');
                      }}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                    >
                      Submit Rating
                    </Button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-border bg-card/90 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (useLiveStream) liveChat.notifyTyping(e.target.value.trim().length > 0);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    viewingLegacyTicket
                      ? 'Reply to this ticket...'
                      : liveStatus === 'available'
                      ? 'Type your message...'
                      : 'Ask a question or raise a ticket...'
                  }
                  className="flex-1 bg-background border border-border text-foreground placeholder-muted-foreground rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                  disabled={chatLoading}
                />

                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="chat-file-upload-unified"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="chat-file-upload-unified"
                  className="p-2.5 rounded-2xl bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground cursor-pointer transition active:scale-95 shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </label>

                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={chatLoading || !input.trim()}
                  className="h-9 w-9 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:opacity-90 disabled:opacity-50 shrink-0"
                  aria-label="Send message"
                >
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
