import { cn } from '../../lib/utils';

export function HeroSection({
  title,
  description,
  actions,
  media,
  className,
}) {
  return (
    <section
      className={cn(
        'grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center rounded-lg border border-border bg-card p-6 sm:p-10',
        className,
      )}
    >
      <div className="space-y-4">
        {title && <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>}
        {description && <p className="text-muted-foreground leading-relaxed max-w-xl">{description}</p>}
        {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
      </div>
      {media && <div className="min-w-0">{media}</div>}
    </section>
  );
}
