import { useLocationContext } from '../context/LocationContext';
import { MapPin, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

export default function LocationBar() {
  const {
    selectedLocation,
    selectedLocationLabel,
    hasSelectedLocation,
    isServiceable,
    activeZoneStatus,
    openSelector,
  } = useLocationContext();

  const zoneName = selectedLocation?.matchedZoneName || activeZoneStatus?.matchedLocationName;
  const isAvailable = hasSelectedLocation && isServiceable;

  return (
    <div className="border-b border-border/70 bg-card/60 backdrop-blur-sm shadow-sm transition-colors">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <button
          type="button"
          onClick={() => openSelector()}
          className={cn(
            'w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl text-left text-sm transition border cursor-pointer',
            isAvailable
              ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10'
              : hasSelectedLocation
              ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10'
              : 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
              isAvailable
                ? 'bg-emerald-600 text-white'
                : hasSelectedLocation
                ? 'bg-amber-600 text-white'
                : 'bg-primary text-primary-foreground',
            )}>
              {isAvailable ? (
                <MapPin className="h-4 w-4" strokeWidth={2.2} />
              ) : hasSelectedLocation ? (
                <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
              ) : (
                <MapPin className="h-4 w-4" strokeWidth={2} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Delivery Location
                </span>
                {isAvailable ? (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold uppercase border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                    🟢 Active Zone {zoneName ? `• ${zoneName}` : ''}
                  </Badge>
                ) : hasSelectedLocation ? (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold uppercase border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                    🟡 Outside Active Zone
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold uppercase border-primary/40 text-primary bg-primary/10">
                    🔴 Selection Required
                  </Badge>
                )}
              </div>

              <p className="truncate font-semibold text-xs sm:text-sm text-foreground mt-0.5">
                {hasSelectedLocation
                  ? selectedLocationLabel
                  : 'Select your location to check delivery availability and active zones'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
            <span>{hasSelectedLocation ? 'Change' : 'Set location'}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
