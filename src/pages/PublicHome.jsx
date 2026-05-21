import React from 'react';
import { useTheme } from '../context/ThemeContext'
import { GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function PublicHome() {
  const { isDark } = useTheme()
  const steps = [
    'Create an account with secure validation',
    'Explore services and policy pages in a premium experience',
    'Open support or ask a question without leaving the flow',
  ]

  const focusAreas = [
    {
      title: 'Farm Management',
      text: 'Create and manage farms, track fields, and maintain crop records from one place.',
    },
    {
      title: 'Irrigation Scheduling',
      text: 'Plan watering cycles, view schedule status, and keep crop needs on track.',
    },
    {
      title: 'Marketplace Listings',
      text: 'Publish products, monitor availability, and connect with buyers quickly.',
    },
    {
      title: 'Service Booking',
      text: 'Offer and request agricultural services such as labor, equipment, and consultancy.',
    },
  ]

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <HeroFrame
        eyebrow="Farm Management Made Simple"
        title="Manage farms, crops, irrigation, marketplace listings, and service bookings from one platform."
        description="FarmEazy brings daily farm operations into a single dashboard for growers, sellers, and support teams. Start with a clear onboarding path and move into real workflows fast."
        actions={(
          <>
            <PillButton to="/register" active>Get Started</PillButton>
            <PillButton to="/public-services">Explore Platform</PillButton>
          </>
        )}
        side={(
          <GlassPanel className="p-5 md:p-6">
            <SectionTitle eyebrow="How it flows" title="The public journey is deliberately short" />
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className={`flex gap-3 rounded-2xl px-4 py-3 border text-sm ${index === 0 ? 'bg-emerald-500/10 border-emerald-400/30' : isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">{index + 1}</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{step}</span>
                </li>
              ))}
            </ol>
          </GlassPanel>
        )}
      />

      <section className="mt-8 grid lg:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
        <StrongPanel className="p-6 md:p-7">
          <SectionTitle
            eyebrow="Public entry points"
            title="Designed to answer questions before they become support tickets"
            text="The public surface keeps the experience lightweight while preserving clear calls to action and predictable navigation."
          />
          <div className="mt-6 grid gap-3">
            {focusAreas.map((item) => (
              <div key={item.title} className={`rounded-2xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </StrongPanel>

        <GlassPanel className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Quick access</p>
              <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>The essentials at a glance</h2>
            </div>
            <div className="text-4xl float-slow">🧪</div>
          </div>
          <ScrollRail className="mt-5 grid gap-4 md:grid-cols-3 md:overflow-visible">
            {[
              'Secure onboarding',
              'Fast support entry points',
              'Policy and disclosure pages',
            ].map((item) => (
              <div key={item} className={`rounded-2xl border p-5 font-medium ${isDark ? 'border-white/10 bg-slate-950/40 text-slate-100' : 'border-slate-200 bg-white/80 text-slate-700'}`}>
                {item}
              </div>
            ))}
          </ScrollRail>
        </GlassPanel>
      </section>
    </main>
  );
}
