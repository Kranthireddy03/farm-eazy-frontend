import React, { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function PublicHome() {
  const { isDark } = useTheme()

  const focusAreas = [
    {
      title: 'Farm management',
      text: 'Create and maintain farms, plot fields, and track crop details from a single secure dashboard.',
      icon: '🌱',
    },
    {
      title: 'Irrigation planning',
      text: 'Schedule water cycles, monitor status, and keep crop health on track automatically.',
      icon: '💧',
    },
    {
      title: 'Marketplace visibility',
      text: 'Publish products, check availability, and connect with buyers with fewer steps.',
      icon: '📦',
    },
    {
      title: 'Service booking',
      text: 'Request labor, equipment, and consulting support with clear service workflows.',
      icon: '🛠️',
    },
  ]

  const quickActions = [
    'Secure onboarding',
    'Fast support entry points',
    'Clear policy and disclosures',
    'Live operational insight',
  ]

  const quizPool = [
    { title: 'Irrigation logic', question: 'What FarmEazy feature helps farms keep water schedules aligned with crop stages?', options: ['Manual spreadsheets', 'Automated schedule workflows', 'Email reminders'], correctIndex: 1, icon: '💧' },
    { title: 'Onboarding step', question: 'Which action begins the FarmEazy workflow for a new user?', options: ['Register account', 'Submit a ticket', 'Add a crop'], correctIndex: 0, icon: '🧑‍🌾' },
    { title: 'Support entry', question: 'How can public visitors start a support request?', options: ['Email only', 'Public ticket form', 'Hidden phone number'], correctIndex: 1, icon: '🎫' },
    { title: 'Marketplace', question: 'What does FarmEazy let growers publish?', options: ['Personal blogs', 'Product listings', 'Job posts'], correctIndex: 1, icon: '📦' },
    { title: 'Security', question: 'Which method is used for secure signup and login?', options: ['Plain passwords', 'OTP and password', 'No auth'], correctIndex: 1, icon: '🔐' },
    { title: 'Notifications', question: 'How are important updates delivered to users?', options: ['SMS only', 'In-app and email', 'Paper mail'], correctIndex: 1, icon: '📣' },
    { title: 'User data', question: 'Where should users add field and crop details?', options: ['Random notes', 'Farm profile', 'Public blog'], correctIndex: 1, icon: '🌾' },
    { title: 'Roles', question: 'Who can escalate tickets to support agents?', options: ['Anyone anonymously', 'Support agents and owners', 'Only admins'], correctIndex: 1, icon: '🧑‍🔧' },
    { title: 'Irrigation alerts', question: 'What triggers an irrigation reminder?', options: ['Random timer', 'Crop stage schedule', 'User birthdays'], correctIndex: 1, icon: '⏰' },
    { title: 'Scaling', question: 'FarmEazy is built to scale from?', options: ['Only small gardens', 'Individual to large farms', 'Only corporates'], correctIndex: 1, icon: '📈' },
  ]

  const [quizSeed, setQuizSeed] = useState(() => Math.random())
  const displayQuizCards = useMemo(() => pickRandomCards(quizPool, 2), [quizSeed])

  function pickRandomCards(cards, count) {
    const copy = [...cards]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, count)
  }

  function QuizCard({ title, question, options, correctIndex, icon, compact = false }) {
    const { isDark } = useTheme()
    const [selected, setSelected] = useState(null)

    const answered = selected !== null
    const isCorrect = selected === correctIndex

    const optionClass = (index) => {
      if (!answered) {
        return `rounded-2xl border px-3 py-2.5 text-left w-full text-xs font-medium transition ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100 hover:border-emerald-300' : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-400'}`
      }

      if (index === correctIndex) {
        return 'rounded-2xl border border-emerald-500 bg-emerald-600 text-white px-3 py-2.5 text-left w-full text-xs font-semibold'
      }

      if (index === selected) {
        return 'rounded-2xl border border-rose-500 bg-rose-600 text-white px-3 py-2.5 text-left w-full text-xs font-semibold'
      }

      return `rounded-2xl border px-3 py-2.5 text-left w-full text-xs ${isDark ? 'border-slate-700 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500'}`
    }

    return (
      <div className="group relative">
        <div className={`relative min-h-[20rem] max-h-[22rem] overflow-hidden rounded-[1.75rem] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <div className={`absolute inset-0 rounded-[1.75rem] border ${isDark ? 'border-slate-700 bg-slate-900/90' : 'border-slate-200 bg-white/95'} p-5 flex flex-col justify-between overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition duration-300 ease-[cubic-bezier(0.2,0.85,0.2,1)] ${answered ? 'pointer-events-none' : 'pointer-events-auto'} group-hover:pointer-events-none group-hover:opacity-0 group-hover:scale-105 z-20`}> 
            <div>
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className={`mt-3 text-xs leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hover to reveal the question and choose the best answer.</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-slate-950/5'}`}>
              <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Quiz card</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Answer to learn how FarmEazy makes workflows clearer.</p>
            </div>
          </div>

          <div className={`absolute inset-0 rounded-[1.75rem] border ${isDark ? 'border-emerald-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950' : 'border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-cyan-50'} p-5 flex flex-col justify-between overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition duration-300 ease-[cubic-bezier(0.2,0.85,0.2,1)] opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-10`}>
            {!answered ? (
              <div className="flex h-full min-h-0 flex-col">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Question</p>
                  <h3 className="mt-3 text-lg font-black leading-tight">{question}</h3>
                </div>
                <div className="mt-6 flex-1 min-h-0 overflow-auto space-y-3 no-scrollbar">
                  {options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelected(index)}
                      disabled={answered}
                      className={`${optionClass(index)} break-words`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col justify-center overflow-auto no-scrollbar">
                <p className={`text-xs uppercase tracking-[0.28em] font-semibold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>{isCorrect ? 'Correct' : 'Wrong answer'}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight">{isCorrect ? 'Nice choice!' : 'That’s not quite right'}</h3>
                <p className={`mt-4 text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isCorrect ? 'Great choice — FarmEazy uses guided workflows to reduce manual irrigation and support churn.' : 'Not quite — the correct answer is highlighted in green.'}
                </p>
                {!isCorrect && (
                  <p className={`mt-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    Correct answer: <span className="font-semibold text-emerald-300">{options[correctIndex]}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <HeroFrame
        eyebrow="Farm management made simple"
        title={<>Manage farms, crops, irrigation, marketplace listings, and service workflows from one platform.</>}
        description="FarmEazy brings daily farm operations into a single dashboard for growers, sellers, and support teams. Start with a clear onboarding path, then move into real farm workflows quickly."
        actions={(
          <>
            <PillButton to="/register" active>Get started</PillButton>
            <PillButton to="/public-services">Explore platform</PillButton>
          </>
        )}
        side={(
          <GlassPanel className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.28em] text-emerald-300">Live dashboard</span>
                <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Real-time sync</span>
              </div>
              <div className={`rounded-[1.8rem] p-4 ${isDark ? 'bg-slate-950/95 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.22)]' : 'bg-white/95 border border-slate-200 text-slate-900 shadow-sm'}`}>
                <svg viewBox="0 0 360 180" className="h-44 w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="360" height="180" rx="24" fill={isDark ? '#0f172a' : '#eff6ff'} />
                  <path d="M24 132 C80 120 120 90 160 108 S240 110 296 84" fill="none" stroke="url(#lineGrad)" strokeWidth="5" strokeLinecap="round" className="animate-[fadeIn_1.5s_ease-out]" />
                  <circle cx="24" cy="132" r="6" fill={isDark ? '#34d399' : '#16a34a'} />
                  <circle cx="160" cy="108" r="6" fill={isDark ? '#38bdf8' : '#0ea5e9'} />
                  <circle cx="296" cy="84" r="6" fill={isDark ? '#a3e635' : '#22c55e'} />
                  <g opacity="0.7">
                    <rect x="44" y="94" width="28" height="36" rx="10" fill={isDark ? '#1f2937' : '#dbeafe'} />
                    <rect x="114" y="76" width="28" height="54" rx="10" fill={isDark ? '#1f2937' : '#dbeafe'} />
                    <rect x="184" y="100" width="28" height="30" rx="10" fill={isDark ? '#1f2937' : '#dbeafe'} />
                    <rect x="254" y="60" width="28" height="70" rx="10" fill={isDark ? '#1f2937' : '#dbeafe'} />
                  </g>
                </svg>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4 text-slate-100">
                  <strong className="block text-xl">85%</strong>
                  <span className="text-slate-400">Irrigation compliance</span>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 text-slate-100">
                  <strong className="block text-xl">3 workflows</strong>
                  <span className="text-slate-400">Farm, marketplace, and support</span>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}
      />

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] items-start">
        <StrongPanel className="p-6 md:p-7">
          <SectionTitle
            eyebrow="Public entry points"
            title="Answer questions before they become support tickets"
            text="The public landing experience is focused, action-driven, and fully aligned with real farm operations."
          />
          <div className="mt-6 grid gap-4">
            {focusAreas.map((item) => (
              <div key={item.title} className={`rounded-3xl border px-5 py-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/90'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 text-xl">{item.icon}</div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                </div>
                <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </StrongPanel>

        <GlassPanel className="p-6 md:p-7 min-h-full flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Quick access</p>
              <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Explore FarmEazy flows</h2>
            </div>
            <div className="text-4xl float-slow">✨</div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 flex-1">
            {[
              { title: 'Register securely', subtitle: 'Create an account and begin adding farms.' },
              { title: 'View services', subtitle: 'Explore marketplace, irrigation, and support pages.' },
              { title: 'Review policies', subtitle: 'Open terms, privacy, and disclosure content.' },
              { title: 'Contact support', subtitle: 'Access FAQ and support entry points.' },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-700'}`}>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm">{item.subtitle}</p>
              </div>
            ))}
          </div>

          <div className={`mt-5 rounded-3xl border p-5 md:p-6 ${isDark ? 'border-slate-700 bg-slate-900/90 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <h3 className="text-lg font-semibold">Start the right journey</h3>
            <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Use the buttons below to move to the next page and continue your FarmEazy workflow.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <PillButton to="/register" active>Register</PillButton>
              <PillButton to="/public-services">Service pages</PillButton>
              <PillButton to="/contact">Contact</PillButton>
            </div>
          </div>

          <div className={`mt-5 rounded-3xl border p-5 ${isDark ? 'border-slate-700 bg-slate-900/90 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Mini quiz</p>
              </div>
              <span className="text-2xl">📘</span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick knowledge check</h3>
              <button type="button" onClick={() => setQuizSeed(Math.random())} className="rounded-full border border-emerald-500 px-3 py-1 text-sm font-semibold transition hover:bg-emerald-500/10">Try again</button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {displayQuizCards.map((card) => (
                <QuizCard key={`${card.title}-${card.question}`} {...card} compact />
              ))}
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {[
          { label: 'Start here', title: 'Create an account', description: 'Secure signup with email and password validation.' },
          { label: 'Next step', title: 'Add a farm', description: 'Enter field details and crop plans without extra complexity.' },
          { label: 'Stay supported', title: 'Explore help', description: 'Access FAQ, contact, and support from any public page.' },
        ].map((item) => (
          <GlassPanel key={item.title} className="p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{item.label}</p>
            <h3 className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
            <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.description}</p>
          </GlassPanel>
        ))}
      </section>
    </main>
  )
}
