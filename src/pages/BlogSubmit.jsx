import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import { submitUserBlogPost } from '../services/BlogService'

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tagsInput: '',
  coverImageUrl: '',
  authorName: '',
}

export default function BlogSubmit() {
  const { isDark } = useTheme()
  const { toast, showToast, closeToast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const onSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim(),
      tags: form.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl.trim(),
      authorName: form.authorName.trim(),
    }

    if (!payload.title || !payload.excerpt || !payload.content) {
      showToast('Title, excerpt, and content are required.', 'error')
      return
    }

    try {
      setSaving(true)
      await submitUserBlogPost(payload)
      showToast('Your blog was submitted for admin review and approval.', 'success')
      setForm(EMPTY_FORM)
      setTimeout(() => navigate('/blog'), 1000)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to submit blog right now.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen px-4 py-10 ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-slate-900'}`}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <div className={`max-w-3xl mx-auto rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-3">
          <h1 className={`text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-emerald-900'}`}>
            Write a Blog for FarmEazy
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/blog/my-submissions" className={`text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              My Submissions
            </Link>
            <Link to="/blog" className={`text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              Back to Blog
            </Link>
          </div>
        </div>

        <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Share practical farming knowledge. Your article will be reviewed by admin and then published.
        </p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <input
            value={form.authorName}
            onChange={(e) => setForm(prev => ({ ...prev, authorName: e.target.value }))}
            placeholder="Author name (optional)"
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <input
            value={form.category}
            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Category"
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <input
            value={form.tagsInput}
            onChange={(e) => setForm(prev => ({ ...prev, tagsInput: e.target.value }))}
            placeholder="Tags separated by comma"
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <input
            value={form.coverImageUrl}
            onChange={(e) => setForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
            placeholder="Cover image URL (optional)"
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <textarea
            rows={3}
            value={form.excerpt}
            onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Short summary"
            className={`w-full px-3 py-2 rounded-lg border resize-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <textarea
            rows={10}
            value={form.content}
            onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your full blog here"
            className={`w-full px-3 py-2 rounded-lg border resize-y ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
