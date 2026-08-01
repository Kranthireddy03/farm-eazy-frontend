import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export function KpiCard({ title, value, hint, icon: Icon, trend, className, action }) {
  return (
    <Card className={cn('fe-surface hover:shadow-lg transition-all duration-300', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {(hint || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && <span className="text-foreground font-medium">{trend} </span>}
            {hint}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  );
}
