import { cn } from '../../lib/utils';

/**
 * Secondary row below PageHeader: filters, search chips, export, view toggles.
 */
export function PageToolbar({ children, className, sticky = false }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        'rounded-lg border border-border bg-card/50 p-3 shadow-xs',
        sticky && 'sticky top-14 z-30 backdrop-blur supports-[backdrop-filter]:bg-card/90',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageToolbarGroup({ children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}
