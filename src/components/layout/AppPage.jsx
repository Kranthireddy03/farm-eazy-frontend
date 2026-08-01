import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '../ui/page-header';
import { Breadcrumbs } from '../ui/breadcrumb';
import { getBreadcrumbs } from '../../lib/breadcrumbs';
import { cn } from '../../lib/utils';

/**
 * Enterprise page scaffold: breadcrumbs, header, consistent spacing, subtle entrance.
 */
export default function AppPage({
  title,
  description,
  actions,
  toolbar,
  meta,
  breadcrumbs,
  children,
  className,
  noMotion = false,
}) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const crumbs = breadcrumbs ?? getBreadcrumbs(location.pathname);

  const content = (
    <div className={cn('space-y-6', className)}>
      <Breadcrumbs items={crumbs} />
      {(title || description || toolbar) && (
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          toolbar={toolbar}
          meta={meta}
        />
      )}
      {children}
    </div>
  );

  if (noMotion || prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}
