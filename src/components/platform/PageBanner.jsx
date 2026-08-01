import { cn } from '../../lib/utils';

export function PageBanner({
  title,
  description,
  actions,
  className,
  variant = 'brand',
}) {
  const variantClass =
    variant === 'muted'
      ? 'border-border bg-muted/40'
      : 'border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background';

  return (
    <div
      className={cn(
        'rounded-lg border p-6 sm:p-8',
        variantClass,
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          {title && <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
