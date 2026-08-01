import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function PremiumHero({
  eyebrow,
  title,
  description,
  actions,
  media,
  stats,
  className,
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn('fe-surface-hero fe-gradient-border ops-page-hero p-6 sm:p-8 lg:p-10', className)}
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          )}
          {title && (
            <h1 className="fe-display text-3xl sm:text-4xl lg:text-[2.75rem] text-foreground leading-[1.1]">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {description}
            </p>
          )}
          {actions && <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-6 pt-4 border-t border-border/60">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {media && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0"
          >
            {media}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
