// FarmEazy In-App Chat Support Component
import { useCallback, useEffect, useMemo, useState } from 'react';
import { addResponse, addResponseWithAttachment, createTicket, createTicketWithAttachment, getTicket, getTicketMessages, getTickets, getUserChatStats, TICKET_CATEGORIES, TICKET_PRIORITIES } from '../services/SupportTicketService';
import apiClient from '../services/apiClient';
import { unwrapApiList } from '../utils/apiResponse';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import { useGlobalToast } from '../context/ToastContext';
import { STORAGE_KEYS } from '../config/api';
import { releaseSupportStomp } from '../services/supportStompClient';
import { useLiveSupportChat } from '../hooks/useLiveSupportChat';
import { getAgentAvailability } from '../services/liveConversationApi';
import { Loader2, Send, AlertCircle, Clock, CheckCircle2, FileText, PlusCircle } from 'lucide-react';


const DEFAULT_GREETING = 'Welcome to FarmEazy chat support. Choose a quick topic or describe your issue to open a support ticket.';
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

// Check if message explicitly requests human escalation
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

// Infer priority level
function inferPriority(text) {
  const value = normalizeText(text);
  if (/(failed|error|urgent|blocked|cannot|can't|not working)/.test(value)) return 'HIGH';
  return 'MEDIUM';
}

function buildQuickReply(text, faqs) {
  const value = normalizeText(text);
  const matches = [
    { keywords: ['add a farm', 'create a farm', 'farm'], answer: 'Go to Farms, open Add Farm, and complete the farm details. If you want, I can create a support ticket for a specific error.' },
    { keywords: ['schedule irrigation', 'irrigation'], answer: 'Open Irrigation, choose a farm and crop, then save the schedule. If the page is failing, tell me the exact error and I will raise a ticket.' },
    { keywords: ['order', 'checkout', 'payment', 'place order', 'razorpay'], answer: 'For orders, select an address first and then choose a payment method. If payment is failing, I can create a payment support ticket immediately.' },
    { keywords: ['vendor', 'selling', 'listing', 'product', 'service'], answer: 'Vendor access is separate from listing approval. If verification is done but publishing still fails, I can raise a vendor support ticket.' },
    { keywords: ['support', 'ticket', 'contact'], answer: 'You can talk here, or I can create a ticket for the support team and keep the conversation linked to it.' },
  ];

  for (const item of matches) {
    if (item.keywords.some((keyword) => value.includes(keyword))) {
      return item.answer;
    }
  }

  const faqMatch = faqs.find((faq) => {
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
  const sender = senderType === 'USER' ? 'user' : 'support';
  const text = String(message.message || '').trim();
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

function buildTicketDescriptionFromChat(userText, messages) {
  const transcript = (messages || [])
    .filter((msg) => msg?.text)
    .slice(-8)
    .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  return [
    userText,
    transcript ? `\n--- Chat context ---\n${transcript}` : '',
  ].join('').trim();
}


export default function ChatSupport({ className = '' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.USER_TOKEN)));
  const [open, setOpen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden);
  const [messages, setMessages] = useState([{ sender: 'support', text: DEFAULT_GREETING }]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState('unknown');
  const [ticketHistory, setTicketHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allowAutoTicketSelection, setAllowAutoTicketSelection] = useState(true);
  const [liveSessionKey, setLiveSessionKey] = useState(0);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'ticket_form'
  const [agentAvailability, setAgentAvailability] = useState(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('GENERAL');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketEmail, setTicketEmail] = useState(() => localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || localStorage.getItem('farmEazy_email') || '');
  const [ticketPhone, setTicketPhone] = useState(() => localStorage.getItem('farmEazy_phone') || '');
  const [ticketFile, setTicketFile] = useState(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const { showToast } = useGlobalToast();

  const viewingLegacyTicket = Boolean(ticketId);

  const liveChat = useLiveSupportChat({
    enabled: open && isAuthenticated && !viewingLegacyTicket,
    sessionKey: liveSessionKey,
  });

  const useLiveStream = liveChat.liveMode && !viewingLegacyTicket && open;
  const displayMessages = useLiveStream ? liveChat.messages : messages;
  const chatLoading = useLiveStream ? liveChat.loading || liveChat.connecting : loading;

  const fetchAttachmentBlob = async (url, activeTicketId) => {
    const uploadPath = extractUploadPath(url);
    if (uploadPath) {
      const ticketDisplayId = activeTicketId || undefined;
      const contactEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || undefined;
      const response = await apiClient.get('/attachments/file', {
        params: { path: uploadPath, ticketDisplayId, contactEmail },
        responseType: 'blob',
      });
      return response.data;
    }
    const response = await apiClient.get(toAbsoluteAttachmentUrl(url), { responseType: 'blob' });
    return response.data;
  };

  const openAttachment = async (url) => {
    if (!url) {
      showToast('Attachment URL is unavailable.', 'error');
      return;
    }

    try {
      const blob = await fetchAttachmentBlob(url, ticketId);
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);
    } catch (err) {
      console.error('Failed to open attachment', err);
      showToast('Could not open attachment. Please verify your login/session.', 'error');
    }
  };

  const downloadAttachment = async (attachment) => {
    if (!attachment?.url) {
      showToast('Attachment URL is unavailable.', 'error');
      return;
    }

    try {
      const blob = await fetchAttachmentBlob(attachment.url);
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = attachment.fileName || 'attachment';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 10 * 1000);
      showToast('Attachment downloaded successfully.', 'success');
    } catch (err) {
      console.error('Failed to download attachment', err);
      showToast('Could not download attachment. Please verify your login/session.', 'error');
    }
  };

  const currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID) || 'anonymous';
  const storageKey = `farmEazy_chat_history_${currentUserId}`;

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

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setTicketId(null);
      setAttachment(null);
      setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
      }
      if (parsed?.ticketId) {
        setTicketId(parsed.ticketId);
      }
    } catch {
      setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
    }
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const payload = {
      messages,
      ticketId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [isAuthenticated, messages, ticketId, storageKey]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const bootstrapTicketHistory = async () => {
      try {
        const tickets = await getTickets();
        if (cancelled) return;
        const normalizedTickets = Array.isArray(tickets) ? tickets : [];
        setTicketHistory(normalizedTickets);

        if (ticketId) {
          const syncedMessages = await getTicketMessages(ticketId);
          if (cancelled) return;
          const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
          if (normalized.length > 0) {
            setMessages((prev) => mergeMessages(prev, normalized));
          }
          return;
        }

        if (!allowAutoTicketSelection) return;
        if (normalizedTickets.length === 0) return;

        const latestTicketId = normalizedTickets[0]?.displayId;
        if (!latestTicketId) return;

        setTicketId(latestTicketId);
        const syncedMessages = await getTicketMessages(latestTicketId);
        if (cancelled) return;
        const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
        if (normalized.length > 0) {
          setMessages((prev) => mergeMessages(prev, normalized));
        }
      } catch {
        // Keep the widget usable even if bootstrap history fails.
      }
    };

    bootstrapTicketHistory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, ticketId]);

  useEffect(() => {
    if (!isAuthenticated || !open) return;

    let cancelled = false;

    const loadTicketHistory = async () => {
      try {
        setHistoryLoading(true);
        const tickets = await getTickets();
        if (cancelled) return;
        setTicketHistory(Array.isArray(tickets) ? tickets : []);
      } catch {
        if (!cancelled) {
          setTicketHistory([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadTicketHistory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, open, ticketId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadFaqs = async () => {
      try {
        setFaqLoading(true);
        const res = await apiClient.get('/faq-questions', { params: { source: 'user' } });
        setFaqs(unwrapApiList(res.data));
      } catch {
        setFaqs([]);
      } finally {
        setFaqLoading(false);
      }
    };

    loadFaqs();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadLiveStatus = async () => {
      try {
        const avail = await getAgentAvailability();
        if (avail != null) {
          setAgentAvailability(avail);
          setLiveStatus(avail.available ? 'available' : 'offline');
          return;
        }
      } catch {
        // fall back to getUserChatStats
      }
      try {
        const stats = await getUserChatStats();
        if (stats?.agentsOnline != null) {
          setLiveStatus(stats.agentsOnline ? 'available' : 'offline');
          return;
        }
      } catch {
        // fall back to business hours heuristic
      }
      const hour = new Date().getHours();
      setLiveStatus(hour >= 9 && hour < 18 ? 'available' : 'offline');
    };

    loadLiveStatus();
    const interval = setInterval(loadLiveStatus, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('farmeazy:open-live-chat', openChat);
    return () => window.removeEventListener('farmeazy:open-live-chat', openChat);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
        // Keep polling silently; the user already has the ticket link.
      }
    }, CHAT_POLL_MS);

    return () => clearInterval(interval);
  }, [ticketId, open, isTabVisible]);

  const quickSuggestions = useMemo(() => ([
    { label: 'Payment help', text: 'My payment or checkout is not working.' },
    { label: 'Vendor help', text: 'Vendor dashboard or verification is not working.' },
    { label: 'Irrigation help', text: 'How do I schedule irrigation?' },
    { label: 'Talk to live agent', text: 'I want to talk to a support executive.' },
  ]), []);

  const appendSupportMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'support', text }]);
  };

  const appendUserMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
  };

  const sendAiReply = async (text) => {
    const displayId = liveChat.conversationId;
    if (!displayId) return false;
    setLoading(true);
    try {
      const clientMessageId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const response = await apiClient.post(`/live/conversations/${displayId}/ai-reply`, { content: text, clientMessageId });
      const reply = response?.data?.reply;
      if (reply) appendSupportMessage(reply);
      if (response?.data?.escalated) {
        setLiveSessionKey((key) => key + 1);
      }
      return true;
    } catch (err) {
      appendSupportMessage(getUserFacingErrorMessage(err, 'The FarmEazy assistant is temporarily unavailable. You can ask for a support executive.'));
      return true;
    } finally { setLoading(false); }
  };

  const createSupportTicket = async ({ description, file = null, category, priority }) => {
    const contactEmail = localStorage.getItem('farmEazy_email') || '';
    const ticketPayload = {
      subject: category === 'PAYMENT_ISSUE' ? 'Payment help from chat' : 'Support chat request',
      description,
      category,
      priority,
      contactEmail,
      contactPhone: localStorage.getItem('farmEazy_phone') || '',
      source: 'CHAT_SUPPORT',
    };

    const ticket = file
      ? await createTicketWithAttachment(ticketPayload, file)
      : await createTicket(ticketPayload);

    setTicketId(ticket.displayId);
    if (ticket?.contactEmail) {
      try { localStorage.setItem('farmEazy_email', ticket.contactEmail); } catch(_) {}
    }
    return ticket;
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
      
      try {
        const tickets = await getTickets();
        setTicketHistory(Array.isArray(tickets) ? tickets : []);
      } catch (_) {}

      appendSupportMessage(`Support ticket ${ticket.displayId} opened. Our team will review your case.`);
    } catch (err) {
      showToast(getUserFacingErrorMessage(err, 'Failed to submit support ticket.'), 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const routeMessage = async (text) => {
    const clean = normalizeText(text);
    if (!clean) return;

    appendUserMessage(text);

    if (liveChat.conversationId && String(liveChat.conversation?.mode || '').toUpperCase() === 'AI_BOT') {
      await sendAiReply(text);
      return;
    }

    if (ticketId) {
      setLoading(true);
      try {
        if (attachment) {
          await addResponseWithAttachment(ticketId, text, attachment);
          setAttachment(null);
        } else {
          await addResponse(ticketId, text);
        }

        const syncedMessages = await getTicketMessages(ticketId);
        const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
        if (normalized.length > 0) {
          setMessages((prev) => mergeMessages(prev, normalized));
        }
      } catch (err) {
        appendSupportMessage(getUserFacingErrorMessage(err, 'I could not sync your message to the support thread. Please retry.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const faqAnswer = buildQuickReply(text, faqs);
    if (isGreeting(text)) {
      appendSupportMessage('Hello. I can answer common questions, attach screenshots to a ticket, or help you create a support case. If you want support, say "talk to support".');
      return;
    }

    if (faqAnswer && !isHumanRequest(text)) {
      appendSupportMessage(faqAnswer);
      appendSupportMessage('If that does not solve it, send a short summary and I will open a support ticket.');
      return;
    }

    if (isHumanRequest(text) || /create ticket|raise ticket|open ticket|report issue|issue|problem|bug/.test(clean)) {
      if (ticketId) {
        appendSupportMessage(`I have added your update to ticket ${ticketId}. A support executive will continue from this thread.`);
        return;
      }

      setLoading(true);
      try {
        const ticket = await createSupportTicket({
          description: buildTicketDescriptionFromChat(text, messages),
          file: attachment,
          category: inferCategory(text),
          priority: inferPriority(text),
        });
        setAttachment(null);
        const liveText = ticket?.assignedTo
          ? `Connected to ${ticket.assignedTo}.`
          : 'No support executive is online right now. The ticket is queued and will be picked up during support hours.';
        appendSupportMessage(`Ticket ${ticket.displayId} created. ${liveText}`);
        appendSupportMessage('You can keep chatting here. I will poll for updates and show executive replies when they arrive.');
      } catch (err) {
        appendSupportMessage(getUserFacingErrorMessage(err, 'I could not create the ticket. Please try again or email support@farm-eazy.com.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    appendSupportMessage('I did not recognize that request. Please tell me if it is about payment, order checkout, vendor verification, irrigation, or a product issue. If you want, I can create a support ticket now.');
  };

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    const text = input.trim();
    setInput('');
    if (useLiveStream) {
      await liveChat.sendMessage(text);
    } else {
      await routeMessage(text);
    }
  };

  const handleFAQ = async (question) => {
    if (chatLoading) return;
    setInput('');
    if (useLiveStream) {
      await liveChat.sendMessage(question);
    } else {
      await routeMessage(question);
    }
  };

  const handleSelectTicket = async (displayId) => {
    if (!displayId || displayId === ticketId || chatLoading) return;

    setLoading(true);
    try {
      setTicketId(displayId);
      const syncedMessages = await getTicketMessages(displayId);
      const normalized = syncedMessages.map(normalizeIncomingMessage).filter(Boolean);
      if (normalized.length > 0) {
        setMessages(normalized);
      } else {
        setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
      }
    } catch {
      appendSupportMessage('Unable to load that ticket conversation right now. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setAttachment(file);
    appendSupportMessage(`Attachment ready: ${file.name}. Send a message and I will include it in the support ticket.`);
  };

  const resetConversation = () => {
    setTicketId(null);
    setAttachment(null);
    setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
    setAllowAutoTicketSelection(false);
    localStorage.removeItem(storageKey);
    releaseSupportStomp();
    setLiveSessionKey((key) => key + 1);
  };

  const submitRating = async () => {
    if (!ratingStars) {
      showToast('Please select a star rating.', 'error');
      return;
    }
    try {
      await liveChat.submitRating(ratingStars, ratingComment);
      showToast('Thank you for your feedback!', 'success');
      setRatingStars(0);
      setRatingComment('');
    } catch (err) {
      showToast(getUserFacingErrorMessage(err, 'Could not save rating.'), 'error');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`fixed bottom-24 left-2 right-2 sm:left-auto sm:right-6 z-50 flex justify-end ${className}`}>
      {!open && (
        <button
          className="group flex items-center gap-0 hover:gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-3.5 hover:px-5 shadow-2xl shadow-cyan-900/20 ring-1 ring-white/20 hover:from-primary/50 hover:to-blue-500 transition-all duration-300"
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
        >
          <span className="text-lg">💬</span>
          <span className="w-0 group-hover:w-auto max-w-0 group-hover:max-w-[150px] overflow-hidden whitespace-nowrap font-semibold transition-all duration-300 text-sm">
            Support Chat
          </span>
        </button>
      )}
      {open && (
        <div className="w-full sm:w-[24rem] max-w-[calc(100vw-1rem)] h-[35rem] max-h-[calc(100dvh-8rem)] overflow-hidden rounded-3xl border border-border bg-card/95 shadow-2xl shadow-slate-950/30 backdrop-blur-xl flex flex-col animate-[slideInRight_180ms_ease-out]">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3">
            <div>
              <span className="font-bold block text-sm">FarmEazy Support</span>
              <span className="text-[11px] text-white/80">
                {viewingLegacyTicket ? `Case ${ticketId}` : (liveChat.conversationId ? `Live Chat (${liveChat.conversationId})` : 'Live Chat & Support Tickets')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="text-[11px] font-semibold bg-white/15 hover:bg-white/25 rounded-full px-2.5 py-0.5" onClick={resetConversation} aria-label="Reset chat">New</button>
              <button className="text-xl leading-none px-1 text-white/80 hover:text-white" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-around border-b border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                viewMode === 'chat'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>💬</span> Chat {useLiveStream ? '(Live)' : ''}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ticket_form')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                viewMode === 'ticket_form'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>📝</span> Raise Ticket
            </button>
          </div>

          {/* Status Indicator */}
          <div className="px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between gap-2 border-b border-border/50 bg-background">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  liveStatus === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="truncate">
                {useLiveStream
                  ? (liveChat.conversation?.status === 'ASSIGNED'
                      ? `Connected to agent (${liveChat.conversation?.assignedAgentEmail || 'Support'})`
                      : 'Waiting for available agent...')
                  : (liveStatus === 'available' ? 'Live support agents online.' : 'Live support offline (Mon-Sat 9AM-7PM IST)')}
              </span>
            </span>
            {useLiveStream && <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">LIVE</span>}
            {viewingLegacyTicket && ticketId && <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">TICKET</span>}
          </div>

          {/* VIEW 1: DEDICATED RAISE TICKET FORM */}
          {viewMode === 'ticket_form' ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-card">
              {liveStatus !== 'available' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-semibold">Support Agents Currently Offline</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Business hours: Mon–Sat, 9:00 AM – 7:00 PM IST. Submit your ticket below and our team will respond promptly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleDirectTicketSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Issue Subject *</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Payment deduction issue, listing error"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                    placeholder="Describe the problem, order ID, error message, or steps to reproduce..."
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
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
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

                <Button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl py-2 text-xs font-semibold hover:from-cyan-500 hover:to-blue-500 flex items-center justify-center gap-1.5"
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
              </form>
            </div>
          ) : (
            /* VIEW 2: CHAT & TICKETS CONVERSATION */
            <>
              <div className="px-3 pt-2">
                <div className="rounded-xl border border-border bg-slate-950/60 p-2">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>Recent Tickets</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('ticket_form')}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> New Ticket
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {historyLoading && (
                      <span className="text-[11px] text-muted-foreground">Loading tickets...</span>
                    )}
                    {!historyLoading && ticketHistory.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">No previous tickets</span>
                    )}
                    {!historyLoading && ticketHistory.map((ticket) => {
                      const id = ticket?.displayId;
                      if (!id) return null;
                      const isActive = id === ticketId;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSelectTicket(id)}
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] border transition ${isActive ? 'bg-cyan-600/25 text-cyan-200 border-cyan-500/50' : 'bg-muted text-muted-foreground border-border hover:bg-muted'}`}
                          disabled={chatLoading}
                        >
                          {id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Offline fallback prompt if not in active ticket */}
              {liveStatus !== 'available' && !ticketId && !useLiveStream && (
                <div className="mx-3 mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
                  <span className="text-amber-800 dark:text-amber-300 text-[11px]">
                    🕒 Live agents offline.
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMode('ticket_form')}
                    className="text-[11px] font-bold text-cyan-500 hover:text-cyan-400 underline shrink-0"
                  >
                    Raise a Ticket →
                  </button>
                </div>
              )}

              <div className="px-3 pt-2 flex flex-wrap gap-1.5">
                {quickSuggestions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={loading}
                    onClick={() => handleFAQ(item.text)}
                    className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium hover:bg-muted text-muted-foreground"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {displayMessages.map((msg, idx) => {
                  const attachmentsSource = []
                    .concat(msg?.attachments || [])
                    .concat(parseAttachmentsFromMessage(msg) || [])

                  const seen = new Set()
                  const attachments = (attachmentsSource || []).map((a) => {
                    if (!a) return null
                    const url = typeof a === 'string' ? (a.startsWith('/') ? window.location.origin + a : a) : (a.url || a.attachmentUrl || a.url)
                    const fileName = a.fileName || a.name || (url ? decodeURIComponent(url.split('/').pop()) : 'attachment')
                    const key = url || fileName
                    if (!key || seen.has(key)) return null
                    seen.add(key)
                    return { url, fileName }
                  }).filter(Boolean)

                  const displayText = msg.text || '';
                  const stripped = stripAttachmentLines(displayText)
                  const bubbleText = stripped || (attachments.length > 0 ? 'Attachment included' : '')
                  return (
                    <div key={idx} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
                      <span className={`inline-block max-w-[90%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-primary/50/15 text-primary/80 border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {bubbleText}
                      </span>
                      {attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-start">
                          {attachments.map((attachment) => (
                            <div key={`${idx}-${attachment.url}`} className="flex flex-wrap gap-2 items-center">
                              <button
                                type="button"
                                onClick={() => openAttachment(attachment.url)}
                                className="rounded-full bg-muted text-slate-100 px-2 py-1 text-[11px] hover:bg-slate-600"
                              >
                                Open {attachment.fileName}
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(attachment)}
                                className="rounded-full bg-cyan-600 text-white px-2 py-1 text-[11px] hover:bg-cyan-500"
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {liveChat.typingUser && useLiveStream && (
                <div className="text-[10px] text-cyan-300 px-3 py-1 font-semibold">Support agent is typing...</div>
              )}

              {liveChat.showRating && useLiveStream && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3 space-y-2 m-3">
                  <p className="text-sm font-semibold text-cyan-100">Rate this conversation</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-lg ${ratingStars >= star ? 'text-amber-400' : 'text-muted-foreground'}`}
                        onClick={() => setRatingStars(star)}
                        aria-label={`${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full rounded-lg bg-muted border border-border text-sm p-2 text-foreground"
                    rows={2}
                    placeholder="Optional feedback"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-cyan-600 text-white text-xs px-3 py-1.5"
                    onClick={submitRating}
                  >
                    Submit rating
                  </button>
                </div>
              )}

              <div className="flex gap-2 p-3 border-t border-border bg-slate-950/80">
                <input
                  className="flex-1 bg-muted border border-border text-foreground dark:text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  type="text"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (useLiveStream) {
                      liveChat.notifyTyping(event.target.value.trim().length > 0);
                    }
                  }}
                  placeholder="Ask about orders, payment, vendor help..."
                  aria-label="Chat input"
                  onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                  disabled={chatLoading}
                />
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="chat-file-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="chat-file-upload" className="bg-muted text-muted-foreground px-3 py-2 rounded-xl cursor-pointer hover:bg-muted border border-border text-xs">📎</label>
                <button className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3.5 py-2 rounded-xl hover:from-primary/50 hover:to-blue-500 disabled:opacity-60 text-xs font-semibold" onClick={handleSend} aria-label="Send message" disabled={chatLoading}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
