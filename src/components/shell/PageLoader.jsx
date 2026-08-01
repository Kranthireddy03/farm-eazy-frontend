import { PageSkeleton } from '../ui/Skeleton';

export default function PageLoader({ variant = 'dashboard' }) {
  return (
    <div className="min-h-[50vh] p-4 sm:p-6">
      <PageSkeleton variant={variant} />
    </div>
  );
}
