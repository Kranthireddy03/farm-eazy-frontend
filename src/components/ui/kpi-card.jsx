import { cn } from '../../lib/utils';

export function KpiCard({ title, value, hint, icon: Icon, trend, className, action }) {
  return (
    <div className={cn('ops-kpi', className)}>
      <div className="flex flex-row items-start justify-between gap-2 mb-2">
        <p className="ops-kpi-label">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-primary/80 shrink-0" strokeWidth={1.75} />}
      </div>
      <div className="ops-kpi-value text-foreground">{value}</div>
      {(hint || trend) && (
        <p className="text-xs text-muted-foreground mt-1">
          {trend && <span className="text-foreground font-medium">{trend} </span>}
          {hint}
        </p>
      )}
      {action}
    </div>
  );
}
