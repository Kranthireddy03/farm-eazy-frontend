import { useLocationContext } from '../context/LocationContext';
import { MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LocationBar() {
  const { selectedLocationLabel, hasSelectedLocation, openSelector } = useLocationContext();

  return (
    <div className="border-b border-border/70 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <button
          type="button"
          onClick={openSelector}
          className={cn(
            'w-full flex items-center justify-between gap-3 ops-panel !p-3 text-left text-sm transition-colors hover:border-primary/30',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Service location</p>
              <p className="truncate font-medium text-foreground">
                {hasSelectedLocation ? selectedLocationLabel : 'Select location to browse marketplace & services'}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary shrink-0">Change</span>
        </button>
      </div>
    </div>
  );
}
