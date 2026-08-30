/**
 * Fixed FAQ content shown on every portal before admin-approved API entries.
 * COMMON_FAQS are shared between the main app and support portal.
 */

export const COMMON_FAQS = [
  {
    q: 'How are FAQ answers added to public pages?',
    a: 'Users submit questions, admins review and approve answers, and selected entries are published to the approved FAQ list on public and portal pages.',
    cat: 'support',
  },
  {
    q: 'How should sensitive customer data be handled in tickets?',
    a: 'Avoid storing full payment or personal identifiers in ticket messages. Use secure records for operational details and redact PII before publishing any public-facing FAQ.',
    cat: 'security',
  },
  {
    q: 'How do I contact support for unresolved issues?',
    a: 'Use Ask Question or open a support ticket after signing in. Guest users can submit tickets with email contact details for follow-up.',
    cat: 'support',
  },
]

export const USER_CORE_FAQS = [
  {
    q: 'What is FarmEazy mainly used for?',
    a: 'FarmEazy helps farmers manage farms, crop activities, irrigation planning, and support queries in one platform.',
    cat: 'farm',
  },
  {
    q: 'Can I use FarmEazy before logging in?',
    a: 'Yes. Public pages explain features, workflows, FAQs, and contact options so you can understand the platform first.',
    cat: 'account',
  },
  {
    q: 'How do I register and get started?',
    a: 'Go to Register, create your account with phone or email verification, then log in to manage farm workflows.',
    cat: 'account',
  },
  {
    q: 'How does irrigation support work?',
    a: 'Use irrigation scheduling and service tools to plan watering and track activities effectively.',
    cat: 'irrigation',
  },
  {
    q: 'Can I track crop status changes over time?',
    a: 'Yes. Create crops, update stages like PLANTED or GROWING, and keep farm-level tracking organized by lifecycle.',
    cat: 'crop',
  },
  {
    q: 'Can I create support tickets without logging in?',
    a: 'Yes. Public users can submit guest support tickets with email details. For full tracking and history, login is recommended.',
    cat: 'support',
  },
  {
    q: 'What should I do if OTP is not received?',
    a: 'Verify your phone number format, wait for a short retry window, and request OTP again. If it persists, contact support.',
    cat: 'account',
  },
  {
    q: 'Can I filter FAQs by topic?',
    a: 'Use category filters such as Account, Farm Management, Crop Tracking, Irrigation, Security, and Support.',
    cat: 'support',
  },
]

export const ADMIN_CORE_FAQS = [
  {
    q: 'How do I publish an FAQ so it appears on the public landing?',
    a: 'Go to FAQ Review, answer the question, set visibility (user, admin, or both), and publish with Add to FAQ enabled. Published FAQs appear on the approved list immediately.',
    cat: 'faq-management',
  },
  {
    q: 'What is the recommended workflow for triaging incoming tickets?',
    a: 'Review subject and initial message, assign priority, add internal notes, and update status to In Progress when work begins. Use tags for affected systems and track SLA expectations.',
    cat: 'tickets',
  },
  {
    q: 'How do I create user roles and control access to support features?',
    a: 'Open Roles, create a role (for example SupportAgent or Manager), assign permissions such as respond-ticket and publish-faq, then assign roles from the Users screen.',
    cat: 'admin-tools',
  },
  {
    q: 'How can I export tickets for reporting?',
    a: 'Use Tickets filters by date, priority, or category, then export CSV. For advanced reporting, integrate with your BI tool or schedule recurring exports.',
    cat: 'admin-tools',
  },
  {
    q: 'How do I revert a published FAQ if it contains incorrect information?',
    a: 'Open FAQ Review, unpublish or archive the entry, then create a corrected version and republish. Revision history helps restore earlier versions when needed.',
    cat: 'faq-management',
  },
  {
    q: 'What are best practices for reducing ticket volume?',
    a: 'Maintain a clear searchable FAQ, add contextual help where errors occur, and use canned responses for repetitive queries. Monitor trends to improve documentation and UX.',
    cat: 'other',
  },
  {
    q: 'How do I escalate a ticket to engineering?',
    a: 'Use ticket escalation, attach logs and reproduction steps, assign to engineering, and set an appropriate SLA. Follow up in the thread to keep the requester informed.',
    cat: 'tickets',
  },
]

export const USER_FAQ_CATEGORIES = [
  { value: 'account', label: 'Account' },
  { value: 'farm', label: 'Farm Management' },
  { value: 'crop', label: 'Crop Tracking' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'security', label: 'Security' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' },
]

export const ADMIN_FAQ_CATEGORIES = [
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'tickets', label: 'Ticketing' },
  { value: 'faq-management', label: 'FAQ Management' },
  { value: 'admin-tools', label: 'Admin Tools' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
]

export function getCoreFaqsForAudience(audience) {
  if (audience === 'admin') {
    return [...COMMON_FAQS, ...ADMIN_CORE_FAQS]
  }
  return [...COMMON_FAQS, ...USER_CORE_FAQS]
}

export function inferFaqCategory(question = '', answer = '') {
  const text = `${question} ${answer}`.toLowerCase()
  if (/password|login|register|email|username|account/.test(text)) return 'account'
  if (/farm|field|land/.test(text)) return 'farm'
  if (/crop|plant|harvest|seed/.test(text)) return 'crop'
  if (/irrigation|water|drip|sprinkler/.test(text)) return 'irrigation'
  if (/secure|security|privacy|safe|data|pii/.test(text)) return 'security'
  if (/support|ticket|help|issue|error/.test(text)) return 'support'
  if (/faq|publish|approval/.test(text)) return 'faq-management'
  if (/role|permission|admin|export/.test(text)) return 'admin-tools'
  if (/escalat|priority|triage/.test(text)) return 'tickets'
  return 'other'
}

export function mapApprovedFaqs(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item?.question)
    .map((item) => ({
      id: item.id,
      q: item.question,
      a: item.answer || item.details || 'This answer is being finalized by our team.',
      cat: inferFaqCategory(item.question, item.answer || item.details || ''),
    }))
}
