import { PageHeader } from '../ui/page-header';

/**
 * Standard authenticated page wrapper — consistent spacing and optional header.
 */
export default function AppPage({ title, description, actions, children, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description) && (
        <PageHeader title={title} description={description} actions={actions} />
      )}
      {children}
    </div>
  );
}
