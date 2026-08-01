import { cn } from '../../lib/utils';

/**
 * Optional KPI grid below PageHeader — use with KpiCard children.
 */
export function KpiSection({ children, className, columns = 4 }) {
  const colClass =
    columns === 3
      ? 'sm:grid-cols-2 xl:grid-cols-3'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 xl:grid-cols-4';

  return (
    <section aria-label="Key metrics" className={cn('grid grid-cols-1 gap-4', colClass, className)}>
      {children}
    </section>
  );
}
