import { cn } from '../../lib/utils';

/**
 * Standard two-column page body: main content + optional sticky aside.
 */
export function PageScaffold({ children, aside, className, asideClassName }) {
  if (!aside) {
    return <div className={cn('space-y-6', className)}>{children}</div>;
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      <div className="lg:col-span-2 space-y-6">{children}</div>
      <aside className={cn('space-y-6 lg:col-span-1', asideClassName)}>{aside}</aside>
    </div>
  );
}
