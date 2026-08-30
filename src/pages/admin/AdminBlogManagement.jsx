import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, PenLine } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import AdminBlogService from '../../services/AdminBlogService'
import AppPage from '../../components/layout/AppPage'
import { PageScaffold } from '../../components/app/PageScaffold'
import { KpiSection } from '../../components/app/KpiSection'
import { KpiCard } from '../../components/ui/kpi-card'
import { DetailPanel } from '../../components/platform/DetailPanel'
import { InfoPanel } from '../../components/platform/InfoPanel'
import { FePanel } from '../../components/platform/FeOpsPrimitives'
import { Button, buttonVariants } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { PageSkeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tagsInput: '',
  coverImageUrl: '',
  imageUrlsText: '',
  authorName: '',
  status: 'DRAFT',
}

const FILTER_CHIPS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const STATUS_VARIANT = {
  PUBLISHED: 'success',
  PENDING_APPROVAL: 'warning',
  ARCHIVED: 'muted',
  DRAFT: 'muted',
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function normalizeForm(form) {
  return {
    title: form.title.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    category: form.category.trim(),
    tags: form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    coverImageUrl: form.coverImageUrl.trim(),
    imageUrls: form.imageUrlsText
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean),
    authorName: form.authorName.trim(),
    status: form.status,
  }
}

export default function AdminBlogManagement() {
  const { isAdmin, getUserName } = useAuth()
  const { toast, showToast, closeToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, authorName: getUserName() || '' })

  const selectedPost = useMemo(
    () => posts.find((item) => item.id === selectedPostId) || null,
    [posts, selectedPostId],
  )

  const visiblePosts = useMemo(() => {
    if (filter === 'ALL') return posts
    return posts.filter((item) => (item.status || 'DRAFT') === filter)
  }, [posts, filter])

  const postStats = useMemo(
    () => ({
      total: posts.length,
      draft: posts.filter((item) => (item.status || 'DRAFT') === 'DRAFT').length,
      pending: posts.filter((item) => item.status === 'PENDING_APPROVAL').length,
      published: posts.filter((item) => item.status === 'PUBLISHED').length,
    }),
    [posts],
  )

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await AdminBlogService.getAll()
      setPosts(data)
    } catch (_err) {
      showToast('Unable to load blog posts from server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin()) return
    loadPosts()
  }, [])

  const resetForm = () => {
    setSelectedPostId(null)
    setForm({ ...EMPTY_FORM, authorName: getUserName() || '' })
  }

  const startEdit = (post) => {
    setSelectedPostId(post.id)
    setForm({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      tagsInput: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      coverImageUrl: post.coverImageUrl || '',
      imageUrlsText: Array.isArray(post.imageUrls) ? post.imageUrls.join('\n') : '',
      authorName: post.authorName || '',
      status: post.status || 'DRAFT',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = normalizeForm(form)

    if (!payload.title || !payload.excerpt || !payload.content || !payload.authorName) {
      showToast('Title, excerpt, content, and author are required.', 'error')
      return
    }

    if (!payload.coverImageUrl && payload.imageUrls.length === 0) {
      showToast('Please add at least one image URL.', 'error')
      return
    }

    try {
      setSaving(true)
      if (selectedPostId) {
        await AdminBlogService.update(selectedPostId, payload)
        showToast('Blog post updated successfully.', 'success')
      } else {
        await AdminBlogService.create(payload)
        showToast('Blog draft created successfully.', 'success')
      }
      await loadPosts()
      resetForm()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save blog post.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishToggle = async (post) => {
    try {
      if (post.status === 'PUBLISHED') {
        await AdminBlogService.unpublish(post.id)
        showToast('Post moved back to draft and removed from public view.', 'info')
      }
      await loadPosts()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to change post status.', 'error')
    }
  }

  const handleSubmitApproval = async (postId) => {
    try {
      await AdminBlogService.submitApproval(postId)
      showToast('Post submitted for admin approval.', 'success')
      await loadPosts()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit for approval.', 'error')
    }
  }

  const handleApprove = async (postId) => {
    try {
      await AdminBlogService.approve(postId)
      showToast('Post approved and published to public blog.', 'success')
      await loadPosts()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve blog post.', 'error')
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this blog post permanently?')) return
    try {
      await AdminBlogService.remove(postId)
      showToast('Blog post deleted.', 'success')
      if (selectedPostId === postId) {
        resetForm()
      }
      await loadPosts()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete blog post.', 'error')
    }
  }

  if (!isAdmin()) {
    return (
      <AppPage title="Blog management" description="Admin access required.">
        <InfoPanel variant="destructive" title="Access denied" description="You do not have permission to manage blog posts." />
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Admin blog management"
      description="Create drafts, submit for approval, and publish approved blogs to the public site."
      actions={
        <Link to="/blog" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          View public blog
        </Link>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <div className="space-y-6">
        <InfoPanel
          title="Publishing workflow"
          description="Draft → Pending approval → Published. Only approved posts appear on the public blog page."
        />

        <KpiSection>
          <KpiCard title="Total posts" value={postStats.total} icon={FileText} />
          <KpiCard title="Draft" value={postStats.draft} hint="In progress" />
          <KpiCard title="Pending" value={postStats.pending} hint="Awaiting review" />
          <KpiCard title="Published" value={postStats.published} hint="Live on blog" />
        </KpiSection>

        <PageScaffold
          main={
            <DetailPanel
              title="Post library"
              description="Filter by status and manage the approval pipeline."
            >
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setFilter(chip.value)}
                    className={cn('ops-chip', filter === chip.value && 'ops-chip-active')}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <PageSkeleton variant="cards" className="mt-4" />
              ) : visiblePosts.length === 0 ? (
                <EmptyState
                  icon={PenLine}
                  title="No posts for this filter"
                  description="Create a draft or switch to another status filter."
                  className="mt-4"
                />
              ) : (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visiblePosts.map((post) => (
                    <FePanel key={post.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base line-clamp-2 text-foreground">{post.title}</h3>
                        <Badge variant={STATUS_VARIANT[post.status] || 'muted'}>{post.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      <div className="text-xs text-muted-foreground">
                        {post.category || 'General'} • {post.authorName || 'Admin'} • {post.source || 'ADMIN_PORTAL'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rating: {post.averageRating > 0 ? `${post.averageRating}/5` : 'No ratings yet'} ({post.ratingCount || 0})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(post)}>
                          Edit
                        </Button>
                        {post.status === 'DRAFT' && (
                          <Button type="button" size="sm" onClick={() => handleSubmitApproval(post.id)}>
                            Submit approval
                          </Button>
                        )}
                        {post.status === 'PENDING_APPROVAL' && (
                          <Button type="button" size="sm" onClick={() => handleApprove(post.id)}>
                            Approve & publish
                          </Button>
                        )}
                        {post.status === 'PUBLISHED' && (
                          <Button type="button" size="sm" variant="outline" onClick={() => handlePublishToggle(post)}>
                            Unpublish
                          </Button>
                        )}
                        {post.status === 'ARCHIVED' && (
                          <Button type="button" size="sm" variant="outline" onClick={() => startEdit(post)}>
                            Review
                          </Button>
                        )}
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                          Delete
                        </Button>
                      </div>
                    </FePanel>
                  ))}
                </div>
              )}
            </DetailPanel>
          }
          aside={
            <DetailPanel
              title={selectedPost ? 'Edit post' : 'Create post'}
              description={selectedPost ? 'Update content and workflow status.' : 'Start a new admin-authored article.'}
              actions={
                selectedPost ? (
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                    New post
                  </Button>
                ) : null
              }
            >
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Blog title"
                />
                <Input
                  value={form.authorName}
                  onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
                  placeholder="Author display name"
                />
                <Input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Category"
                />
                <Input
                  value={form.tagsInput}
                  onChange={(e) => setForm((prev) => ({ ...prev, tagsInput: e.target.value }))}
                  placeholder="Tags (comma separated)"
                />
                <Input
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                  placeholder="Cover image URL"
                />
                <textarea
                  rows={3}
                  value={form.imageUrlsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                  placeholder="Additional image URLs (one per line or comma separated)"
                  className={cn(selectClass, 'min-h-[80px] py-2 resize-none')}
                />
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short summary for farmers"
                  className={cn(selectClass, 'min-h-[80px] py-2 resize-none')}
                />
                <textarea
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Full article content"
                  className={cn(selectClass, 'min-h-[160px] py-2 resize-y')}
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className={selectClass}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Use Draft while writing, then Pending Approval. Approved posts are published to the public blog.
                </p>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Saving…' : selectedPost ? 'Update blog post' : 'Create blog post'}
                </Button>
              </form>
            </DetailPanel>
          }
        />
      </div>
    </AppPage>
  )
}
