import { PageSkeleton } from '../ui/Skeleton';
import BrandLoader from '../ui/brand-loader';

export default function PageLoader({ variant = 'dashboard', message }) {
  return (
    <div className="min-h-[50vh] p-4 sm:p-6">
      <BrandLoader message={message} className="py-8" />
      <div className="mt-4 opacity-60 pointer-events-none">
        <PageSkeleton variant={variant} />
      </div>
    </div>
  );
}
