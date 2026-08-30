import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

/**
 * Standard elevated surface — hover lift optional.
 */
export function AppCard({
  children,
  className,
  hover = false,
  padding = 'default',
  ...props
}) {
  const paddingClass = padding === 'none' ? 'p-0' : padding === 'sm' ? 'p-4' : 'p-6';

  return (
    <Card
      className={cn(
        paddingClass,
        hover && 'transition-shadow duration-[var(--duration-normal)] hover:shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
