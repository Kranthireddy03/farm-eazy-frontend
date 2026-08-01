import { Tractor, Droplets, Sprout, BarChart3, ShoppingCart, Warehouse } from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { FeatureCard, GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface';

export default function Services() {
  const services = [
    { icon: Tractor, title: 'Equipment rental', description: 'Rent tractors, harvesters, and other farming equipment at affordable prices.' },
    { icon: Droplets, title: 'Irrigation services', description: 'Smart irrigation scheduling and water management for optimal crop growth.' },
    { icon: Sprout, title: 'Crop management', description: 'Expert guidance on crop selection, planting schedules, and harvest optimization.' },
    { icon: BarChart3, title: 'Farm analytics', description: 'Data-driven insights to improve yield and reduce costs across your farms.' },
    { icon: ShoppingCart, title: 'Marketplace', description: 'Buy and sell agricultural products directly with other farmers and buyers.' },
    { icon: Warehouse, title: 'Storage solutions', description: 'Secure cold storage and warehouse facilities for your harvested produce.' },
  ];

  const serviceNotes = [
    'All services keep their original destinations and links.',
    'Browse by category with a consistent premium layout.',
    'Vendor transparency remains visible where present.',
  ];

  return (
    <AppPage noMotion title="Services" description="Smart farming services to grow efficiently and profitably.">
    <div className="py-2 px-0">
      <div className="max-w-7xl mx-auto space-y-8">
        <HeroFrame
          eyebrow="Services"
          title="Our services"
          description="Explore smart farming services designed to help you grow more efficiently and profitably."
          actions={
            <>
              <PillButton to="/irrigation-services" active>Browse irrigation services</PillButton>
              <PillButton to="/buying">Visit marketplace</PillButton>
            </>
          }
          side={
            <GlassPanel>
              <SectionTitle eyebrow="Service catalog" title="Destinations and data flow are unchanged" />
              <div className="mt-5 space-y-3">
                {serviceNotes.map((note) => (
                  <div key={note} className="ops-panel !p-3 text-sm text-muted-foreground">
                    {note}
                  </div>
                ))}
              </div>
            </GlassPanel>
          }
        />

        <section className="grid lg:grid-cols-2 gap-6 items-start">
          <StrongPanel>
            <SectionTitle
              eyebrow="Service stack"
              title="A layered set of actions for real farm execution"
              text="Each card surfaces one part of the farm journey with clear visual hierarchy."
            />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 4).map((service) => (
                <FeatureCard key={service.title} icon={service.icon} title={service.title} description={service.description} />
              ))}
            </div>
          </StrongPanel>

          <GlassPanel>
            <SectionTitle eyebrow="Full catalog" title="Every service category" text="Browse all service types available on FarmEazy." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <FeatureCard key={service.title} icon={service.icon} title={service.title} description={service.description} />
              ))}
            </div>
          </GlassPanel>
        </section>

        <GlassPanel className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">Ready to get started?</h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            Join farmers using FarmEazy to streamline their operations.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <PillButton to="/irrigation-services" active>Browse irrigation services</PillButton>
            <PillButton to="/buying">Visit marketplace</PillButton>
          </div>
        </GlassPanel>
      </div>
    </div>
    </AppPage>
  );
}
