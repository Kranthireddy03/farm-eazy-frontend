import { Compass, Sprout, LifeBuoy, Shield, CheckCircle2 } from 'lucide-react';
import { HeroFrame, PillButton, FeatureCard, StrongPanel, SectionTitle, ScrollRail } from '../components/ui/PremiumSurface';
import { Card, CardContent } from '../components/ui/card';

const capabilities = [
  { title: 'Farm command center', text: 'Manage crops, irrigation, and vendor operations from one dashboard.', icon: Compass },
  { title: 'Smart operations', text: 'Guided workflows for irrigation and crop lifecycles.', icon: Sprout },
  { title: 'Responsive support', text: 'Tickets and FAQ reduce confusion and keep users productive.', icon: LifeBuoy },
];

const highlights = [
  'Secure auth with OTP and password',
  'Light and dark mode',
  'FAQ and knowledge base',
  'Operational visibility across the farm lifecycle',
];

const metrics = [
  { value: '24/7', label: 'Support visibility' },
  { value: '3', label: 'Core workflows' },
  { value: '1', label: 'Unified experience' },
];

export default function LandingHome() {
  return (
    <main className="space-y-10">
      <HeroFrame
        eyebrow="Built for modern farms"
        title="Run farm operations with clarity, not clutter."
        description="FarmEazy connects field management, marketplace listings, and support in a single product experience."
        actions={
          <>
            <PillButton to="/register" active>Start free</PillButton>
            <PillButton to="/coverage">Active Zones</PillButton>
            <PillButton to="/login">Sign in</PillButton>
          </>
        }
        side={
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm font-medium text-foreground">Why teams choose FarmEazy</p>
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {capabilities.map((item) => (
          <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.text} />
        ))}
      </section>

      <StrongPanel>
        <SectionTitle eyebrow="Platform" title="Metrics that matter on the ground" />
        <ScrollRail className="mt-6">
          {metrics.map((m) => (
            <Card key={m.label} className="min-w-[140px] snap-start">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </ScrollRail>
      </StrongPanel>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Enterprise-ready security</p>
              <p className="text-sm text-muted-foreground mt-1">
                Encrypted API traffic, session management, and role-aware access.
              </p>
            </div>
          </div>
          <PillButton to="/about">Learn more</PillButton>
        </CardContent>
      </Card>
    </main>
  );
}
