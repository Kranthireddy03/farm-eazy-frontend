import { cn } from '../../lib/utils';

const VARIANT_STYLES = {
  resilience: {
    page: 'bg-[radial-gradient(circle_at_12%_18%,#1a3d2e_0%,#0f1f18_42%,#0a1210_78%)]',
    hero: 'border-emerald-400/20 bg-black/30 backdrop-blur-xl',
    badge: 'text-emerald-300/90',
  },
  expansion: {
    page: 'bg-[radial-gradient(circle_at_88%_12%,#3d2a1a_0%,#1a1410_45%,#0c0a09_78%)]',
    hero: 'border-amber-400/25 bg-black/25 backdrop-blur-xl',
    badge: 'text-amber-300/90',
  },
  location: {
    page: 'bg-[radial-gradient(circle_at_20%_0%,#1e3a5f_0%,#0f172a_50%,#020617_85%)]',
    hero: 'border-sky-400/25 bg-black/30 backdrop-blur-xl',
    badge: 'text-sky-300/90',
  },
};

export function ExperienceAlert({ tone = 'error', children, className }) {
  const tones = {
    error: 'border-red-400/35 bg-red-950/35 text-red-100',
    success: 'border-emerald-400/35 bg-emerald-950/35 text-emerald-100',
    info: 'border-sky-400/35 bg-sky-950/35 text-sky-100',
    warning: 'border-amber-400/35 bg-amber-950/35 text-amber-100',
  };

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm leading-relaxed',
        tones[tone] || tones.error,
        className,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

export function ExperiencePageShell({
  variant = 'resilience',
  badge,
  title,
  description,
  meta,
  actions,
  aside,
  children,
  footer,
  className,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.resilience;

  return (
    <div className={cn('min-h-screen text-foreground px-4 py-6 sm:p-8', styles.page, className)}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className={cn('rounded-3xl border p-6 sm:p-8 shadow-2xl shadow-black/20', styles.hero)}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0">
              {badge && (
                <p className={cn('text-xs font-bold uppercase tracking-[0.28em]', styles.badge)}>
                  {badge}
                </p>
              )}
              {title && (
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm sm:text-base text-slate-300/90 max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
              {meta && (
                <div className="text-xs text-slate-400/90 space-y-1">{meta}</div>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
            )}
          </div>
        </header>

        <div className={cn(aside ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'space-y-6')}>
          <div className={cn(aside ? 'lg:col-span-2 space-y-6' : 'space-y-6')}>{children}</div>
          {aside && (
            <aside className="space-y-4">{aside}</aside>
          )}
        </div>

        {footer && (
          <footer className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-xs text-slate-400">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function ExperiencePanel({ title, description, children, className }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/10',
        className,
      )}
    >
      {title && <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>}
      {description && (
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">{description}</p>
      )}
      {children && <div className={cn(title || description ? 'mt-4' : '')}>{children}</div>}
    </section>
  );
}
