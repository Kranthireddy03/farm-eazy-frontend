import { cn } from '../../lib/utils';

export function SectionContainer({ children, className, spacing = 'default', ...props }) {
  const spacingClass = spacing === 'tight' ? 'space-y-4' : spacing === 'loose' ? 'space-y-8' : 'space-y-6';

  return (
    <section className={cn(spacingClass, className)} {...props}>
      {children}
    </section>
  );
}
