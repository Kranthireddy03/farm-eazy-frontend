// FarmEazy In-App Unified Chat Support Component with Option-Guided Automation, Sticky Reconnection, Agent Transfers & CSAT Rating
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
  Star,
  Lock,
  Unlock,
  Check,
  HelpCircle,
  ArrowRight,
  Sliders,
} from 'lucide-react';

const DEFAULT_GREETING = '👋 Welcome to FarmEazy Support! Please select a topic below to quickly find answers or connect with our support team.';
const CHAT_POLL_MS = 5000;

// Web Audio API Synth Alert Chimes (Zero external asset dependencies)
function playCustomerChime(type = 'message') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'assigned') {
      // Cheerful ascending chime (C5 -> E5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Gentle notification chime (A5 -> E6)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Audio might be constrained by autoplay policy before user gesture
  }
}

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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isGreeting(text) {
  return /^(hi|hello|hey|hii|namaste|good\s+(morning|afternoon|evening))\b/.test(normalizeText(text));
}

function isHumanRequest(text) {
  return /(human|agent|executive|person|support team|real[- ]?time|live chat|talk to support|call me)/i.test(text);
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

// Hierarchical Option Decision Tree for Automated Guidance
const SUPPORT_OPTION_TREE = {
  root: [
    {
      id: 'payment',
      icon: '💳',
      title: 'Payment & Billing',
      subtitle: 'Failed payments, refund status, wallet balance',
    },
    {
      id: 'machinery',
      icon: '🚜',
      title: 'Machinery & Equipment Rental',
      subtitle: 'Tractor booking, vendor dispatch, machine listing',
    },
    {
      id: 'irrigation',
      icon: '💧',
      title: 'Smart Irrigation & Crops',
      subtitle: 'IoT schedules, valve controls, crop advisory AI',
    },
    {
      id: 'account',
      icon: '🔐',
      title: 'Account & Security',
      subtitle: 'Login OTP, mobile update, vendor KYC verification',
    },
    {
      id: 'live_agent',
      icon: '👨‍💼',
      title: 'Connect with Support Agent',
      subtitle: 'Live conversation with an online specialist',
    },
  ],
  payment: [
    {
      id: 'pay_deducted',
      title: 'Money deducted but order/booking failed',
      resolution: 'If money was deducted from your bank or card but the order failed, our payment gateway (Razorpay) will auto-reconcile within 15–30 minutes, or refund within 3–5 business days.',
      canEscalate: true,
    },
    {
      id: 'pay_refund_status',
      title: 'Check refund status for cancelled order',
      resolution: 'Refunds are credited back to your original payment source within 3–5 business days from approval. You can also view details in your Wallet tab.',
      canEscalate: true,
    },
    {
      id: 'pay_wallet_coins',
      title: 'Coins or wallet cashback not credited',
      resolution: 'Bonus coins and cashback are credited instantly upon successful order completion or campaign criteria fulfillment. Check your Coins activity tab.',
      canEscalate: true,
    },
  ],
  machinery: [
    {
      id: 'mach_schedule',
      title: 'Machinery booking delay or vendor unassigned',
      resolution: 'Equipment rental bookings are matched with nearby verified operators within 1 hour. If your slot is near, we can escalate operator assignment.',
      canEscalate: true,
    },
    {
      id: 'mach_cancel',
      title: 'Cancel or reschedule machinery booking',
      resolution: 'You can reschedule or cancel equipment rentals up to 2 hours before the start time from your Bookings tab without any cancellation fees.',
      canEscalate: true,
    },
    {
      id: 'mach_list_vendor',
      title: 'How to list my tractor/machinery on FarmEazy',
      resolution: 'Go to Vendor Portal -> Add Equipment, submit registration RC and photos. Our team verifies equipment listings within 24 hours.',
      canEscalate: true,
    },
  ],
  irrigation: [
    {
      id: 'irrig_schedule_fail',
      title: 'Smart irrigation schedule not starting automatically',
      resolution: 'Ensure your IoT gateway device has an active internet connection and the solenoid valve controller is set in "Auto" mode.',
      canEscalate: true,
    },
    {
      id: 'irrig_sensor_reading',
      title: 'Soil moisture or temperature sensor reading anomaly',
      resolution: 'Check physical probe depth (recommended 15–20cm in root zone) and clean probe terminals with distilled water if salt buildup occurred.',
      canEscalate: true,
    },
    {
      id: 'irrig_crop_advisory',
      title: 'Need help with Crop Disease AI Advisory',
      resolution: 'Upload a clear, well-lit photo of the affected crop leaf or stem under the "Crop Advisory" section for instant AI diagnosis and remedy recommendations.',
      canEscalate: true,
    },
  ],
  account: [
    {
      id: 'acc_otp_issue',
      title: 'Not receiving SMS OTP for login / verification',
      resolution: 'Please check network reception or wait 30 seconds to request OTP via WhatsApp. Ensure DND is not blocking transactional SMS from FarmEazy.',
      canEscalate: true,
    },
    {
      id: 'acc_profile_update',
      title: 'Change registered mobile number or email',
      resolution: 'Navigate to Settings -> Profile Security to request a mobile or email change with OTP dual-verification.',
      canEscalate: true,
    },
    {
      id: 'acc_vendor_kyc',
      title: 'Vendor KYC verification status inquiry',
      resolution: 'KYC documents are reviewed within 1 business day. You can view real-time document status under Vendor Dashboard -> Verification.',
      canEscalate: true,
    },
  ],
};

// Preset chips for Ticket Form
const TICKET_PRESETS = [
  {
    label: '💳 Payment Deduction Failed',
    subject: 'Payment deducted but order/booking failed',
    category: 'PAYMENT_ISSUE',
    priority: 'HIGH',
    description: 'Money was deducted from my bank/UPI, but the order status remains pending or failed. Order/Txn ID: ',
  },
  {
    label: '🚜 Machinery Dispatch Delay',
    subject: 'Equipment rental operator not assigned or delayed',
    category: 'SERVICE_ISSUE',
    priority: 'MEDIUM',
    description: 'Need update regarding equipment operator and delivery schedule for booking reference: ',
  },
  {
    label: '💧 Smart Irrigation Issue',
    subject: 'IoT automated irrigation schedule not triggering',
    category: 'TECHNICAL_ISSUE',
    priority: 'MEDIUM',
    description: 'IoT irrigation schedule failed to start automatically. Field plot / Controller ID: ',
  },
  {
    label: '🔐 Login / OTP Verification',
    subject: 'Unable to receive login or verification OTP',
    category: 'ACCOUNT_ISSUE',
    priority: 'HIGH',
    description: 'SMS OTP is not being received for mobile number: ',
  },
];

export default function ChatSupport({ className = '' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.USER_TOKEN)));
  const [open, setOpen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden);
  
  // Single Unified Mode: 'chat' | 'ticket_form'
  const [viewMode, setViewMode] = useState('chat');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  // Agent Availability & Offline handling
  const NOTIFY_REQUESTED_SESSION_KEY = 'farmEazy_agent_notify_requested';
  const NOTIFIED_THIS_SESSION_KEY = 'farmEazy_agent_notified_this_session';
  const [liveStatus, setLiveStatus] = useState('unknown'); // 'unknown' | 'available' | 'offline'
  const [agentAvailability, setAgentAvailability] = useState(null);
  const [notifyWhenOnline, setNotifyWhenOnline] = useState(() => {
    try {
      return sessionStorage.getItem(NOTIFY_REQUESTED_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [hasOnlineAgentAlert, setHasOnlineAgentAlert] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  // Option-Driven Guided Flow State
  const [activeCategory, setActiveCategory] = useState(null); // null = root options, 'payment', 'machinery', etc.
  const [activeResolution, setActiveResolution] = useState(null);
  const [customInputUnlocked, setCustomInputUnlocked] = useState(false);

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

  // CSAT Rating State
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedRatingTags, setSelectedRatingTags] = useState([]);

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
  const inputRef = useRef(null);
  const prevAgentRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  const viewingLegacyTicket = Boolean(ticketId);

  // Live STOMP chat connection (only activated when open, authenticated, and not reviewing a specific ticket)
  const liveChat = useLiveSupportChat({
    enabled: open && isAuthenticated && !viewingLegacyTicket && liveStatus === 'available',
    sessionKey: liveSessionKey,
  });

  const useLiveStream = liveChat.liveMode && !viewingLegacyTicket && open && liveStatus === 'available';
  const displayMessages = useLiveStream ? liveChat.messages : messages;
  const chatLoading = useLiveStream ? liveChat.loading || liveChat.connecting : loading;

  // Agent Assignment Gate
  const isAgentAssigned = Boolean(liveChat.conversation?.assignedAgentEmail);
  const isInputAllowed = viewingLegacyTicket || isAgentAssigned || customInputUnlocked;

  // Monitor Agent Assignment changes -> Play Chime & Toast
  useEffect(() => {
    const currentAgent = liveChat.conversation?.assignedAgentEmail;
    if (currentAgent && currentAgent !== prevAgentRef.current) {
      playCustomerChime('assigned');
      showToast(`🎉 Connected with Support Specialist: ${currentAgent}`, 'success');
      appendSupportMessage(`👨‍💼 Support Specialist ${currentAgent} has joined the conversation! You can now freely type your queries.`);
    }
    prevAgentRef.current = currentAgent;
  }, [liveChat.conversation?.assignedAgentEmail, showToast]);

  // Monitor incoming support messages -> Play gentle chime
  useEffect(() => {
    const msgs = useLiveStream ? liveChat.messages : messages;
    if (msgs.length > prevMsgCountRef.current) {
      const latest = msgs[msgs.length - 1];
      if (latest && latest.sender === 'support' && prevMsgCountRef.current > 0) {
        playCustomerChime('message');
      }
    }
    prevMsgCountRef.current = msgs.length;
  }, [messages, liveChat.messages, useLiveStream]);

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
  }, [displayMessages, open, viewMode, liveChat.typingUser, activeCategory, activeResolution]);

  // CRITICAL: Agent Availability Check - ONLY runs when open & authenticated & tab visible
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

          if (isAvail) {
            let requested = false;
            let alreadyNotified = false;
            try {
              requested = notifyWhenOnline || sessionStorage.getItem(NOTIFY_REQUESTED_SESSION_KEY) === 'true';
              alreadyNotified = sessionStorage.getItem(NOTIFIED_THIS_SESSION_KEY) === 'true';
            } catch {
              requested = notifyWhenOnline;
            }

            if (requested && !alreadyNotified) {
              try {
                sessionStorage.setItem(NOTIFIED_THIS_SESSION_KEY, 'true');
                sessionStorage.removeItem(NOTIFY_REQUESTED_SESSION_KEY);
              } catch {}
              setNotifyWhenOnline(false);
              setHasOnlineAgentAlert(true);
              playCustomerChime('assigned');
              showToast('🎉 Live Support Specialist is now online and available to assist you!', 'success');
            }
          }

          setLiveStatus(nextStatus);
          return;
        }
      } catch {
        // Fall back to stats
      }

      try {
        const stats = await getUserChatStats();
        if (cancelled) return;
        if (stats?.agentsOnline != null) {
          const isAvail = Boolean(stats.agentsOnline);
          if (isAvail) {
            let requested = false;
            let alreadyNotified = false;
            try {
              requested = notifyWhenOnline || sessionStorage.getItem(NOTIFY_REQUESTED_SESSION_KEY) === 'true';
              alreadyNotified = sessionStorage.getItem(NOTIFIED_THIS_SESSION_KEY) === 'true';
            } catch {
              requested = notifyWhenOnline;
            }

            if (requested && !alreadyNotified) {
              try {
                sessionStorage.setItem(NOTIFIED_THIS_SESSION_KEY, 'true');
                sessionStorage.removeItem(NOTIFY_REQUESTED_SESSION_KEY);
              } catch {}
              setNotifyWhenOnline(false);
              setHasOnlineAgentAlert(true);
              playCustomerChime('assigned');
              showToast('🎉 Live Support Specialist is now online and available to assist you!', 'success');
            }
          }
          setLiveStatus(isAvail ? 'available' : 'offline');
          return;
        }
      } catch {
        // Fall back to business hours
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
  }, [isAuthenticated, open, isTabVisible, notifyWhenOnline, showToast]);

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
    try {
      const alreadyRequested = sessionStorage.getItem(NOTIFY_REQUESTED_SESSION_KEY) === 'true';
      if (alreadyRequested) {
        showToast('Notification alert is already active for this session.', 'info');
        return;
      }
      sessionStorage.setItem(NOTIFY_REQUESTED_SESSION_KEY, 'true');
    } catch {}
    setNotifyWhenOnline(true);
    setOfflineDismissed(false);
    showToast('🔔 Notification set: You will be alerted the moment a support specialist comes online in this session.', 'info');
    appendSupportMessage(
      '🙏 Thank you for your patience! We have registered your alert. As soon as a support specialist comes online, you will be notified immediately right here so you can connect.'
    );
  };

  const handleStartOnlineChatFromAlert = () => {
    setHasOnlineAgentAlert(false);
    setOfflineDismissed(false);
    setTicketId(null);
    setViewMode('chat');
    setLiveSessionKey((k) => k + 1);
    appendSupportMessage('👋 Connected with FarmEazy Live Support! Routing you to our available support specialist...');
  };

  // Option Click Handlers
  const handleSelectRootCategory = (cat) => {
    if (cat.id === 'live_agent') {
      appendUserMessage('👨‍💼 I would like to connect directly with a live support executive.');
      if (liveStatus === 'available') {
        if (liveChat?.sendMessage) {
          liveChat.sendMessage('Customer requested direct support specialist assistance.');
        }
        appendSupportMessage('Connecting you with our next available support agent via least-busy load balancer... Please hold on!');
      } else {
        appendSupportMessage('Our support executives are currently offline (Support Hours: Mon–Sat 9AM–7PM IST). Would you like to raise a support ticket instead?');
      }
      setActiveCategory(null);
      setActiveResolution(null);
      return;
    }

    appendUserMessage(`${cat.icon} ${cat.title}`);
    setActiveCategory(cat.id);
    setActiveResolution(null);
    appendSupportMessage(`Please select what best describes your ${cat.title.toLowerCase()} query, or select "Other" to describe it yourself:`);
  };

  const handleSelectSubOption = (opt) => {
    appendUserMessage(opt.title);
    setActiveResolution(opt);
    appendSupportMessage(opt.resolution);
  };

  const handleUnlockCustomInput = () => {
    setCustomInputUnlocked(true);
    appendSupportMessage('✍️ Custom message field is now unlocked! Please type your question or issue below and press send.');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleConnectLiveFromOption = () => {
    appendUserMessage('👨‍💼 Connect with human specialist for this topic');
    if (liveStatus === 'available') {
      if (liveChat?.sendMessage) {
        liveChat.sendMessage(`Customer query regarding: ${activeResolution?.title || activeCategory || 'General Support'}`);
      }
      appendSupportMessage('Routing your request with priority context to our active support specialist team...');
    } else {
      appendSupportMessage('Our live agents are currently offline. Please use "Raise Support Ticket" so our team can follow up directly!');
    }
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

      showToast(`Support Ticket #${ticket.displayId} created successfully!`, 'success');
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
    setActiveCategory(null);
    setActiveResolution(null);
    setCustomInputUnlocked(false);
    setMessages([{ sender: 'support', text: DEFAULT_GREETING }]);
    releaseSupportStomp();
    setLiveSessionKey((k) => k + 1);
  };

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    const text = input.trim();
    setInput('');

    // If in live mode (or liveStatus === 'available' and not viewing a legacy ticket), send via liveChat
    if ((useLiveStream || liveStatus === 'available') && !viewingLegacyTicket) {
      if (liveChat?.sendMessage) {
        await liveChat.sendMessage(text);
        return;
      }
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

    // If agents are offline
    if (liveStatus !== 'available') {
      appendSupportMessage(
        'Our live agents are currently offline (Support Hours: Mon–Sat 9AM–7PM IST). Would you like to raise a support ticket?'
      );
      return;
    }

    if (liveChat?.sendMessage) {
      await liveChat.sendMessage(text);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setAttachment(file);
    appendSupportMessage(`📎 Attachment ready: "${file.name}". Send your message to submit it.`);
  };

  const handleRatingSubmit = async () => {
    if (!ratingStars) {
      showToast('Please select a star rating between 1 and 5.', 'error');
      return;
    }
    const fullComment = [
      selectedRatingTags.join(', '),
      ratingComment.trim(),
    ].filter(Boolean).join(' - ');

    try {
      await liveChat.submitRating(ratingStars, fullComment);
      setRatingSubmitted(true);
      showToast('⭐ Thank you! Your rating and feedback have been recorded.', 'success');
    } catch {
      showToast('Could not submit rating. Thank you for your feedback!', 'info');
      setRatingSubmitted(true);
    }
  };

  const toggleRatingTag = (tag) => {
    setSelectedRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!isAuthenticated) return null;

  const currentCategoryOptions = activeCategory ? SUPPORT_OPTION_TREE[activeCategory] || [] : [];

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
        <div className="w-[94vw] sm:w-[26rem] max-w-[440px] h-[37rem] max-h-[calc(100dvh-5.5rem)] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-slate-950/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
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
                  ) : isAgentAssigned ? (
                    `Connected with ${liveChat.conversation.assignedAgentEmail}`
                  ) : useLiveStream && (liveChat.conversation?.status === 'WAITING_FOR_AGENT' || liveChat.conversation?.status === 'WAITING') && (liveChat.conversation?.queuePosition > 0) ? (
                    `In Queue (#${liveChat.conversation.queuePosition}) • Connecting shortly...`
                  ) : liveStatus === 'available' ? (
                    '🟢 Support Specialist Online'
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
                  <p className="text-[11px] text-muted-foreground">Choose a quick preset or fill your details for fast resolution.</p>
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

              {/* Quick Preset Buttons for Ticket Raising */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Quick Issue Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TICKET_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTicketSubject(preset.subject);
                        setTicketCategory(preset.category);
                        setTicketPriority(preset.priority);
                        setTicketDescription(preset.description);
                      }}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {liveStatus !== 'available' && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">Live Agents Offline:</span> Mon–Sat, 9:00 AM – 7:00 PM IST. Submit your ticket and our team will get back to you promptly.
                  </div>
                </div>
              )}

              <form onSubmit={handleDirectTicketSubmit} className="space-y-3 pt-1">
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
                <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 animate-in slide-in-from-top-1 text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200 text-[11px]">
                      A live support specialist is now online!
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={handleStartOnlineChatFromAlert}
                      className="h-6 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
                    >
                      Start Chat
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setHasOnlineAgentAlert(false)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
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
                  const isSystemReassign = displayText.includes('[SYSTEM EVENT]');
                  const stripped = stripAttachmentLines(displayText);
                  const bubbleText = stripped || (attachments.length > 0 ? 'Attachment included' : '');
                  const isUser = msg.sender === 'user';

                  if (isSystemReassign) {
                    return (
                      <div key={idx} className="my-2 flex justify-center">
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                          <RefreshCw className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{displayText.replace('[SYSTEM EVENT]', '').trim()}</span>
                        </div>
                      </div>
                    );
                  }

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

                {/* GUIDED AUTOMATION OPTION CARDS (Rendered when agent is NOT yet assigned and not viewing legacy ticket) */}
                {!isAgentAssigned && !viewingLegacyTicket && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    {/* Root Topics Menu */}
                    {!activeCategory && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                          Select a Topic:
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {SUPPORT_OPTION_TREE.root.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectRootCategory(cat)}
                              className="group w-full text-left p-2.5 rounded-2xl border border-border bg-card/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base group-hover:scale-110 transition-transform">{cat.icon}</span>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-foreground group-hover:text-emerald-500 transition-colors">
                                    {cat.title}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">{cat.subtitle}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
                            </button>
                          ))}
                          
                          {/* Unlock Custom Query Option */}
                          <button
                            type="button"
                            onClick={handleUnlockCustomInput}
                            className="w-full text-left p-2.5 rounded-2xl border border-dashed border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition-all flex items-center justify-between cursor-pointer font-semibold text-xs"
                          >
                            <span className="flex items-center gap-2">
                              ✍️ Other / Type Custom Message
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sub-Category Options */}
                    {activeCategory && !activeResolution && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Choose Specific Issue:
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCategory(null)}
                            className="text-[11px] text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-0.5"
                          >
                            <ArrowLeft className="w-3 h-3" /> Back
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5">
                          {currentCategoryOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectSubOption(opt)}
                              className="group w-full text-left p-2.5 rounded-2xl border border-border bg-card/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-sm cursor-pointer"
                            >
                              <div className="font-semibold text-xs text-foreground group-hover:text-emerald-500 pr-2">
                                {opt.title}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 shrink-0" />
                            </button>
                          ))}

                          {/* Branch "Other" Option */}
                          <button
                            type="button"
                            onClick={handleUnlockCustomInput}
                            className="w-full text-left p-2.5 rounded-2xl border border-dashed border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition-all flex items-center justify-between cursor-pointer font-semibold text-xs"
                          >
                            <span className="flex items-center gap-2">
                              ✍️ Other / Describe my issue
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resolution Follow-Up Card */}
                    {activeResolution && (
                      <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2.5 text-xs">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-emerald-500" />
                          <span>Did this resolve your query?</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              showToast('Glad we could help! Let us know if you need anything else.', 'success');
                              setActiveCategory(null);
                              setActiveResolution(null);
                            }}
                            className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                          >
                            <Check className="w-3 h-3 mr-1" /> Yes, resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleConnectLiveFromOption}
                            className="h-7 px-2.5 text-[11px] rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                          >
                            <Headphones className="w-3 h-3 mr-1" /> Talk to Specialist
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleUnlockCustomInput}
                            className="h-7 px-2 text-[11px] rounded-xl text-muted-foreground hover:text-foreground"
                          >
                            ✍️ Type More Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveCategory(null);
                              setActiveResolution(null);
                            }}
                            className="h-7 px-2 text-[11px] rounded-xl text-muted-foreground hover:text-foreground"
                          >
                            🔄 Other Topics
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                    {notifyWhenOnline ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Session alert active: You will be notified the moment an agent comes online.</span>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => setViewMode('ticket_form')}
                        className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Raise Support Ticket
                      </Button>
                      {!notifyWhenOnline && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleNotifyWhenOnline}
                          className="h-8 px-3 text-xs font-semibold rounded-xl border-border hover:bg-muted"
                        >
                          <Bell className="w-3.5 h-3.5 mr-1 text-amber-500" /> Notify Me When Online
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {liveChat.typingUser && useLiveStream && (
                  <div className="text-[11px] text-emerald-500 px-2 py-1 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Support specialist is typing...
                  </div>
                )}

                {/* END-OF-SESSION CSAT STAR RATING CARD */}
                {(liveChat.showRating || liveChat.conversation?.status === 'CLOSED') && useLiveStream && (
                  <div className="rounded-3xl border border-emerald-500/40 bg-card p-4 space-y-3 shadow-lg animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">Rate your support experience</h4>
                          <p className="text-[10px] text-muted-foreground">Your feedback helps our team improve support quality.</p>
                        </div>
                      </div>
                    </div>

                    {!ratingSubmitted ? (
                      <div className="space-y-2.5">
                        {/* 5-Star Selector */}
                        <div className="flex items-center justify-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingStars(star)}
                              className={`text-2xl transition-all p-1 hover:scale-125 focus:outline-none ${
                                ratingStars >= star ? 'text-amber-400 fill-amber-400 scale-110' : 'text-muted-foreground/30 hover:text-amber-300'
                              }`}
                              title={`${star} Star${star > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        {/* Quick Feedback Pills */}
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {['⚡ Fast Response', '💡 Solved my issue', '🤝 Very polite', '🌟 5-Star Service'].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleRatingTag(tag)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                                selectedRatingTags.includes(tag)
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="w-full rounded-xl bg-background border border-border text-xs p-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          rows={2}
                          placeholder="Optional feedback comment for the support team..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                        />

                        <Button
                          size="sm"
                          onClick={handleRatingSubmit}
                          disabled={!ratingStars}
                          className="w-full h-8 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                        >
                          Submit Rating & CSAT Review
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        <div className="font-bold text-xs text-emerald-400">Thank you for your rating!</div>
                        <p className="text-[10px] text-muted-foreground">Your feedback has been recorded and attributed to your support agent.</p>
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar with Guided Protection Gate */}
              {liveStatus === 'offline' && !viewingLegacyTicket ? (
                <div className="p-3 border-t border-border bg-muted/60 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Live chat is offline. Please submit a support ticket.</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setViewMode('ticket_form')}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shrink-0 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" /> Raise Ticket
                  </Button>
                </div>
              ) : !isInputAllowed ? (
                /* Locked State: Prompts user to select options or click "Other" to unlock */
                <div className="p-3 border-t border-border bg-muted/50 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Choose an option above, or unlock custom message</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnlockCustomInput}
                    className="h-7 px-2.5 text-[11px] font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl shrink-0"
                  >
                    <Unlock className="w-3 h-3 mr-1" /> ✍️ Other
                  </Button>
                </div>
              ) : (
                /* Unlocked State: Free text entry allowed once agent is assigned, or "Other" clicked, or viewing ticket */
                <div className="p-3 border-t border-border bg-card/90 flex items-center gap-2 shrink-0">
                  <input
                    ref={inputRef}
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
                        : isAgentAssigned
                        ? `Message with ${liveChat.conversation.assignedAgentEmail}...`
                        : 'Type your message...'
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
