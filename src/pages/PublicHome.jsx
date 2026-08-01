import { Link } from 'react-router-dom';
import { Sprout, Droplets, ShoppingCart, Wrench, ArrowRight, BarChart3 } from 'lucide-react';
import { PillButton, FeatureCard, StrongPanel, SectionTitle } from '../components/ui/PremiumSurface';
import { PremiumHero, BentoGrid, BentoCell } from '../components/platform';

const focusAreas = [
  { title: 'Farm management', text: 'Create farms, plot fields, and track crop details from one dashboard.', icon: Sprout },
  { title: 'Irrigation planning', text: 'Schedule water cycles and monitor status without spreadsheet chaos.', icon: Droplets },
  { title: 'Marketplace', text: 'Publish products and connect with buyers in your service area.', icon: ShoppingCart },
  { title: 'Service booking', text: 'Request labor, equipment, and consulting with clear workflows.', icon: Wrench },
];

const steps = [
  { label: 'Start here', title: 'Create an account', description: 'Secure signup with email verification and OTP options.' },
  { label: 'Next step', title: 'Select your location', description: 'Browse marketplace and services available near your fields.' },
  { label: 'Stay supported', title: 'Get help when needed', description: 'FAQ, tickets, and in-app support keep you productive.' },
];

export default function PublicHome() {
  return (
    <main className="space-y-12">
      <PremiumHero
        eyebrow="Farm operations platform"
        title="Manage farms, crops, irrigation, and marketplace from one place."
        description="FarmEazy helps growers and sellers run daily operations with location-aware tools, clear onboarding, and support built in."
        actions={
          <>
            <PillButton to="/register" active>Get started</PillButton>
            <PillButton to="/public-services">Explore platform</PillButton>
          </>
        }
        media={
          <div className="fe-surface fe-gradient-border p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Operations snapshot</span>
              <span className="text-muted-foreground">Live sync</span>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-semibold text-foreground tabular-nums">3 workflows</p>
                <p className="text-sm text-muted-foreground">Farm, marketplace, support</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/70 p-3 bg-background/50">
                <p className="text-lg font-semibold text-foreground">85%</p>
                <p className="text-muted-foreground">Schedule compliance</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3 bg-background/50">
                <p className="text-lg font-semibold text-foreground">24/7</p>
                <p className="text-muted-foreground">Support access</p>
              </div>
            </div>
          </div>
        }
      />

      <BentoGrid>
        {focusAreas.map((item) => (
          <BentoCell key={item.title} span={3} interactive className="!p-0">
            <FeatureCard icon={item.icon} title={item.title} description={item.text} className="border-0 shadow-none h-full" />
          </BentoCell>
        ))}
      </BentoGrid>

      <StrongPanel>
        <SectionTitle
          eyebrow="Public entry points"
          title="Everything you need before you sign in"
          text="Register, explore services, read policies, or contact support — all from clear public pages."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { to: '/register', label: 'Register', sub: 'Create your FarmEazy account' },
            { to: '/public-services', label: 'Services', sub: 'Marketplace and irrigation overview' },
            { to: '/faq', label: 'FAQ', sub: 'Common questions answered' },
            { to: '/contact', label: 'Contact', sub: 'Reach the team' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="fe-surface fe-surface-interactive flex items-center justify-between p-4 group"
            >
              <div>
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-sm text-muted-foreground">{link.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </StrongPanel>

      <BentoGrid>
        {steps.map((item) => (
          <BentoCell key={item.title} span={4}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{item.label}</p>
            <h3 className="mt-2 font-semibold text-foreground text-lg">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </BentoCell>
        ))}
      </BentoGrid>
    </main>
  );
}
