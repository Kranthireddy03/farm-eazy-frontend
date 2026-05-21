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
      </div>
    </div>
  )
}
