import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function QuickActionTile({
  icon: Icon,
  title,
  description,
  stat,
  onClick,
  className,
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className={cn(
        'ops-panel ops-panel-interactive w-full text-left p-5 sm:p-6 group',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
        />
      </div>
      <p className="font-semibold text-foreground mt-4">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      )}
      {stat && (
        <p className="text-sm font-medium text-primary mt-3 tabular-nums">{stat}</p>
      )}
    </motion.button>
  );
}
