// FarmEazy In-App Chat Support Component
import { useEffect, useMemo, useState } from 'react';
import { addResponse, addResponseWithAttachment, createTicket, createTicketWithAttachment, getTicket, getTicketMessages, getTickets } from '../services/SupportTicketService';
import apiClient from '../services/apiClient';
import { STORAGE_KEYS } from '../config/api';

const DEFAULT_GREETING = 'Welcome to FarmEazy live chat. Tell me what you need help with, or choose one of the quick topics below.';

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
        setFaqs(Array.isArray(res.data) ? res.data : []);
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
    const now = new Date();
    const hour = now.getHours();
    setLiveStatus(hour >= 9 && hour < 18 ? 'available' : 'offline');
  }, [isAuthenticated]);

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
    }, 15000);

    return () => clearInterval(interval);
  }, [ticketId, open, isTabVisible]);

  const quickSuggestions = useMemo(() => ([
    { label: 'Payment help', text: 'My payment or checkout is not working.' },
    { label: 'Vendor help', text: 'Vendor dashboard or verification is not working.' },
    { label: 'Irrigation help', text: 'How do I schedule irrigation?' },
    { label: 'Talk to live agent', text: 'I want to talk to a live support executive.' },
  ]), []);

  const appendSupportMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'support', text }]);
  };

  const appendUserMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
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
    return ticket;
  };

  const routeMessage = async (text) => {
    const clean = normalizeText(text);
    if (!clean) return;

    appendUserMessage(text);

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
      } catch {
        appendSupportMessage('I could not sync your latest message to the support thread right now. Please retry in a moment.');
      } finally {
        setLoading(false);
      }
    }

    const faqAnswer = buildQuickReply(text, faqs);
    if (isGreeting(text)) {
      appendSupportMessage('Hello. I can answer common questions, attach screenshots to a ticket, or connect you to support. If you want a human, say "talk to support".');
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
          description: text,
          file: attachment,
          category: inferCategory(text),
          priority: inferPriority(text),
        });
        setAttachment(null);
        const liveText = ticket?.assignedTo
          ? `Connected to ${ticket.assignedTo}.`
          : (liveStatus === 'available'
            ? 'A support executive can pick this up now if one is available.'
            : 'No support executive is online right now. The ticket is queued and will be picked up during support hours.');
        appendSupportMessage(`Ticket ${ticket.displayId} created. ${liveText}`);
        appendSupportMessage('You can keep chatting here. I will poll for updates and show executive replies when they arrive.');
      } catch {
        appendSupportMessage('I could not create the ticket right now. Please try again or use the Support page.');
      } finally {
        setLoading(false);
      }
      return;
    }

    appendSupportMessage('I did not recognize that request. Please tell me if it is about payment, order checkout, vendor verification, irrigation, or a product issue. If you want, I can create a support ticket now.');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    await routeMessage(text);
  };

  const handleFAQ = async (question) => {
    if (loading) return;
    setInput('');
    await routeMessage(question);
  };

  const handleSelectTicket = async (displayId) => {
    if (!displayId || displayId === ticketId || loading) return;

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
    localStorage.removeItem(storageKey);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`fixed bottom-24 left-2 right-2 sm:left-auto sm:right-6 z-50 flex justify-end ${className}`}>
      {!open && (
        <button
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 shadow-2xl shadow-cyan-900/20 ring-1 ring-white/20 hover:from-cyan-500 hover:to-blue-500 transition-all duration-300"
          onClick={() => setOpen(true)}
          aria-label="Open live chat"
        >
          <span className="text-lg">💬</span>
          <span className="hidden sm:inline font-semibold">Live Chat</span>
        </button>
      )}
      {open && (
        <div className="w-full sm:w-[24rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/95 shadow-2xl shadow-slate-950/30 backdrop-blur-xl flex flex-col animate-[slideInRight_180ms_ease-out]">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3">
            <div>
              <span className="font-bold block">FarmEazy Live Chat</span>
              <span className="text-xs text-white/80">
                {ticketId ? `Case ${ticketId}` : 'FAQ first, live handoff when needed'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-full px-3 py-1" onClick={resetConversation} aria-label="Reset chat">New</button>
              <button className="text-2xl leading-none" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </div>
          </div>

          <div className="px-4 pt-3 text-xs text-slate-300 flex items-center justify-between gap-2">
            <span>{liveStatus === 'available' ? 'Support executives are available now.' : 'Support executives are offline right now.'}</span>
            {ticketId && <span className="text-cyan-300">Ticket polling on</span>}
          </div>

          <div className="px-3 pt-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-2">
              <div className="text-[11px] font-semibold text-slate-300 mb-2">Recent Tickets</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {historyLoading && (
                  <span className="text-[11px] text-slate-400">Loading...</span>
                )}
                {!historyLoading && ticketHistory.length === 0 && (
                  <span className="text-[11px] text-slate-400">No previous tickets</span>
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
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] border ${isActive ? 'bg-cyan-600/25 text-cyan-200 border-cyan-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                      disabled={loading}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2" style={{ maxHeight: 360 }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-5 ${msg.sender === 'user' ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                  {msg.text}
                </span>
              </div>
            ))}

            <div className="pt-2 flex flex-wrap gap-2">
              {quickSuggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 border border-slate-700"
                  onClick={() => handleFAQ(item.text)}
                  disabled={loading}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {faqLoading && (
              <div className="text-xs text-slate-400">Loading help articles...</div>
            )}

            {attachment && (
              <div className="text-xs text-cyan-200">Attachment selected: {attachment.name}</div>
            )}
          </div>

          <div className="flex gap-2 p-3 border-t border-slate-700 bg-slate-950/80">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about orders, payment, vendor help..."
              aria-label="Chat input"
              onKeyDown={(event) => event.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              id="chat-file-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="chat-file-upload" className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-700 border border-slate-700">📎</label>
            <button className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60" onClick={handleSend} aria-label="Send message" disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
