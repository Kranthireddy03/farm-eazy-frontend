import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function InfoPanel({
  title,
  description,
  children,
  className,
  variant = 'default',
  icon: Icon,
}) {
  const variantClass =
    variant === 'warning'
      ? 'ops-alert ops-alert-warning border-0 shadow-none'
      : variant === 'destructive'
        ? 'ops-alert ops-alert-error border-0 shadow-none'
        : variant === 'success'
          ? 'ops-alert ops-alert-success border-0 shadow-none'
          : '';

  return (
    <Card className={cn('border-0 shadow-none', variantClass, className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />}
            <div className="space-y-1">
              {title && <CardTitle className="text-base">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
