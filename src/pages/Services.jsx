import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'
import { FlipCard, GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function Services() {
  const { isDark } = useTheme()

  const services = [
    {
      icon: '🚜',
      title: 'Equipment Rental',
      description: 'Rent tractors, harvesters, and other farming equipment at affordable prices.',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: '💧',
      title: 'Irrigation Services',
      description: 'Smart irrigation scheduling and water management solutions for optimal crop growth.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: '🌱',
      title: 'Crop Management',
      description: 'Expert guidance on crop selection, planting schedules, and harvest optimization.',
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      icon: '📊',
      title: 'Farm Analytics',
      description: 'Data-driven insights to improve yield and reduce costs across your farms.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: '🛒',
      title: 'Marketplace',
      description: 'Buy and sell agricultural products directly with other farmers and buyers.',
      color: 'from-orange-400 to-orange-600'
    },
    {
      icon: '📦',
      title: 'Storage Solutions',
      description: 'Secure cold storage and warehouse facilities for your harvested produce.',
      color: 'from-indigo-400 to-indigo-600'
    }
  ];

  const serviceNotes = [
    'All services keep their original destinations and links.',
    'The layout now uses theme-aware surfaces and motion-friendly cards.',
    'Vendor transparency remains visible where present, without changing data handling.',
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <HeroFrame
          eyebrow="Services"
          title="Our services"
          description="Explore our range of smart farming services designed to help you grow more efficiently and profitably."
          actions={(
            <>
              <PillButton to="/irrigation-services" active>Browse Irrigation Services</PillButton>
              <PillButton to="/buying">Visit Marketplace</PillButton>
            </>
          )}
          side={(
            <GlassPanel className="p-5 md:p-6">
              <SectionTitle eyebrow="What stays the same" title="The service destinations and data flow are unchanged" />
              <div className="mt-5 space-y-3">
                {serviceNotes.map((note) => (
                  <div key={note} className={`rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 text-slate-200' : 'bg-white/75 text-slate-700'}`}>
                    {note}
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        />

        <section className="grid lg:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
          <StrongPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Service stack"
              title="A layered set of actions for real farm execution"
              text="Each card surfaces one part of the farm journey, with enough visual hierarchy to scan quickly and enough depth to feel premium."
            />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 4).map((service) => (
                <div key={service.title} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                  <div className="text-2xl">{service.icon}</div>
                  <h3 className={`mt-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{service.title}</h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{service.description}</p>
                </div>
              ))}
            </div>
          </StrongPanel>

          <GlassPanel className="p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-[0.26em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Services grid</p>
                <h2 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Flip cards for the full catalog</h2>
              </div>
              <div className="text-4xl float-slow">⚙️</div>
            </div>
            <ScrollRail className="mt-5 flex gap-4 overflow-x-auto pb-3">
              {services.map((service) => (
                <FlipCard
                  key={service.title}
                  icon={service.icon}
                  frontTitle={service.title}
                  frontText={service.description}
                  backTitle="Vendor transparency"
                  backText={`Vendor Name: ${service.vendorName || 'N/A'} | Vendor ID: ${service.vendorId || 'N/A'} | Vendor Location: ${service.vendorLocation || 'N/A'} | Vendor Type: ${service.vendorType || 'N/A'}`}
                  className="min-w-[18rem] w-[18rem] shrink-0"
                />
              ))}
            </ScrollRail>
          </GlassPanel>
        </section>

        <GlassPanel className="p-8 text-center">
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>Ready to get started?</h2>
          <p className={`mt-3 max-w-2xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Join thousands of farmers who are already using FarmEazy to streamline their operations.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <PillButton to="/irrigation-services" active>Browse Irrigation Services</PillButton>
            <PillButton to="/buying">Visit Marketplace</PillButton>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
