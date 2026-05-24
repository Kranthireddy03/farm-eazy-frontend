import { useMemo, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { GlassPanel, HeroFrame, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function About() {
  const { isDark } = useTheme()

  const principles = [
    {
      title: 'Operational Clarity',
      text: 'Every flow is designed to reduce confusion and help users take action fast.',
      icon: '🎯',
    },
    {
      title: 'Reliable by Design',
      text: 'From auth to support, we prioritize stable workflows that teams can trust daily.',
      icon: '🛡️',
    },
    {
      title: 'Farmer-first UX',
      text: 'Practical interfaces shaped around real agricultural operations.',
      icon: '🌱',
    },
    {
      title: 'Scalable Architecture',
      text: 'Built for growth from individual users to larger farm organizations.',
      icon: '📈',
    },
  ]

  const milestones = [
    { year: '01', label: 'Focused public onboarding' },
    { year: '02', label: 'Secure support workflows' },
    { year: '03', label: 'Farm-first operational clarity' },
    { year: '04', label: 'Scalable digital backbone' },
  ]

  const aboutQuizCards = [
    {
      title: 'Core mission',
      question: 'What is FarmEazy’s main goal for growers?',
      options: ['Replace farm teams', 'Reduce manual farm work', 'Focus on marketing only'],
      correctIndex: 1,
      icon: '🎯',
      correctText: 'FarmEazy is designed to reduce manual farm work, not replace people, by making operations easier and more reliable.',
      wrongText: 'FarmEazy is about improving operations, not replacing farmers or only focusing on marketing.',
    },
    {
      title: 'Transparency',
      question: 'How does FarmEazy keep workflows clear?',
      options: ['Hidden notifications', 'Visible task progression', 'Manual chats'],
      correctIndex: 1,
      icon: '🔍',
      correctText: 'Visible task progression helps users know what to do next and keeps workflows transparent across the platform.',
      wrongText: 'Hidden notifications and manual chats can create confusion; FarmEazy emphasizes clear steps and status.',
    },
    {
      title: 'About design',
      question: 'What does FarmEazy prioritize in its interface design?',
      options: ['Visual complexity', 'Practical farmer-first flows', 'Animated menus'],
      correctIndex: 1,
      icon: '🌿',
      correctText: 'Practical farmer-first flows are prioritized so users can complete tasks without unnecessary complexity.',
      wrongText: 'FarmEazy favors clarity and practicality over decorative complexity or flashy animations.',
    },
    {
      title: 'Scalability',
      question: 'What does FarmEazy scale from and to?',
      options: ['Single users to large farm teams', 'Only small gardens', 'Only big corporations'],
      correctIndex: 0,
      icon: '📈',
      correctText: 'FarmEazy is built to scale from individual growers to larger farm organizations.',
      wrongText: 'FarmEazy is not limited to small gardens or only big corporations; it supports growth across scales.',
    },
    {
      title: 'Support workflow',
      question: 'How does FarmEazy handle support and escalation?',
      options: ['Unstructured tickets', 'Structured support flows', 'Phone-only support'],
      correctIndex: 1,
      icon: '🧩',
      correctText: 'Structured support flows keep issues visible and easier to resolve compared to unstructured ticketing.',
      wrongText: 'Phone-only support and unstructured tickets can be inefficient; FarmEazy uses structured workflows.',
    },
    {
      title: 'User onboarding',
      question: 'What is the first experience for new users?',
      options: ['Complicated setup', 'Clear onboarding path', 'No onboarding'],
      correctIndex: 1,
      icon: '🚀',
      correctText: 'FarmEazy begins with a clear onboarding path so new users can get started quickly and correctly.',
      wrongText: 'There is no emphasis on complicated setup or skipping onboarding; FarmEazy focuses on clarity.',
    },
    {
      title: 'Public entry',
      question: 'What does the About page emphasize about public experience?',
      options: ['Confusing links', 'Easy public onboarding', 'Hidden options'],
      correctIndex: 1,
      icon: '🧭',
      correctText: 'The page emphasizes easy public onboarding so visitors can quickly understand value and next steps.',
      wrongText: 'FarmEazy does not use confusing links or hidden options for public experience.',
    },
    {
      title: 'Operational focus',
      question: 'What is FarmEazy built around?',
      options: ['Marketing hype', 'Operational clarity', 'Random features'],
      correctIndex: 1,
      icon: '⚙️',
      correctText: 'FarmEazy is built around operational clarity, not hype or random feature collections.',
      wrongText: 'FarmEazy focuses on operations and support, not on random or flashy features.',
    },
    {
      title: 'Design principle',
      question: 'What design quality is highlighted on About?',
      options: ['Calm and fast', 'Busy and flashy', 'Slow and complex'],
      correctIndex: 0,
      icon: '✨',
      correctText: 'The About page highlights a calm, fast, and predictable interface for users.',
      wrongText: 'FarmEazy does not aim for busy, flashy, or slow experiences; it aims for calm usability.',
    },
    {
      title: 'Accessibility',
      question: 'What does About say about theme support?',
      options: ['Only dark mode', 'Dark and light modes', 'No theme support'],
      correctIndex: 1,
      icon: '🌗',
      correctText: 'FarmEazy supports both dark and light modes for consistent user comfort.',
      wrongText: 'The platform supports both themes, not only dark mode or none at all.',
    },
  ]

  const [aboutQuizSeed, setAboutQuizSeed] = useState(() => Math.random())
  const aboutDisplayQuizCards = useMemo(() => pickRandomCards(aboutQuizCards, 2), [aboutQuizSeed])

  function pickRandomCards(cards, count) {
    const copy = [...cards]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, count)
  }

  function resetAboutQuiz() {
    setAboutQuizSeed(Math.random())
  }

  function QuizCard({ title, question, options, correctIndex, icon, correctText, wrongText }) {
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
              <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>About quiz</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Learn more about FarmEazy from the About page.</p>
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
                  {isCorrect ? correctText : wrongText}
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
    <div className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-7xl mx-auto space-y-8">
        <HeroFrame
          eyebrow="About FarmEazy"
          title="A practical digital platform built for farming operations and support workflows."
          description="FarmEazy helps growers reduce manual work by bringing farm records, crop plans, irrigation schedules, product listings, and support into one reliable dashboard."
          actions={null}
          side={
            <GlassPanel className="p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Vision</p>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Build a dependable digital backbone for agriculture where users can manage operations, collaborate efficiently, and scale outcomes without workflow friction.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {milestones.map((item) => (
                  <div key={item.label} className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/75'}`}>
                    <div className="text-2xl font-black text-emerald-400">{item.year}</div>
                    <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          }
        />

        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <StrongPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Design principles"
              title="A product language that stays operational under pressure"
              text="The interface is meant to be calm, fast, and predictable, even when the user is moving between support, onboarding, and task management."
            />
            <div className="mt-6 space-y-4">
              {principles.map((item) => (
                <article key={item.title} className={`rounded-2xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h2>
                      <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </StrongPanel>

          <GlassPanel className="p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <SectionTitle eyebrow="Outcome" title="Built to scale without visual fatigue" />
              <div className="text-4xl float-medium">🌿</div>
            </div>
            <ScrollRail className="mt-5 grid gap-4 md:grid-cols-2 md:overflow-visible">
              {[
                'Clear paths for public visitors and returning users',
                'Support surfaces that make escalation easier',
                'Theme-aware styling across dark and light modes',
                'A consistent visual rhythm that can expand page by page',
              ].map((item) => (
                <div key={item} className={`rounded-2xl p-4 text-sm border ${isDark ? 'bg-slate-950/60 border-white/10 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-700'}`}>
                  {item}
                </div>
              ))}
            </ScrollRail>

            <div className={`mt-6 rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-slate-950/80 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-950'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">About quiz</p>
                  <h3 className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Two random questions to explore the page</h3>
                </div>
                <button
                  type="button"
                  onClick={resetAboutQuiz}
                  className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold transition hover:bg-emerald-500/10"
                >
                  Try again
                </button>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {aboutDisplayQuizCards.map((card, index) => (
                  <QuizCard key={`${card.title}-${aboutQuizSeed}-${index}`} {...card} />
                ))}
              </div>
            </div>
          </GlassPanel>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Public Experience', text: 'Visitors quickly understand the value proposition and where to start.', icon: '🧭' },
            { title: 'Protected Workflows', text: 'Signed-in users move through farms, crops, and marketplace without friction.', icon: '⚙️' },
            { title: 'Support Reliability', text: 'Escalations, ticketing, and communication remain visible and structured.', icon: '🧩' },
          ].map((item) => (
            <article key={item.title} className={`interactive-card rounded-2xl border p-5 ${isDark ? 'bg-slate-900/70 border-slate-700' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
              <p className="text-2xl">{item.icon}</p>
              <h3 className={`mt-3 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
            </article>
          ))}
        </section>

        <GlassPanel className="p-6 md:p-7 mt-6">
          <SectionTitle eyebrow="For normal users" title="A clear, practical experience for everyone" text="This interface is built to help everyday users navigate operations, support, and farm management without unnecessary complexity." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { title: 'Simple actions', detail: 'Actions are grouped around what the user needs to do next.' },
              { title: 'Visible support', detail: 'Help and contact options are easy to find on every page.' },
              { title: 'Focused workflows', detail: 'Farm tasks, irrigation, and orders are presented clearly and consistently.' },
              { title: 'Modern comfort', detail: 'Dark and light modes work without changing the experience.' },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.detail}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
