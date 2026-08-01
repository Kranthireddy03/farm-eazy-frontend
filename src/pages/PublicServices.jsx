import { Link } from 'react-router-dom'
import { Compass, Droplets, ShoppingCart, Ticket, Lock, SunMoon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { FeatureCard, GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function PublicServices() {
  const { isDark } = useTheme()

  const pillars = [
    {
      name: 'Farm Operations',
      desc: 'Track fields, crop cycles, and critical activities in one operational workspace.',
      icon: Compass,
    },
    {
      name: 'Irrigation Intelligence',
      desc: 'Plan and monitor irrigation with practical scheduling flows and visibility.',
      icon: Droplets,
    },
    {
      name: 'Marketplace Workflows',
      desc: 'Enable buy/sell interactions with cleaner process visibility and records.',
      icon: ShoppingCart,
    },
    {
      name: 'Support & FAQ',
      desc: 'Resolve user issues faster with integrated FAQ and support journeys.',
      icon: Ticket,
    },
    {
      name: 'Secure Access',
      desc: 'OTP and password pathways with improved verification and session control.',
      icon: Lock,
    },
    {
      name: 'Adaptive UI',
      desc: 'Dark and light mode with responsive mobile-first layouts.',
      icon: SunMoon,
    },
  ]

  const promisePoints = [
    'Operational clarity for day-to-day farm work',
    'A public surface that feels premium before login',
    'Dark and light mode support without visual drift',
  ]

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
                  <div key={point} className={`rounded-lg px-4 py-3 text-sm border ${isDark ? 'bg-card border-border text-muted-foreground' : 'bg-background border-border text-foreground'}`}>
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
                <article key={pillar.name} className={`rounded-lg border p-4 ${isDark ? 'border-border bg-card' : 'border-border bg-background'}`}>
                  <div className="flex items-start gap-3">
                    <pillar.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div>
                      <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>{pillar.name}</h2>
                      <p className={`mt-1 text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{pillar.desc}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </StrongPanel>

          <GlassPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Navigation preview"
              title="Where public visitors go next"
              text="Explore knowledge, support, and guidance from the public surface."
            />
            <ScrollRail className="mt-5 grid gap-4 md:grid-cols-3 md:overflow-visible">
              {[
                { label: 'Knowledge', path: '/blog' },
                { label: 'Support', path: '/faq' },
                { label: 'Guidance', path: '/contact' },
              ].map((item) => (
                <Link key={item.path} to={item.path} className={`rounded-lg p-5 border transition ${isDark ? 'border-border bg-card text-foreground hover:bg-accent' : 'border-border bg-background text-foreground hover:bg-muted/30'}`}>
                  <div className="text-sm uppercase tracking-wide text-primary">Next stop</div>
                  <div className="mt-2 text-lg font-semibold">{item.label}</div>
                  <div className={`mt-1 text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{item.path}</div>
                </Link>
              ))}
            </ScrollRail>
          </GlassPanel>
        </section>

        <GlassPanel className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>Explore knowledge and support next</h2>
              <p className={`mt-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>Dive into practical content and user support workflows.</p>
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
