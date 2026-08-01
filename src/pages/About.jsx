import { Target, Shield, Sprout, TrendingUp, Compass, Settings, Puzzle } from 'lucide-react'
import { FeatureCard, GlassPanel, HeroFrame, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function About() {
  const principles = [
    { title: 'Operational clarity', text: 'Every flow is designed to reduce confusion and help users take action fast.', icon: Target },
    { title: 'Reliable by design', text: 'From auth to support, we prioritize stable workflows teams can trust daily.', icon: Shield },
    { title: 'Farmer-first UX', text: 'Practical interfaces shaped around real agricultural operations.', icon: Sprout },
    { title: 'Scalable architecture', text: 'Built for growth from individual users to larger farm organizations.', icon: TrendingUp },
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
          side={
            <GlassPanel>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Vision</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Build a dependable digital backbone for agriculture where users can manage operations, collaborate efficiently, and scale outcomes without workflow friction.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {milestones.map((item) => (
                  <div key={item.label} className="ops-panel !p-4">
                    <div className="text-2xl font-semibold text-primary tabular-nums">{item.year}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          }
        />

        <SectionTitle eyebrow="Principles" title="What guides our product" text="Design choices rooted in field operations, not generic SaaS patterns." />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {principles.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.text} />
          ))}
        </div>

        <StrongPanel>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <SectionTitle
                eyebrow="Platform scope"
                title="One place for farms, commerce, and support"
                text="FarmEazy connects operational data with marketplace and help desk flows so growers spend less time switching tools."
              />
            </div>
            <ScrollRail className="gap-3">
              {['Farms & crops', 'Irrigation', 'Marketplace', 'Vendor tools', 'Support desk'].map((label) => (
                <div key={label} className="ops-panel shrink-0 snap-start px-4 py-3 text-sm font-medium text-foreground">
                  {label}
                </div>
              ))}
            </ScrollRail>
          </div>
        </StrongPanel>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard icon={Compass} title="Location-aware" description="Browse products and services available in your service area." />
          <FeatureCard icon={Settings} title="Account controls" description="Preferences, communication settings, and secure sign-in flows." />
          <FeatureCard icon={Puzzle} title="Integrated support" description="FAQ, tickets, and contact options when you need help." />
        </div>
      </div>
    </div>
  )
}
