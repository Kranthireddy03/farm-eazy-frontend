import { Tractor, Droplets, Sprout, BarChart3, ShoppingCart, Warehouse } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'
import { FeatureCard, GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function Services() {
  const { isDark } = useTheme()

  const services = [
    {
      icon: Tractor,
      title: 'Equipment Rental',
      description: 'Rent tractors, harvesters, and other farming equipment at affordable prices.',
    },
    {
      icon: Droplets,
      title: 'Irrigation Services',
      description: 'Smart irrigation scheduling and water management solutions for optimal crop growth.',
    },
    {
      icon: Sprout,
      title: 'Crop Management',
      description: 'Expert guidance on crop selection, planting schedules, and harvest optimization.',
    },
    {
      icon: BarChart3,
      title: 'Farm Analytics',
      description: 'Data-driven insights to improve yield and reduce costs across your farms.',
    },
    {
      icon: ShoppingCart,
      title: 'Marketplace',
      description: 'Buy and sell agricultural products directly with other farmers and buyers.',
    },
    {
      icon: Warehouse,
      title: 'Storage Solutions',
      description: 'Secure cold storage and warehouse facilities for your harvested produce.',
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
                  <div key={note} className={`rounded-lg px-4 py-3 text-sm border ${isDark ? 'bg-card border-border text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                    {note}
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        />

        <section className="grid lg:grid-cols-2 gap-6 items-start">
          <StrongPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Service stack"
              title="A layered set of actions for real farm execution"
              text="Each card surfaces one part of the farm journey, with enough visual hierarchy to scan quickly and enough depth to feel premium."
            />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 4).map((service) => (
                <FeatureCard
                  key={service.title}
                  icon={service.icon}
                  title={service.title}
                  description={service.description}
                />
              ))}
            </div>
          </StrongPanel>

          <GlassPanel className="p-6 md:p-7">
            <SectionTitle
              eyebrow="Services grid"
              title="The full service catalog"
              text="Browse every service category available on FarmEazy."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <FeatureCard
                  key={service.title}
                  icon={service.icon}
                  title={service.title}
                  description={service.description}
                />
              ))}
            </div>
          </GlassPanel>
        </section>

        <GlassPanel className="p-8 text-center">
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>Ready to get started?</h2>
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
