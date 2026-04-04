import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import AdminBlogService from '../../services/AdminBlogService'

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tagsInput: '',
  coverImageUrl: '',
  authorName: '',
  status: 'DRAFT',
}

function normalizeForm(form) {
  return {
    title: form.title.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    category: form.category.trim(),
    tags: form.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean),
    coverImageUrl: form.coverImageUrl.trim(),
    authorName: form.authorName.trim(),
    status: form.status,
  }
}

export default function AdminBlogManagement() {
  const { isDark } = useTheme()
  const { isAdmin, getUserName } = useAuth()
  const { toast, showToast, closeToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, authorName: getUserName() || '' })

  const selectedPost = useMemo(
    () => posts.find(item => item.id === selectedPostId) || null,
    [posts, selectedPostId]
  )

  const visiblePosts = useMemo(() => {
    if (filter === 'ALL') return posts
    return posts.filter(item => (item.status || 'DRAFT') === filter)
  }, [posts, filter])

  const postStats = useMemo(() => ({
    total: posts.length,
    draft: posts.filter(item => (item.status || 'DRAFT') === 'DRAFT').length,
    pending: posts.filter(item => item.status === 'PENDING_APPROVAL').length,
    published: posts.filter(item => item.status === 'PUBLISHED').length,
  }), [posts])

  const surfaceClass = isDark
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-100 shadow-sm'

  const fieldClass = isDark
    ? 'w-full px-3 py-2 rounded-lg border bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'
    : 'w-full px-3 py-2 rounded-lg border bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const statusBadgeClass = (status) => {
    if (status === 'PUBLISHED') return 'bg-emerald-600 text-white'
    if (status === 'PENDING_APPROVAL') return isDark ? 'bg-indigo-900/60 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
    if (status === 'ARCHIVED') return isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
    return isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
  }

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
    return <div className="p-8 text-center text-red-600">Access denied</div>
  }

  return (
    <div className="p-4 md:p-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Admin Blog Management
          </h1>
          <p className={`mt-2 text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Create drafts, submit for approval, and publish only approved blogs to public users.
          </p>
          <div className={`mt-3 rounded-xl border p-3 text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-emerald-50 border-emerald-100 text-slate-700'}`}>
            Workflow: Draft -&gt; Pending Approval -&gt; Approved (Published). Only approved posts are displayed on the public blog page.
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Posts</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{postStats.total}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Draft</p>
              <p className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{postStats.draft}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending</p>
              <p className={`text-xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{postStats.pending}</p>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Published</p>
              <p className={`text-xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{postStats.published}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className={`xl:col-span-2 rounded-2xl border p-4 md:p-6 ${surfaceClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Published Flow</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`w-full sm:w-auto px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                <option value="ALL">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : visiblePosts.length === 0 ? (
              <p className={`mt-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No posts found for selected filter.</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {visiblePosts.map((post) => (
                  <article key={post.id} className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-base line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClass(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm line-clamp-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{post.excerpt}</p>
                    <div className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {post.category || 'General'} • {post.authorName || 'Admin'} • {post.source || 'ADMIN_PORTAL'}
                    </div>
                    <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Rating: {post.averageRating > 0 ? `${post.averageRating}/5` : 'No ratings yet'} ({post.ratingCount || 0})
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button onClick={() => startEdit(post)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white">Edit</button>
                      {post.status === 'DRAFT' && (
                        <button onClick={() => handleSubmitApproval(post.id)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                          Submit Approval
                        </button>
                      )}
                      {post.status === 'PENDING_APPROVAL' && (
                        <button onClick={() => handleApprove(post.id)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                          Approve & Publish
                        </button>
                      )}
                      {post.status === 'PUBLISHED' && (
                        <button onClick={() => handlePublishToggle(post)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white">
                          Unpublish
                        </button>
                      )}
                      {post.status === 'ARCHIVED' && (
                        <button onClick={() => startEdit(post)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-600 hover:bg-slate-700 text-white">
                          Review
                        </button>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`rounded-2xl border p-4 md:p-6 ${surfaceClass}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedPost ? 'Edit Post' : 'Create Post'}
              </h2>
              {selectedPost && (
                <button onClick={resetForm} className={`text-xs px-2 py-1 rounded-md border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-700'}`}>
                  New Post
                </button>
              )}
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Blog title (e.g. 7 Irrigation Mistakes Farmers Should Avoid This Summer)"
                className={fieldClass}
              />
              <input
                value={form.authorName}
                onChange={(e) => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author display name (e.g. FarmEazy Agronomy Team)"
                className={fieldClass}
              />
              <input
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category (e.g. Crop Advisory, Irrigation, Market Insights)"
                className={fieldClass}
              />
              <input
                value={form.tagsInput}
                onChange={(e) => setForm(prev => ({ ...prev, tagsInput: e.target.value }))}
                placeholder="Tags separated by comma (e.g. drip, water-saving, kharif)"
                className={fieldClass}
              />
              <input
                value={form.coverImageUrl}
                onChange={(e) => setForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="Cover image URL (optional, recommended 16:9 image)"
                className={fieldClass}
              />
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Write a clear 2-3 line summary so farmers quickly understand why this blog is useful."
                className={`${fieldClass} resize-none`}
              />
              <textarea
                rows={8}
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write full content with practical steps, local context, clear headings, and farmer-friendly language."
                className={`${fieldClass} resize-y`}
              />

              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className={fieldClass}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>

              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tip: Use Draft while writing, then set Pending Approval. Approved posts are published to the public blog.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : selectedPost ? 'Update Blog Post' : 'Create Blog Post'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
