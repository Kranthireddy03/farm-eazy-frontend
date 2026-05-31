import { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { FlipCard, GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function LandingHome() {
  const { isDark } = useTheme()

  const capabilities = [
    {
      title: 'Farm command center',
      text: 'Manage crops, irrigation, field activities, and vendor operations from one secure dashboard.',
      icon: '🧭',
    },
    {
      title: 'Smart operations',
      text: 'Plan irrigation and crop lifecycles with guided workflows designed for real-world farm execution.',
      icon: '🌾',
    },
    {
      title: 'Support that responds',
      text: 'Built-in support workflows reduce confusion and keep users productive.',
      icon: '🎫',
    },
  ]

  const highlights = [
    'Secure auth with OTP and password flows',
    'Dark mode and light mode accessibility',
    'Knowledge feed and FAQ integration',
    'Operational visibility across the farm lifecycle',
  ]

  const metrics = [
    { value: '24/7', label: 'Support visibility' },
    { value: '3', label: 'Core workflows' },
    { value: '1', label: 'Unified experience' },
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

  function QuizCard({ title, question, options, correctIndex, icon }) {
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
    <div className="w-full">
      <HeroFrame
        eyebrow="Smart farm workflows"
        title={<>Farming workflows that feel <span className="text-emerald-500">simple</span>, reliable, and scalable.</>}
        description="FarmEazy helps modern farm teams run planning, tracking, and support in one platform with clear UX, immersive motion, and secure operations."
        actions={(
          <>
            <PillButton to="/register" active>Sign up</PillButton>
            <PillButton to="/login">Sign in</PillButton>
            <PillButton to="/public-services">View platform overview</PillButton>
          </>
        )}
        side={(
          <GlassPanel className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className={`rounded-2xl px-4 py-4 text-center ${isDark ? 'bg-white/5' : 'bg-white/75'}`}>
                    <div className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{metric.value}</div>
                    <div className={`mt-1 text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</div>
                  </div>
                ))}
              </div>
              <div className={`mt-5 rounded-[1.4rem] p-4 ${isDark ? 'bg-slate-950/70' : 'bg-white/95 border border-slate-200 text-slate-900 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Live preview</p>
                    <p className="mt-2 text-sm text-slate-200">Command center, support, and marketplace in one polished flow.</p>
                  </div>
                  <div className="text-3xl">🛰️</div>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}
      />

      <section className="px-4 md:px-6 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
          <StrongPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Why it stands out"
              title="A premium surface for real farm operations"
              text="The UI is built to guide action fast: fewer dead ends, clearer states, and richer visual feedback when a task matters."
            />
            <ul className="mt-6 space-y-3">
              {highlights.map((point) => (
                <li key={point} className={`rounded-2xl px-4 py-3 text-sm border ${isDark ? 'border-white/8 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/75 text-slate-700'}`}>
                  {point}
                </li>
              ))}
            </ul>
          </StrongPanel>

          <div>
            <div className="flex items-end justify-between mb-4">
              <SectionTitle eyebrow="Capabilities" title="Interactive cards built for scanning" />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hover to reveal</span>
            </div>
            <ScrollRail className="flex gap-4 overflow-x-auto pb-4">
              {capabilities.map((item) => (
                <FlipCard
                  key={item.title}
                  icon={item.icon}
                  frontTitle={item.title}
                  frontText={item.text}
                  backTitle={`${item.title} in action`}
                  backText="This area can expand into richer workflows later without altering the underlying navigation or API behavior."
                  className="min-w-[18rem] w-[18rem] shrink-0"
                />
              ))}
            </ScrollRail>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <SectionTitle
              eyebrow="FarmEazy quiz"
              title="Explore the product with 2 interactive flip cards"
              text="Hover each card to reveal a FarmEazy question, then choose the answer. Correct selections turn green, incorrect picks turn red while the right answer stays highlighted."
            />
            <button type="button" onClick={() => setQuizSeed(Math.random())} className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold transition hover:bg-emerald-500/10">Try again</button>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {displayQuizCards.map((card) => (
              <QuizCard key={`${card.title}-${card.question}`} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <GlassPanel className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Ready to modernize your farm operations?</h2>
                <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Start with a secure account, then scale your workflows confidently.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PillButton to="/register" active>Sign up</PillButton>
                <PillButton to="/contact">Talk to team</PillButton>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="mt-6 p-6 md:p-8">
            <SectionTitle eyebrow="What normal users do first" title="Get started with the simplest flow" />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Create an account', text: 'Sign up and verify your email and phone.' },
                { title: 'Add a farm', text: 'Enter field and crop details so tracking begins immediately.' },
                { title: 'Browse support', text: 'Check FAQ and contact support if you have questions.' },
              ].map((item) => (
                <div key={item.title} className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </section>
    </div>
  )
}
