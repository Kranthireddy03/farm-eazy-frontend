import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/apiClient'
import { buildSupportPortalUrl, getSupportPortalBaseUrl, prepareSupportPortalHandoff } from '../utils/supportPortal'
import { HeroFrame, PillButton } from '../components/ui/PremiumSurface'
import { PublicPageContainer, PublicNotePanel } from '../components/public/PublicPagePrimitives'

function Support() {
  const { isDark } = useTheme()
  const { toast, showToast, closeToast } = useToast()
  const { isAuthenticated } = useAuth()
  const supportDashboardBaseUrl = getSupportPortalBaseUrl()

  const [faqFilter, setFaqFilter] = useState('all')
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqList, setFaqList] = useState([])
  const [openFaq, setOpenFaq] = useState([])
  const [showMoreFaqs, setShowMoreFaqs] = useState(false)

  const CORE_FAQS = [
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
      a: 'Go to Register, create your account with phone/email verification, then log in to manage farm workflows.',
      cat: 'account',
    },
    {
      q: 'How does irrigation support work?',
      a: 'You can use irrigation scheduling and service tools to plan watering and track activities effectively.',
      cat: 'irrigation',
    },
    {
      q: 'How do I contact support for unresolved issues?',
      a: 'Use the Support page ticket flow after login, or submit a public question from the Ask Question option.',
      cat: 'support',
    },
    {
      q: 'Is my farm data secure on FarmEazy?',
      a: 'Yes. FarmEazy uses authenticated API access and role-based controls so users can only access their own permitted data.',
      cat: 'security',
    },
    {
      q: 'Can I track crop status changes over time?',
      a: 'Yes. You can create crops, update stages like PLANTED or GROWING, and keep farm-level tracking organized by lifecycle.',
      cat: 'crop',
    },
    {
      q: 'Can I create support tickets without logging in?',
      a: 'Yes. Public users can submit guest support tickets with email details. For full tracking and history, login is recommended.',
      cat: 'support',
    },
    {
      q: 'How are FAQ answers added to public pages?',
      a: 'Users submit questions, admins answer them, and selected answers are published to the approved FAQ list shown on public pages.',
      cat: 'support',
    },
    {
      q: 'What should I do if OTP is not received?',
      a: 'Verify your phone number format, wait for a short retry window, and request OTP again. If it persists, contact support.',
      cat: 'account',
    },
    {
      q: 'Can I filter FAQs by topic?',
      a: 'Yes. Use category filters such as Account, Farm Management, Crop Tracking, Irrigation, Security, and Support.',
      cat: 'support',
    },
    {
      q: 'How does the blog content currently appear?',
      a: 'The blog feed is currently powered by approved FAQ content. A dedicated blog module can be added next for richer publishing.',
      cat: 'other',
    },
  ]

  const FAQ_CATEGORIES = [
    { value: 'account', label: 'Account' },
    { value: 'farm', label: 'Farm Management' },
    { value: 'crop', label: 'Crop Tracking' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'security', label: 'Security' },
    { value: 'support', label: 'Support' },
    { value: 'other', label: 'Other' },
  ]

  const inferFaqCategory = (question = '', answer = '') => {
    const text = `${question} ${answer}`.toLowerCase()
    if (/password|login|register|email|username|account/.test(text)) return 'account'
    if (/farm|field|land/.test(text)) return 'farm'
    if (/crop|plant|harvest|seed/.test(text)) return 'crop'
    if (/irrigation|water|drip|sprinkler/.test(text)) return 'irrigation'
    if (/secure|security|privacy|safe|data/.test(text)) return 'security'
    if (/support|ticket|help|issue|error/.test(text)) return 'support'
    return 'other'
  }

  const filteredCoreFaqs = faqFilter === 'all' ? CORE_FAQS : CORE_FAQS.filter(item => item.cat === faqFilter)
  const filteredMoreFaqs = faqFilter === 'all' ? faqList : faqList.filter(item => item.cat === faqFilter)

  const toggleFaq = (idx) => {
    setOpenFaq(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  const loadFaqs = async () => {
    try {
      setFaqLoading(true)
      const res = await apiClient.get('/faq-questions', { params: { source: 'user' } })
      const backendFaqs = Array.isArray(res.data) ? res.data : []
      const mappedFaqs = backendFaqs
        .filter(item => item?.question && item?.answer)
        .map(item => ({
          id: item.id,
          q: item.question,
          a: item.answer,
          cat: inferFaqCategory(item.question, item.answer),
        }))
      setFaqList(mappedFaqs)
    } catch (_err) {
      setFaqList([])
      showToast('Unable to load FAQ from server. Please try again later.', 'error')
    } finally {
      setFaqLoading(false)
    }
  }

  useEffect(() => {
    loadFaqs()
  }, [])

  const openSupportDashboard = () => {
    const handoffReady = prepareSupportPortalHandoff({ mode: 'user', redirect: '/user/dashboard' })
    if (!handoffReady) {
      showToast('Please login first to open support dashboard', 'warning')
      return
    }
    const url = buildSupportPortalUrl({ portalPath: '/user/dashboard', mode: 'user', redirect: '/user/dashboard' })
    if (!url) {
      showToast('Please login first to open support dashboard', 'warning')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <PublicPageContainer>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <HeroFrame
        eyebrow="Support Center"
        title="Clear answers first, ticket flow when needed"
        description="Browse approved FAQs and escalate quickly when your issue needs personal support."
        actions={(
          <>
            <PillButton to="/ask-question" active>Ask a question</PillButton>
            <PillButton to="/support/ticket">Raise a ticket</PillButton>
          </>
        )}
        side={(
          <PublicNotePanel
            eyebrow="Readability"
            title="Designed for quick scanning"
            items={[
              'Category filters reduce search friction',
              'Core answers are expanded inline',
              'Extra questions load by category on demand',
            ]}
          />
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className={`glass-card interactive-card rounded-2xl border p-6 md:p-8 ${isDark ? 'border-slate-700' : 'border-slate-100 shadow-lg'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>FAQ</p>
            <h1 className={`mt-2 text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Support Knowledge Base</h1>
            <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Review published answers first. If your case is still unresolved, raise a support request and our team will guide you.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className={`px-3 py-1.5 rounded-lg text-sm border ${faqFilter === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                onClick={() => setFaqFilter('all')}
              >
                All
              </button>
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${faqFilter === cat.value ? 'bg-emerald-600 text-white border-emerald-600' : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                  onClick={() => setFaqFilter(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Quick Answers</p>
                <ul className="space-y-3">
                  {filteredCoreFaqs.map((faq, idx) => {
                    const key = `core-${idx}`
                    return (
                      <li key={key} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                        <button className="w-full text-left flex items-center justify-between gap-3" onClick={() => toggleFaq(key)}>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{faq.q}</span>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{openFaq.includes(key) ? '−' : '+'}</span>
                        </button>
                        {openFaq.includes(key) && (
                          <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{faq.a}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowMoreFaqs(prev => !prev)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}
                >
                  {showMoreFaqs ? 'Hide more questions' : 'See more questions'}
                </button>
              </div>

              {showMoreFaqs && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>More Questions</p>
                  {faqLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : filteredMoreFaqs.length === 0 ? (
                    <div className={`rounded-lg p-4 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-emerald-50 text-slate-700'}`}>
                      There are no additional approved questions in this category right now. Use Ask Question to submit yours.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {filteredMoreFaqs.map((faq, idx) => {
                        const key = `db-${faq.id || idx}`
                        return (
                          <li key={key} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                            <button className="w-full text-left flex items-center justify-between gap-3" onClick={() => toggleFaq(key)}>
                              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{faq.q}</span>
                              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{openFaq.includes(key) ? '−' : '+'}</span>
                            </button>
                            {openFaq.includes(key) && (
                              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{faq.a}</p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {!isAuthenticated ? (
            <div className={`glass-card interactive-card rounded-2xl border p-6 ${isDark ? 'border-slate-700' : 'border-slate-100 shadow-sm'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Need personal support?</h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Sign in to create and track support tickets.
              </p>
              <div className="mt-4 flex gap-3">
                <Link to="/login" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Login</Link>
                <Link to="/register" className={`px-4 py-2 rounded-lg border text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-200 text-slate-700'}`}>Register</Link>
              </div>
              <Link to="/ask-question" className={`mt-4 inline-block text-sm underline ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                Ask a public question
              </Link>
            </div>
          ) : (
            <>
              <div className={`glass-card interactive-card rounded-2xl border p-6 ${isDark ? 'border-slate-700' : 'border-slate-100 shadow-sm'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Support Portal for Signed-In Users</h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  FAQ follow-ups and ticket management are now handled in the dedicated Support Portal.
                  You will be signed in automatically with your current session.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={openSupportDashboard}
                    className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    Open Support Portal
                  </button>
                  <a
                    href={supportDashboardBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-3 rounded-lg border text-sm font-semibold text-center ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    Open Standalone Support Site
                  </a>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </PublicPageContainer>
  )
}

export default Support
