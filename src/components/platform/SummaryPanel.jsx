import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function SummaryPanel({ title, description, children, className, footer }) {
  return (
    <Card className={cn('shadow-sm', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-4">{children}</CardContent>
      {footer && (
        <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground">{footer}</div>
      )}
    </Card>
  );
}
