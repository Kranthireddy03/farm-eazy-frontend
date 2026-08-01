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
      ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20'
      : variant === 'destructive'
        ? 'border-destructive/30 bg-destructive/5'
        : variant === 'success'
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/20'
          : '';

  return (
    <Card className={cn(variantClass, className)}>
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
