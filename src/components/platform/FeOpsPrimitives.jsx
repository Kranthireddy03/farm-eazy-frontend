import { cn } from '../../lib/utils';

export function FeLiveBadge({ className }) {
  return (
    <span className={cn('ops-badge ops-badge-success inline-flex items-center gap-1.5', className)}>
      <span className="ops-live-dot" aria-hidden="true" />
      Live
    </span>
  );
}

export function FeSectionTitle({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-4', className)}>
      <div>
        {title && <h2 className="ops-section-title text-foreground">{title}</h2>}
        {description && <p className="ops-section-desc">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function FePanel({ children, className, interactive = false }) {
  return (
    <div className={cn('ops-panel', interactive && 'ops-panel-interactive', className)}>
      {children}
    </div>
  );
}

export function FeChip({ active, children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn('ops-chip', active && 'ops-chip-active', className)}
      {...props}
    >
      {children}
    </button>
  );
}
