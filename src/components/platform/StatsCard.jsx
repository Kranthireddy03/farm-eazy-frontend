import { cn } from '../../lib/utils';
import { KpiCard } from '../ui/kpi-card';

/** KPI with optional tone for status-style metrics (success, warning, etc.). */
export function StatsCard({
  tone = 'default',
  className,
  ...props
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
      : tone === 'warning'
        ? 'border-amber-200/80 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20'
        : tone === 'danger'
          ? 'border-red-200/80 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20'
          : tone === 'info'
            ? 'border-cyan-200/80 bg-cyan-50/50 dark:border-cyan-800/40 dark:bg-cyan-950/20'
            : '';

  return <KpiCard className={cn(toneClass, className)} {...props} />;
}
