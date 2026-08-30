import { Link } from 'react-router-dom';
import { InfoPanel } from '../platform/InfoPanel';
import { SummaryPanel } from '../platform/SummaryPanel';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

export function IrrigationPageAside({ summary }) {
  return (
    <>
      {summary && (
        <SummaryPanel title="Overview">
          <dl className="space-y-3 text-sm">
            {summary.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </SummaryPanel>
      )}
      <InfoPanel
        title="Irrigation hub"
        description="Schedules, services, and sensor data work together for water planning."
      >
        <div className="flex flex-wrap gap-2 mt-3">
          <Link to="/irrigation" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Schedules
          </Link>
          <Link to="/services" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Services
          </Link>
          <Link to="/irrigation-sensors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Sensors
          </Link>
          <Link to="/farms" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Farms
          </Link>
        </div>
      </InfoPanel>
      <InfoPanel
        variant="warning"
        title="Pilot scope"
        description="Smart irrigation is enabled for Ananthapur, Andhra Pradesh and select crops: groundnut, sunflower, maize, cotton, paddy, and millet."
      />
    </>
  );
}
