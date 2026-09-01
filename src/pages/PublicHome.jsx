import { Link } from 'react-router-dom';
import { Sprout, Droplets, ShoppingCart, Wrench, ArrowRight } from 'lucide-react';
import { PillButton, FeatureCard, StrongPanel, SectionTitle } from '../components/ui/PremiumSurface';
import { PremiumHero, BentoGrid, BentoCell } from '../components/platform';
import { FeLiveBadge } from '../components/platform/FeOpsPrimitives';
import { useEffect, useState } from 'react';
import { getPublicStats } from '../services/publicStatsService';

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
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicStats()
      .then((data) => { if (active) setStats(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const statItems = [
    { label: 'Active farmers', value: stats?.activeFarmers },
    { label: 'Farms managed', value: stats?.farms },
    { label: 'States covered', value: stats?.states },
    { label: 'Products sold', value: stats?.products },
  ];

  return (
    <main className="space-y-12">
      <PremiumHero
        eyebrow="Farm operations platform"
        title="Manage farms, crops, irrigation, and marketplace from one place."
        description="FarmEazy helps growers and sellers run daily operations with location-aware tools, clear onboarding, and support built in."
        actions={
          <>
            <PillButton to="/register" active>Get started</PillButton>
            <PillButton to="/coverage">Active Zones</PillButton>
            <PillButton to="/public-services">Explore platform</PillButton>
          </>
        }
        media={
          <div className="ops-panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="ops-section-title text-foreground">Platform reach</span>
              <FeLiveBadge />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {item.value ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <BentoGrid>
        {focusAreas.map((item) => (
          <BentoCell key={item.title} span={3} interactive className="!p-0">
            <FeatureCard icon={item.icon} title={item.title} description={item.text} className="border-0 shadow-none h-full bg-transparent" />
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
              className="ops-panel ops-panel-interactive flex items-center justify-between p-4 group"
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
