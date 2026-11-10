import { Link } from 'react-router-dom';
import {
  Sprout, Droplets, ShoppingCart, Wrench, ArrowRight,
  MapPin, ShieldCheck, Languages, Headphones, CheckCircle2,
  TrendingUp, Activity, Sparkles, Compass, Shield, Zap
} from 'lucide-react';
import { PillButton, FeatureCard, StrongPanel, SectionTitle } from '../components/ui/PremiumSurface';
import { PremiumHero, BentoGrid, BentoCell } from '../components/platform';
import { FeLiveBadge } from '../components/platform/FeOpsPrimitives';
import { useEffect, useState } from 'react';
import { getPublicStats } from '../services/publicStatsService';

const focusAreas = [
  {
    title: 'Precision Farm Management',
    text: 'Plot field boundaries, track crop phenology from sowing to harvest, and monitor soil health data from a unified command dashboard.',
    icon: Sprout,
    badge: 'Operations',
    bullets: ['Field polygon mapping', 'Multi-crop life cycle tracking', 'Expense & yield analytics'],
  },
  {
    title: 'Smart Water & Irrigation',
    text: 'Schedule automated water cycles, monitor telemetry from soil moisture sensors, and prevent drought stress without spreadsheet chaos.',
    icon: Droplets,
    badge: 'Automation',
    bullets: ['Automated pump schedules', 'Sensor threshold triggers', 'Water conservation logs'],
  },
  {
    title: 'Direct Agri Marketplace',
    text: 'Publish harvest lots, connect with verified buyers across active zones, and secure guaranteed bank escrow payouts on every order.',
    icon: ShoppingCart,
    badge: 'Commerce',
    bullets: ['Direct farm-to-buyer sales', 'Transparent mandi prices', 'Instant coin cashback'],
  },
  {
    title: 'Equipment & Labor Booking',
    text: 'Request tractors, harvesters, drone sprayers, and skilled agricultural labor on-demand with transparent hourly and per-acre pricing.',
    icon: Wrench,
    badge: 'Services',
    bullets: ['Heavy machinery rentals', 'Vetted field operators', 'Flexible driver options'],
  },
];

const bentoHighlights = [
  {
    title: 'Hyper-Local Zone Intelligence',
    subtitle: 'Location-Aware',
    description: 'Dynamic pincode routing, regional weather alerts, and crop suitability recommendations tailored to your exact fields.',
    icon: MapPin,
    accent: 'emerald',
  },
  {
    title: 'Escrow-Grade Financial Security',
    subtitle: 'KYC & Ledger',
    description: 'Automated bank account validation, tamper-evident transaction logs, and Razorpay escrow settlement for buyers & vendors.',
    icon: ShieldCheck,
    accent: 'blue',
  },
  {
    title: 'Native Multilingual Accessibility',
    subtitle: 'Regional Languages',
    description: 'Full interface localization in English, Telugu (తెలుగు), Kannada (ಕನ್ನಡ), and Hindi (हिन्दी) built for Indian farmers.',
    icon: Languages,
    accent: 'amber',
  },
  {
    title: '24/7 Dedicated Field & Live Support',
    subtitle: 'Real-Time Help',
    description: 'Integrated ticket workflows, real-time live chat with agronomists, and an extensive knowledge base keeping you productive.',
    icon: Headphones,
    accent: 'purple',
  },
];

const steps = [
  {
    step: '01',
    label: 'Start Here',
    title: 'Create Your Farm Profile',
    description: 'Fast, secure onboarding with phone OTP or email. Set your farm name, location, and primary crop categories.',
  },
  {
    step: '02',
    label: 'Next Step',
    title: 'Select Operating Zone',
    description: 'Pinpoint delivery zones, check local produce demand, and explore certified machinery available near your fields.',
  },
  {
    step: '03',
    label: 'Operate & Grow',
    title: 'Automate, Trade & Scale',
    description: 'Manage automated irrigation cycles, list harvest products on the marketplace, and track payouts in real-time.',
  },
];

export default function PublicHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const statItems = [
    { label: 'Active Farmers', value: stats?.activeFarmers ? `${stats.activeFarmers.toLocaleString()}+` : '12,800+' },
    { label: 'Farms Managed', value: stats?.farms ? `${stats.farms.toLocaleString()}+` : '48,500+' },
    { label: 'States Covered', value: stats?.states ? `${stats.states}` : '18+' },
    { label: 'Marketplace Volume', value: stats?.products ? `${stats.products.toLocaleString()}+` : '₹4.8 Cr+' },
  ];

  return (
    <main className="space-y-16 md:space-y-20 pb-12">
      {/* Reframed Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/90 via-card/50 to-background/90 p-6 sm:p-10 lg:p-12 shadow-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -z-10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Hero Left Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Farm Operations Platform · Active across 18+ States</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              Manage farms, crops, irrigation, and marketplace from{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                one place.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              FarmEazy empowers growers, agricultural vendors, and agribusinesses with location-aware field plotting, automated water scheduling, direct commodity trading, and on-demand machinery support.
            </p>

            {/* Well-proportioned Hero CTA buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-2 whitespace-nowrap"
              >
                <span>Get started free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/coverage"
                className="h-11 px-5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted font-semibold text-sm text-foreground transition-all inline-flex items-center gap-2 whitespace-nowrap shadow-xs"
              >
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>Active Zones</span>
              </Link>
              <Link
                to="/public-services"
                className="h-11 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Explore platform</span>
              </Link>
            </div>

            {/* Trust feature pills */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Verified Bank Escrow
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Zero Commission on First 10 Lots
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Real-Time Agronomist Support
              </span>
            </div>
          </div>

          {/* Hero Right Column: Platform Reach & Real-time Metrics Card */}
          <div className="rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-foreground text-sm">Platform Live Metrics</h3>
                  <p className="text-[11px] text-muted-foreground">Aggregated across active agricultural clusters</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {statItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors group"
                >
                  <p className="text-2xl font-extrabold tabular-nums text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Live Indicators */}
            <div className="rounded-xl bg-muted/30 p-3.5 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">IoT Sensor Network</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Zap className="h-3 w-3" /> 99.8% Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Marketplace Settlements</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">T+1 Daily Payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The 4 Core Operational Pillars */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Core Capabilities</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
              Everything Needed to Run Modern Farmland
            </h2>
          </div>
          <Link
            to="/public-services"
            className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View detailed platform specs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {focusAreas.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-lg transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                    {item.text}
                  </p>
                </div>

                <ul className="space-y-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Technology & Platform Advantages (Bento Grid) */}
      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Why FarmEazy</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Engineered for Ground-Level Agricultural Realities
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bentoHighlights.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between hover:border-border transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {h.subtitle}
                  </p>
                  <h3 className="font-bold text-base text-foreground">
                    {h.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {h.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: 3-Step Guided Journey */}
      <section className="rounded-3xl border border-border/70 bg-muted/20 p-8 sm:p-10 lg:p-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Simple Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            How FarmEazy Works in 3 Clear Steps
          </h2>
          <p className="text-sm text-muted-foreground">
            Get up and running with your digital farm records in under ten minutes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((st) => (
            <div
              key={st.step}
              className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 relative overflow-hidden"
            >
              <div className="text-4xl font-black text-muted-foreground/20 font-mono">
                {st.step}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {st.label}
              </p>
              <h3 className="font-bold text-lg text-foreground">{st.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {st.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Public Exploration Hub */}
      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Open Exploration</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Explore FarmEazy Before You Sign In
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Access public marketplace catalogues, verify delivery zones, browse FAQs, or speak with our agronomists.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/register', label: 'Farmer Registration', sub: 'Create your account with zero setup fees', icon: Sprout },
            { to: '/coverage', label: 'Serviceable Zones', sub: 'Explore active delivery corridors & pincodes', icon: MapPin },
            { to: '/public-services', label: 'Services & Marketplace', sub: 'Browse equipment, labor & produce', icon: ShoppingCart },
            { to: '/faq', label: 'Knowledge Base', sub: 'Helpful answers on payments, orders & irrigation', icon: Headphones },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-2xl border border-border/70 bg-card p-5 flex items-center justify-between hover:border-emerald-500/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.sub}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Section 5: High-Converting Bottom CTA Card */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-card p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Get Started Today</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Modernize Your Farmland Operations?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed">
            Join thousands of growers, agricultural equipment operators, and mandi traders managing their day-to-day operations seamlessly on FarmEazy.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all inline-flex items-center gap-2 whitespace-nowrap"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="h-11 px-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-sm text-white transition-all inline-flex items-center whitespace-nowrap"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
      </section>
    </main>
  );
}
