import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function PublicServices() {
  const { isDark } = useTheme()

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

  return (
    <div className="px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <HeroFrame
          eyebrow="Platform Overview"
          title="A complete farm-management platform, built for daily execution."
          description="FarmEazy is designed to support operational decisions, improve process clarity, and reduce workflow bottlenecks across the farm lifecycle."
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
