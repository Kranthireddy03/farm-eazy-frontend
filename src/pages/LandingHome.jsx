import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { FlipCard, GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function LandingHome() {
  const { isDark } = useTheme()

  const capabilities = [
    {
      title: 'Farm Command Center',
      text: 'Manage crops, irrigation, field activities, and vendor operations from one secure dashboard.',
      icon: '🧭',
      accent: 'from-emerald-400 to-teal-500',
    },
    {
      title: 'Smart Operations',
      text: 'Plan irrigation and crop lifecycles with guided workflows designed for real-world farm execution.',
      icon: '🌾',
      accent: 'from-cyan-400 to-sky-500',
    },
    {
      title: 'Support That Responds',
      text: 'Built-in support and FAQ workflows reduce confusion and keep users productive.',
      icon: '🎫',
      accent: 'from-amber-400 to-orange-500',
    },
  ]

  const highlights = [
    'Secure auth with OTP and password flows',
    'Dark mode and light mode accessibility',
    'Knowledge feed and FAQ integration',
    'Operational visibility across farm lifecycle',
  ]

  const metrics = [
    { value: '24/7', label: 'Support visibility' },
    { value: '3', label: 'Core workflows' },
    { value: '1', label: 'Unified experience' },
  ]

  return (
    <div className="w-full">
      <HeroFrame
        eyebrow="Smart Farm Workflows"
        title={<>Farming workflows that feel <span className="text-emerald-500">simple</span>, reliable, and scalable.</>}
        description="FarmEazy helps modern farm teams run planning, tracking, and support in one platform with clear UX, immersive motion, and secure operations."
        actions={(
          <>
            <PillButton to="/register" active>Sign up</PillButton>
            <PillButton to="/login">Sign in</PillButton>
            <PillButton to="/public-services">View Platform Overview</PillButton>
          </>
        )}
        side={(
          <GlassPanel className="p-5 md:p-6">
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className={`rounded-2xl px-4 py-4 text-center ${isDark ? 'bg-white/5' : 'bg-white/75'}`}>
                  <div className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{metric.value}</div>
                  <div className={`mt-1 text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</div>
                </div>
              ))}
            </div>
            <div className={`mt-5 rounded-[1.4rem] p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-900 text-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Live preview</p>
                  <p className="mt-2 text-sm text-slate-200">Command center, support, and marketplace in one polished flow.</p>
                </div>
                <div className="text-3xl float-medium">🛰️</div>
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
                <PillButton to="/contact">Talk to Team</PillButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>
    </div>
  )
}
