import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  PenLine,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Eye,
  Calendar,
  Tag,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { KpiSection } from '../components/app/KpiSection'
import { KpiCard } from '../components/ui/kpi-card'
import { Button, buttonVariants } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { EmptyState } from '../components/ui/empty-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { InfoPanel } from '../components/platform/InfoPanel'
import { FePanel } from '../components/platform/FeOpsPrimitives'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { getMyBlogSubmissions } from '../services/BlogService'
import RichArticleRenderer from '../components/blog/RichArticleRenderer'

const STATUS_CONFIG = {
  PUBLISHED: {
    label: 'Published Live',
    variant: 'success',
    description: 'Visible to all farmers & readers on public blog',
    icon: CheckCircle2,
  },
  PENDING_APPROVAL: {
    label: 'Under Review',
    variant: 'warning',
    description: 'Awaiting editorial review (usually 24–48 hours)',
    icon: Clock,
  },
  DRAFT: {
    label: 'Draft',
    variant: 'muted',
    description: 'Saved locally or in progress',
    icon: FileText,
  },
  ARCHIVED: {
    label: 'Archived',
    variant: 'outline',
    description: 'Removed from active circulation',
    icon: AlertCircle,
  },
  REJECTED: {
    label: 'Needs Revision',
    variant: 'destructive',
    description: 'Editorial changes requested before publishing',
    icon: AlertCircle,
  },
}

const FILTER_CHIPS = [
  { value: 'ALL', label: 'All Submissions' },
  { value: 'PENDING_APPROVAL', label: 'Under Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export default function MyBlogSubmissions() {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posts, setPosts] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPost, setPreviewPost] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getMyBlogSubmissions()
        setPosts(Array.isArray(data) ? data : [])
      } catch {
        setError('Unable to load your blog submissions at this time.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statusCounts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        const status = post.status || 'DRAFT'
        acc.ALL += 1
        if (status === 'DRAFT') acc.DRAFT += 1
        if (status === 'PENDING_APPROVAL') acc.PENDING_APPROVAL += 1
        if (status === 'PUBLISHED') acc.PUBLISHED += 1
        if (status === 'ARCHIVED') acc.ARCHIVED += 1
        return acc
      },
      { ALL: 0, DRAFT: 0, PENDING_APPROVAL: 0, PUBLISHED: 0, ARCHIVED: 0 },
    )
  }, [posts])

  const filteredPosts = useMemo(() => {
    let result = posts

    if (statusFilter !== 'ALL') {
      result = result.filter((post) => (post.status || 'DRAFT') === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }

    return result
  }, [posts, statusFilter, searchQuery])

  return (
    <AppPage
      title="My Blog Submissions"
      description="Track the status of your articles, review editorial notes, and manage your published farming insights."
      actions={
        <div className="flex items-center gap-3">
          <Link
            to="/blog"
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
          >
            ← Public Blog Feed
          </Link>
          <Link
            to="/blog/submit"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <PenLine className="w-3.5 h-3.5" />
            Write New Article
          </Link>
        </div>
      }
    >
      {loading ? (
        <PageSkeleton variant="cards" />
      ) : error ? (
        <InfoPanel variant="destructive" title="Could not load submissions" description={error} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="No blog submissions yet"
          description="Have you discovered a novel farming technique or a smart irrigation trick? Share your story with the FarmEazy grower community."
          action={
            <Link
              to="/blog/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 transition-colors text-sm"
            >
              <PenLine className="w-4 h-4" />
              Write Your First Article
            </Link>
          }
        />
      ) : (
        <>
          {/* Status KPI Metrics */}
          <KpiSection columns={4}>
            <KpiCard
              title="Total Submissions"
              value={statusCounts.ALL}
              icon={FileText}
              hint="All articles submitted"
            />
            <KpiCard
              title="Under Review"
              value={statusCounts.PENDING_APPROVAL}
              icon={Clock}
              hint="In editorial queue"
            />
            <KpiCard
              title="Published Live"
              value={statusCounts.PUBLISHED}
              icon={CheckCircle2}
              hint="Live on community blog"
            />
            <KpiCard
              title="Drafts & Saved"
              value={statusCounts.DRAFT}
              icon={PenLine}
              hint="Not yet published"
            />
          </KpiSection>

          <PageScaffold
            aside={
              <div className="space-y-6">
                <InfoPanel
                  title="Editorial Standards"
                  description="How FarmEazy reviews submissions."
                >
                  <div className="mt-3 space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      <strong>1. Agronomic Validity:</strong> Tips and fertilizer dosages are checked for safety and compliance.
                    </p>
                    <p>
                      <strong>2. Originality:</strong> We welcome firsthand grower case studies and verifiable data.
                    </p>
                    <p>
                      <strong>3. Review Window:</strong> Our editors typically approve or suggest edits within <strong>24–48 hours</strong>.
                    </p>
                  </div>
                </InfoPanel>

                <div className={cn(
                  'p-5 rounded-2xl border text-xs space-y-3',
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'
                )}>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Need Editorial Assistance?
                  </div>
                  <p className="text-muted-foreground">
                    Have questions about your pending submission or wish to update content post-publication? Contact our team at <span className="font-semibold text-emerald-600 dark:text-emerald-400">editorial@farmeazy.com</span>.
                  </p>
                </div>
              </div>
            }
          >
            {/* Search & Filter Bar */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your articles by title, category, or keywords..."
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => {
                  const count = statusCounts[chip.value] || 0
                  const active = statusFilter === chip.value
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setStatusFilter(chip.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {chip.label}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                        active ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Articles Grid */}
            {filteredPosts.length === 0 ? (
              <EmptyState
                title="No submissions match your filter"
                description={
                  searchQuery
                    ? `No articles found matching "${searchQuery}".`
                    : 'No articles in this status category.'
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('ALL')
                      setSearchQuery('')
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const status = post.status || 'DRAFT'
                  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
                  const StatusIcon = statusConf.icon

                  const coverImg =
                    post.coverImageUrl?.trim() ||
                    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'

                  return (
                    <div
                      key={post.id || post.slug}
                      className={cn(
                        'p-5 rounded-2xl border transition-all hover:shadow-md group flex flex-col sm:flex-row gap-5 items-start',
                        isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden shrink-0 border border-border/60 bg-muted relative">
                        <img
                          src={coverImg}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant={statusConf.variant} className="text-[10px] shadow-sm flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusConf.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            {post.category || 'General'}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.updatedAt || post.createdAt
                              ? new Date(post.updatedAt || post.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Recently updated'}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {post.excerpt || (post.content ? post.content.substring(0, 140) + '...' : 'No excerpt provided.')}
                        </p>

                        {/* Tags */}
                        {Array.isArray(post.tags) && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
                          {status === 'PUBLISHED' && post.slug ? (
                            <Link
                              to={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Live on Blog
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {statusConf.description}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setPreviewPost(post)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Quick Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </PageScaffold>
        </>
      )}

      {/* Quick Preview Modal */}
      {previewPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewPost(null)}
        >
          <div
            className={cn(
              'relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8',
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CONFIG[previewPost.status || 'DRAFT']?.variant || 'muted'}>
                  {STATUS_CONFIG[previewPost.status || 'DRAFT']?.label || 'Draft'}
                </Badge>
                <span className="text-xs text-muted-foreground">Article Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl font-extrabold text-foreground mb-3">
              {previewPost.title}
            </h2>

            {previewPost.coverImageUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-border/60 max-h-72">
                <img
                  src={previewPost.coverImageUrl}
                  alt={previewPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {previewPost.excerpt && (
              <div className="p-4 rounded-xl border-l-4 border-emerald-500 mb-6 bg-emerald-50/20 text-sm italic">
                {previewPost.excerpt}
              </div>
            )}

            <div className="prose prose-emerald dark:prose-invert max-w-none text-sm">
              <RichArticleRenderer content={previewPost.content || '*No content available.*'} />
            </div>

            <div className="mt-8 pt-4 border-t border-border flex justify-end">
              <Button variant="outline" onClick={() => setPreviewPost(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  )
}
