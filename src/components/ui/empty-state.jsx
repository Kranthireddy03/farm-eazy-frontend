import { cn } from '../../lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center', className)}>
      {Icon && <Icon className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />}
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
