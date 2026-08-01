import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PenLine } from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { KpiSection } from '../components/app/KpiSection';
import { KpiCard } from '../components/ui/kpi-card';
import { Button, buttonVariants } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { InfoPanel } from '../components/platform/InfoPanel';
import { FePanel } from '../components/platform/FeOpsPrimitives';
import { cn } from '../lib/utils';
import { getMyBlogSubmissions } from '../services/BlogService';

const STATUS_STYLE = {
  DRAFT: 'muted',
  PENDING_APPROVAL: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'outline',
};

const FILTER_CHIPS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function MyBlogSubmissions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyBlogSubmissions();
        setPosts(data);
      } catch {
        setError('Unable to load your submissions right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusCounts = posts.reduce(
    (acc, post) => {
      const status = post.status || 'DRAFT';
      acc.ALL += 1;
      if (status === 'DRAFT') acc.DRAFT += 1;
      if (status === 'PENDING_APPROVAL') acc.PENDING_APPROVAL += 1;
      if (status === 'PUBLISHED') acc.PUBLISHED += 1;
      if (status === 'ARCHIVED') acc.ARCHIVED += 1;
      return acc;
    },
    { ALL: 0, DRAFT: 0, PENDING_APPROVAL: 0, PUBLISHED: 0, ARCHIVED: 0 },
  );

  const filteredPosts =
    statusFilter === 'ALL'
      ? posts
      : posts.filter((post) => (post.status || 'DRAFT') === statusFilter);

  return (
    <AppPage
      title="My blog submissions"
      description="Track review progress. Approved posts may be edited by admins before publishing."
      actions={
        <>
          <Link to="/blog" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Back to blog
          </Link>
          <Link to="/blog/submit" className={buttonVariants({ size: 'sm' })}>
            Write new post
          </Link>
        </>
      }
    >
      {loading ? (
        <PageSkeleton variant="cards" />
      ) : error ? (
        <InfoPanel variant="destructive" title="Could not load submissions" description={error} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No submissions yet"
          description="Share a farming story or practical guide with the community."
          action={
            <Link to="/blog/submit" className={buttonVariants()}>
              Start writing
            </Link>
          }
        />
      ) : (
        <>
          <KpiSection columns={4}>
            <KpiCard title="Total" value={statusCounts.ALL} icon={FileText} />
            <KpiCard title="Pending" value={statusCounts.PENDING_APPROVAL} hint="Awaiting review" />
            <KpiCard title="Published" value={statusCounts.PUBLISHED} hint="Live on blog" />
            <KpiCard title="Drafts" value={statusCounts.DRAFT} hint="Not submitted" />
          </KpiSection>

          <PageScaffold
            aside={
              <InfoPanel
                title="Review process"
                description="Submissions are reviewed by the FarmEazy editorial team."
              >
                <p className="text-sm text-muted-foreground mt-2">
                  You will see status updates here when an admin approves, requests changes, or publishes your post.
                </p>
              </InfoPanel>
            }
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  className={cn('ops-chip', statusFilter === chip.value && 'ops-chip-active')}
                  onClick={() => setStatusFilter(chip.value)}
                >
                  {chip.label} ({statusCounts[chip.value] || 0})
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <EmptyState title="No posts in this status" description="Try another filter." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPosts.map((post) => {
                  const status = post.status || 'DRAFT';
                  return (
                    <FePanel key={post.id} interactive className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-foreground">{post.title}</h2>
                        <Badge variant={STATUS_STYLE[status] || 'muted'}>
                          {status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {post.category || 'General'} • Updated{' '}
                        {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : 'recently'}
                      </p>
                      {status === 'PUBLISHED' && post.slug && (
                        <Link
                          to={`/blog/${post.slug}`}
                          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                        >
                          Open published post
                        </Link>
                      )}
                    </FePanel>
                  );
                })}
              </div>
            )}
          </PageScaffold>
        </>
      )}
    </AppPage>
  );
}
