import { cn } from '../../lib/utils';
import { typography } from '../../design-system/typography';

export function SectionHeader({
  title,
  description,
  actions,
  className,
  as: Tag = 'div',
}) {
  return (
    <Tag className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1 min-w-0">
        {title && <h2 className={typography.sectionTitle}>{title}</h2>}
        {description && <p className={typography.bodyMuted}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </Tag>
  );
}
