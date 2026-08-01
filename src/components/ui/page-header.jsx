import { cn } from '../../lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  toolbar,
  meta,
  className,
}) {
  return (
    <header className={cn('space-y-4 mb-6', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1 min-w-0">
          {title && (
            <h1 className="fe-display text-2xl sm:text-3xl text-foreground leading-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
          {meta && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              {meta}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {toolbar}
    </header>
  );
}
