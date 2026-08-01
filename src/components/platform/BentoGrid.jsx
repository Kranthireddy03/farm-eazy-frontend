import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function BentoGrid({ children, className }) {
  return (
    <div className={cn('fe-bento fe-bento-12', className)}>
      {children}
    </div>
  );
}

export function BentoCell({
  children,
  span = 4,
  className,
  interactive = false,
}) {
  const reduce = useReducedMotion();
  const spanClass =
    span === 12
      ? 'fe-span-12'
      : span === 8
        ? 'fe-span-8'
        : span === 6
          ? 'fe-span-6'
          : span === 3
            ? 'fe-span-3'
            : 'fe-span-4';

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        spanClass,
        'fe-surface p-5 sm:p-6',
        interactive && 'fe-surface-interactive cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
