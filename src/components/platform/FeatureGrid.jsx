import { cn } from '../../lib/utils';

export function FeatureGrid({ children, className, columns = 3 }) {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={cn('grid grid-cols-1 gap-4', colClass, className)}>
      {children}
    </div>
  );
}

export function FeatureGridItem({ icon: Icon, title, description, className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-5 space-y-2 transition-shadow hover:shadow-sm', className)}>
      {Icon && <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />}
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  );
}
