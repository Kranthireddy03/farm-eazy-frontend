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
  const completion = Math.round((
    Number(Boolean(form.title.trim())) +
    Number(Boolean(form.excerpt.trim())) +
    Number(Boolean(form.content.trim())) +
    Number(Boolean(form.category.trim())) +
    Number(Boolean(form.tagsInput.trim()))
  ) / 5 * 100)

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
    <div className={`premium-shell min-h-screen px-4 py-10 ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-slate-900'}`}>
      <div className="absolute inset-0 premium-grid opacity-20 pointer-events-none" />
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
      <div className={`interactive-card rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100 shadow-sm'}`}>
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

        <div className={`mt-4 rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Submission readiness</span>
            <span className={isDark ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold'}>{completion}%</span>
          </div>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <input
            value={form.authorName}
            onChange={(e) => setForm(prev => ({ ...prev, authorName: e.target.value }))}
            placeholder="Author name (optional)"
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            <input
              value={form.tagsInput}
              onChange={(e) => setForm(prev => ({ ...prev, tagsInput: e.target.value }))}
              placeholder="Tags separated by comma"
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
          <input
            value={form.coverImageUrl}
            onChange={(e) => setForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
            placeholder="Cover image URL (optional)"
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <textarea
            rows={3}
            value={form.excerpt}
            onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Short summary"
            className={`w-full px-4 py-3 rounded-xl border resize-none transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <textarea
            rows={10}
            value={form.content}
            onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your full blog here"
            className={`w-full px-4 py-3 rounded-xl border resize-y transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-60 transition-all duration-300 hover:scale-[1.01]"
          >
            {saving ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      </div>

      <aside className="space-y-5">
        <div className={`interactive-card rounded-2xl border p-5 ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Author Assistant</h2>
          <div className="mt-4 space-y-3">
            {[
              'Use actionable titles that mention crop, region, or season.',
              'Start with a practical problem and then list clear steps.',
              'Prefer short paragraphs with measurable outcomes.'
            ].map((tip) => (
              <div key={tip} className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-900/70 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                {tip}
              </div>
            ))}
          </div>
        </div>

        <div className={`interactive-card rounded-2xl border p-5 ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Submission Checklist</h3>
          <ul className={`mt-3 space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <li>Title is clear and specific</li>
            <li>Summary explains value in 2-3 lines</li>
            <li>Content includes steps or best practices</li>
            <li>Tags are relevant and searchable</li>
          </ul>
        </div>
      </aside>
      </div>
    </div>
  )
}
