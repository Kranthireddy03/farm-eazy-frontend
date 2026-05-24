import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function PublicServices() {
  const { isDark } = useTheme()
  const [quizSeed, setQuizSeed] = useState(Math.random())

  const pillars = [
    {
      name: 'Farm Operations',
      desc: 'Track fields, crop cycles, and critical activities in one operational workspace.',
      icon: '🧭',
    },
    {
      name: 'Irrigation Intelligence',
      desc: 'Plan and monitor irrigation with practical scheduling flows and visibility.',
      icon: '💧',
    },
    {
      name: 'Marketplace Workflows',
      desc: 'Enable buy/sell interactions with cleaner process visibility and records.',
      icon: '🛒',
    },
    {
      name: 'Support & FAQ',
      desc: 'Resolve user issues faster with integrated FAQ and support journeys.',
      icon: '🎫',
    },
    {
      name: 'Secure Access',
      desc: 'OTP and password pathways with improved verification and session control.',
      icon: '🔐',
    },
    {
      name: 'Adaptive UI',
      desc: 'Dark and light mode with responsive mobile-first layouts.',
      icon: '🌓',
    },
  ]

  const promisePoints = [
    'Operational clarity for day-to-day farm work',
    'A public surface that feels premium before login',
    'Dark and light mode support without visual drift',
  ]

  const serviceQuizCards = [
    {
      title: 'Farm operations',
      question: 'What does FarmEazy highlight for farm operations?',
      options: ['Manual paper workflows', 'Fields, crop cycles and tasks', 'Only billing data'],
      correctIndex: 1,
      icon: '🌾',
      correctText: 'FarmEazy focuses on fields, crop cycles, and operational tasks, not just paperwork or billing.',
      wrongText: 'The platform centers on operational visibility rather than only paper processes or billing.',
    },
    {
      title: 'Irrigation planning',
      question: 'Which irrigation feature is emphasized on public services?',
      options: ['Live sensor feed only', 'Irrigation scheduling and monitoring', 'Bank account details'],
      correctIndex: 1,
      icon: '💧',
      correctText: 'Irrigation scheduling and monitoring help growers keep water plans aligned with crops.',
      wrongText: 'Public services highlight scheduling and visibility, not just sensor feeds or unrelated details.',
    },
    {
      title: 'Marketplace flow',
      question: 'What marketplace workflow does FarmEazy support?',
      options: ['Buy/sell listings and orders', 'Only social sharing', 'Event ticketing'],
      correctIndex: 0,
      icon: '🛒',
      correctText: 'FarmEazy supports buy/sell listings and order workflows for farm products and services.',
      wrongText: 'Marketplace support is focused on listings and orders, not social sharing or event ticketing.',
    },
    {
      title: 'Support experience',
      question: 'How does FarmEazy present support to public users?',
      options: ['Hidden chat link', 'Visible FAQ and support channels', 'No support options'],
      correctIndex: 1,
      icon: '🎫',
      correctText: 'Support is shown clearly through FAQ and support channels so users can get help fast.',
      wrongText: 'The page emphasizes visible support, not hidden or missing help options.',
    },
    {
      title: 'Secure access',
      question: 'What is FarmEazy’s approach to login security?',
      options: ['OTP and password controls', 'No verification', 'Only biometric login'],
      correctIndex: 0,
      icon: '🔐',
      correctText: 'Secure access is delivered through OTP and password pathways designed for public and user workflows.',
      wrongText: 'The platform does not rely on absent verification or only biometric login for public access.',
    },
    {
      title: 'Adaptive UI',
      question: 'Which visual behavior is offered to public users?',
      options: ['Dark and light mode support', 'Only monochrome styling', 'No theme support'],
      correctIndex: 0,
      icon: '🌓',
      correctText: 'The public pages support both dark and light modes for consistent readability and comfort.',
      wrongText: 'FarmEazy does not limit the public experience to monochrome or no theme support.',
    },
    {
      title: 'Service coverage',
      question: 'Which type of public content is listed on this page?',
      options: ['Product features and support journeys', 'Personal blog posts', 'Internal admin tools'],
      correctIndex: 0,
      icon: '📘',
      correctText: 'This page highlights platform features and support journeys for public visitors.',
      wrongText: 'The page is not about internal admin tools or personal blogging content.',
    },
    {
      title: 'Public journey',
      question: 'What does the public services page encourage next?',
      options: ['Explore FAQ and contact', 'Ignore the platform', 'Download unrelated files'],
      correctIndex: 0,
      icon: '🚀',
      correctText: 'It encourages visitors to explore FAQ and contact support to continue their journey.',
      wrongText: 'The page is meant to guide users forward, not push them away or to unrelated downloads.',
    },
    {
      title: 'Quality promise',
      question: 'What promise does the public page make about the product?',
      options: ['Premium feel before login', 'Hidden features only after signup', 'Inconsistent visuals'],
      correctIndex: 0,
      icon: '✨',
      correctText: 'It promises that the public surface feels premium and clear even before login.',
      wrongText: 'FarmEazy aims for a polished, consistent public view, not hidden or inconsistent design.',
    },
    {
      title: 'User support',
      question: 'What should users find without navigating too far?',
      options: ['Support channels and FAQ', 'Only developer docs', 'No contact info'],
      correctIndex: 0,
      icon: '📞',
      correctText: 'Public users should quickly find support channels and FAQ content.',
      wrongText: 'The page is not designed to hide contact information or only show developer docs.',
    },
    {
      title: 'Platform focus',
      question: 'What is the main focus of platform workflow messaging?',
      options: ['Clear farm workflows', 'Generic marketing buzz', 'Unrelated corporate news'],
      correctIndex: 0,
      icon: '🧩',
      correctText: 'The messaging is about clear farm workflows, not generic marketing or irrelevant news.',
      wrongText: 'FarmEazy is not focused on buzzwords or unrelated corporate announcements.',
    },
    {
      title: 'Landing clarity',
      question: 'What should the public landing experience feel like?',
      options: ['Structured and easy to scan', 'Confusing and crowded', 'Empty and unfinished'],
      correctIndex: 0,
      icon: '🧭',
      correctText: 'A public landing experience should feel structured and easy to scan.',
      wrongText: 'It should not be confusing, crowded, or feel unfinished.',
    },
    {
      title: 'Order flow',
      question: 'Which workflow is included in the service page?',
      options: ['Marketplace order workflows', 'Social media posting', 'Video streaming'],
      correctIndex: 0,
      icon: '🛍️',
      correctText: 'Marketplace order workflows are included and described as part of the public service overview.',
      wrongText: 'The page does not focus on social media or video streaming workflows.',
    },
    {
      title: 'Irrigation detail',
      question: 'How is irrigation described in the content?',
      options: ['As planning and monitoring', 'As a one-time report', 'As an unrelated feature'],
      correctIndex: 0,
      icon: '🌱',
      correctText: 'Irrigation is described as planning and monitoring, not as a one-time report or unrelated feature.',
      wrongText: 'The page emphasizes ongoing irrigation planning not a disconnected or unrelated feature.',
    },
    {
      title: 'Support visibility',
      question: 'What is the primary purpose of support content on the public page?',
      options: ['Make help easy to find', 'Hide help behind menus', 'Remove support completely'],
      correctIndex: 0,
      icon: '🛟',
      correctText: 'The support content is meant to make help easy to find for visitors.',
      wrongText: 'The page is not designed to hide help or remove support entirely.',
    },
    {
      title: 'Access paths',
      question: 'What access paths are highlighted for public users?',
      options: ['FAQ, contact, and support journeys', 'Internal admin panels', 'Accounting dashboards only'],
      correctIndex: 0,
      icon: '🛣️',
      correctText: 'FAQ, contact, and support journeys are the highlighted access paths for public users.',
      wrongText: 'This page is not focused on internal admin or accounting dashboards.',
    },
    {
      title: 'Target audience',
      question: 'Who should gain confidence from this page?',
      options: ['Growers and farm teams', 'Only developers', 'Only investors'],
      correctIndex: 0,
      icon: '👩‍🌾',
      correctText: 'Growers and farm teams are the intended audience for the public overview content.',
      wrongText: 'The page is not targeted solely at developers or investors.',
    },
    {
      title: 'Outcome promise',
      question: 'What outcome does the page promise for public visitors?',
      options: ['Better operational clarity', 'More confusion', 'Fewer options'],
      correctIndex: 0,
      icon: '📈',
      correctText: 'It promises better operational clarity, not confusion or fewer options.',
      wrongText: 'The public page is meant to guide, not confuse or restrict visitors.',
    },
    {
      title: 'Service entry',
      question: 'What does a visitor find in the page’s final section?',
      options: ['Next steps and contact choices', 'Hidden copyright text', 'Login only'],
      correctIndex: 0,
      icon: '✅',
      correctText: 'The final section steers visitors toward next steps and contact choices.',
      wrongText: 'It is not focused on hidden text or only login prompts.',
    },
    {
      title: 'Support promise',
      question: 'What is the support page call to action?',
      options: ['Contact, FAQ, and guided support', 'Ignore questions', 'Only chatbots'],
      correctIndex: 0,
      icon: '📬',
      correctText: 'The page encourages contact, FAQ lookup, and guided support, not ignoring questions.',
      wrongText: 'The call to action is not to ignore questions or rely only on bots.',
    },
  ]

  const displayQuizCards = useMemo(() => pickRandomCards(serviceQuizCards, 4), [quizSeed])

  function pickRandomCards(cards, count) {
    const copy = [...cards]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, count)
  }

  function resetQuiz() {
    setQuizSeed(Math.random())
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
        <div className={`relative min-h-[20rem] overflow-hidden rounded-[1.75rem] border ${isDark ? 'border-slate-700 bg-slate-950/90' : 'border-slate-200 bg-white/95'} shadow-[0_18px_40px_rgba(15,23,42,0.12)]`}>
          <div className={`absolute inset-0 rounded-[1.75rem] p-5 flex flex-col justify-between transition duration-300 ease-[cubic-bezier(0.2,0.85,0.2,1)] ${answered ? 'opacity-0 pointer-events-none' : 'opacity-100'} group-hover:opacity-0`}>
            <div>
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className={`mt-3 text-xs leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hover to reveal the question and choose the best answer.</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-slate-950/5'}`}>
              <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Service quiz</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Learn more about what this page delivers.</p>
            </div>
          </div>

          <div className={`absolute inset-0 rounded-[1.75rem] p-5 flex flex-col justify-between transition duration-300 ease-[cubic-bezier(0.2,0.85,0.2,1)] opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto ${answered ? 'opacity-100 scale-100 pointer-events-auto' : ''}`}>
            {!answered ? (
              <>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Question</p>
                  <h3 className="mt-3 text-lg font-black leading-tight">{question}</h3>
                </div>
                <div className="mt-6 space-y-3 overflow-auto no-scrollbar">
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
              </>
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
          eyebrow="Platform Overview"
          title="A complete farm platform for farms, crops, irrigation, marketplace, and services."
          description="FarmEazy helps teams move from manual notes and calls to structured farm records, irrigation plans, product listings, and service bookings in one practical platform."
          actions={(
            <>
              <PillButton to="/blog" active>View Blog</PillButton>
              <PillButton to="/faq">Open FAQ</PillButton>
            </>
          )}
          side={(
            <GlassPanel className="p-5 md:p-6">
              <SectionTitle eyebrow="Promise" title="Public pages should already feel like a product" />
              <div className="mt-5 space-y-3">
                {promisePoints.map((point) => (
                  <div key={point} className={`rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 text-slate-200' : 'bg-white/75 text-slate-700'}`}>
                    {point}
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        />

        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <StrongPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Core pillars"
              title="Everything the public should know, in one compact system"
              text="These are the high-level service pillars users can scan before they decide whether to explore deeper product pages or support content."
            />
            <div className="mt-6 space-y-4">
              {pillars.map((pillar) => (
                <article key={pillar.name} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{pillar.icon}</div>
                    <div>
                      <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pillar.name}</h2>
                      <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{pillar.desc}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </StrongPanel>

          <GlassPanel className="p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Navigation preview</p>
                <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Where public visitors go next</h2>
              </div>
              <div className="text-4xl float-slow">🧭</div>
            </div>
            <ScrollRail className="mt-5 grid gap-4 md:grid-cols-3 md:overflow-visible">
              {[
                { label: 'Knowledge', path: '/blog' },
                { label: 'Support', path: '/faq' },
                { label: 'Guidance', path: '/contact' },
              ].map((item) => (
                <Link key={item.path} to={item.path} className={`rounded-2xl p-5 border transition ${isDark ? 'border-white/10 bg-slate-950/50 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'}`}>
                  <div className="text-sm uppercase tracking-[0.24em] text-emerald-400">Next stop</div>
                  <div className="mt-2 text-lg font-semibold">{item.label}</div>
                  <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.path}</div>
                </Link>
              ))}
            </ScrollRail>

            <div className="mt-6 border-t border-slate-200/10 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Platform quiz</p>
                  <h3 className={`mt-2 text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Hover questions from this page</h3>
                </div>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="rounded-full border border-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/10"
                >
                  Shuffle cards
                </button>
              </div>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hover over a card, answer the question, and see instant feedback immediately.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {displayQuizCards.map((card, index) => (
                  <QuizCard key={`${card.title}-${index}`} {...card} />
                ))}
              </div>
            </div>
          </GlassPanel>
        </section>

        <GlassPanel className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Explore knowledge and support next</h2>
              <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dive into practical content and user support workflows.</p>
            </div>
            <div className="flex gap-3">
              <PillButton to="/blog" active>View Blog</PillButton>
              <PillButton to="/faq">Open FAQ</PillButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
