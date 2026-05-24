import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'
import { GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function Contact() {
  const { isDark } = useTheme()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const completion = Math.round((Number(Boolean(formData.name)) + Number(Boolean(formData.email)) + Number(Boolean(formData.subject)) + Number(Boolean(formData.message))) / 4 * 100)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(false)
    setError('')

    try {
      await apiClient.post('/public/support-message', formData)

      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send message. Please try again.')
    }
  }

  const channels = [
    { label: 'Email', value: 'support@farm-eazy.com', href: 'mailto:support@farm-eazy.com', icon: '📧' },
    { label: 'Phone', value: '+91 6301630368', href: 'tel:+916301630368', icon: '📞' },
    { label: 'Hours', value: 'Mon-Sat, 9 AM - 6 PM IST', href: '', icon: '🕐' },
    { label: 'Location', value: 'Ananthapur, Andhra Pradesh, India', href: '', icon: '📍' },
  ]

  const reasons = [
    'Public questions are routed directly into the support workflow.',
    'The form stays minimal so users can send feedback quickly.',
    'Contact options remain visible even on mobile screens.',
  ]

  const [expandedQuestions, setExpandedQuestions] = useState({})

  const commonQuestions = [
    {
      question: 'How do I reset my password?',
      answer: 'Use the password reset link on the login page. If you do not receive the email, check your spam folder or contact support.',
    },
    {
      question: 'How do I track a crop cycle?',
      answer: 'Open the Crops section, select the crop, and view the progress timeline. You can also update schedules and field notes there.',
    },
    {
      question: 'How do I contact support quickly?',
      answer: 'Use the email or phone links on this page, or open the FAQ to find the right support route instantly.',
    },
    {
      question: 'Can I update my farm details later?',
      answer: 'Yes. Farms, crops, and irrigation details can be updated anytime from your account dashboard. Changes are saved immediately and reflected across workflows.',
    },
    {
      question: 'How do I list a product for sale?',
      answer: 'Open the marketplace section, create a new listing, add product details and pricing, then publish it to the FarmEazy vendor catalog.',
    },
    {
      question: 'Where can I see my irrigation schedule?',
      answer: 'Visit the Irrigation section in your dashboard to view active schedules, upcoming waterings, and field status all in one place.',
    },
  ]

  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return (
    <div className="px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-7xl mx-auto space-y-7">
        <HeroFrame
          eyebrow="Contact"
          title="Talk to the FarmEazy team"
          description="Share your query, feedback, or partnership request. We respond with practical guidance for public and user workflows."
          actions={(
            <>
              <PillButton to="/faq" active>Open FAQ</PillButton>
              <PillButton to="/support">Support Center</PillButton>
            </>
          )}
          side={(
            <GlassPanel className="p-5 md:p-6">
              <SectionTitle eyebrow="Why this page exists" title="A direct path to the right conversation" />
              <div className="mt-5 space-y-3">
                {reasons.map((reason) => (
                  <div key={reason} className={`rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 text-slate-200' : 'bg-white/75 text-slate-700'}`}>
                    {reason}
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-7">
          <div className="space-y-5">
            <GlassPanel className="p-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Need an immediate answer?</h2>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Browse FAQ entries or raise a guided query through the support flow. These options are the fastest way to get help.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link to="/faq" className="w-full sm:w-auto text-center px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
                  Open FAQ
                </Link>
                <Link to="/support" className={`w-full sm:w-auto text-center px-4 py-3 rounded-xl border font-semibold transition ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-emerald-200 text-emerald-800 hover:bg-white'}`}>
                  Support Center
                </Link>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Common questions</h2>
              <div className="mt-4 space-y-3">
                {commonQuestions.map((item, index) => (
                  <div key={item.question} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                    <button
                      type="button"
                      onClick={() => toggleQuestion(index)}
                      className="w-full flex items-start justify-between gap-3 text-left"
                      aria-expanded={Boolean(expandedQuestions[index])}
                    >
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{item.question}</span>
                      <span className={`text-xl transition ${expandedQuestions[index] ? 'rotate-45 text-emerald-400' : 'text-emerald-500'}`}>{expandedQuestions[index] ? '−' : '+'}</span>
                    </button>
                    {expandedQuestions[index] && (
                      <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="space-y-5">
            <section className={`interactive-card rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
              <div className={`rounded-2xl border p-4 mb-5 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Form completion</span>
                  <span className={isDark ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold'}>{completion}%</span>
                </div>
                <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
              {submitted && (
                <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  Message sent successfully. We will get back to you shortly.
                </div>
              )}

              {error && (
                <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800/90' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Email address"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800/90' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>

                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  placeholder="Subject"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800/90' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  maxLength={5000}
                  placeholder="Tell us about your request"
                  className={`w-full px-4 py-3 rounded-xl border resize-none transition-all duration-300 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800/90' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />

                <button
                  type="submit"
                  disabled={completion !== 100}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
              </form>
            </section>

            <StrongPanel className="p-6">
              <SectionTitle eyebrow="Support Channels" title="Choose the quickest route to the right team" />
              <div className="mt-4 space-y-3">
                {channels.map((item) => (
                  <div key={item.label} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                    <p className="text-sm">{item.icon} <span className="font-semibold">{item.label}</span></p>
                    {item.href ? (
                      <a href={item.href} className={`text-sm ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-800'} underline`}>
                        {item.value}
                      </a>
                    ) : (
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </StrongPanel>

            <GlassPanel className="p-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>Response Timeline</h3>
              <div className="mt-4 space-y-3">
                {[
                  'Auto-acknowledgement: immediate',
                  'First support response: within business hours',
                  'Escalation for account/order issues: priority queue'
                ].map((item) => (
                  <div key={item} className={`rounded-xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 text-slate-300' : 'bg-white/80 text-slate-700'}`}>
                    {item}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  )
}
