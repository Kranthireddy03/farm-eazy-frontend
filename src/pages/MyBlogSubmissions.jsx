import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { getMyBlogSubmissions } from '../services/BlogService'

const STATUS_STYLE = {
  DRAFT: 'bg-slate-200 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-rose-100 text-rose-700',
}

export default function MyBlogSubmissions() {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posts, setPosts] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getMyBlogSubmissions()
        setPosts(data)
      } catch (_err) {
        setError('Unable to load your submissions right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statusCounts = posts.reduce(
    (acc, post) => {
      const status = post.status || 'DRAFT'
      acc.ALL += 1
      if (status === 'DRAFT') acc.DRAFT += 1
      if (status === 'PENDING_APPROVAL') acc.PENDING_APPROVAL += 1
      if (status === 'PUBLISHED') acc.PUBLISHED += 1
      if (status === 'ARCHIVED') acc.ARCHIVED += 1
      return acc
    },
    { ALL: 0, DRAFT: 0, PENDING_APPROVAL: 0, PUBLISHED: 0, ARCHIVED: 0 }
  )

  const filteredPosts = statusFilter === 'ALL'
    ? posts
    : posts.filter((post) => (post.status || 'DRAFT') === statusFilter)

  return (
    <div className={`min-h-screen px-4 py-10 ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className={`text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-emerald-900'}`}>My Blog Submissions</h1>
          <div className="flex items-center gap-2">
            <Link to="/blog/submit" className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Write New Blog</Link>
            <Link to="/blog" className={`text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Back to Blog</Link>
          </div>
        </div>

        <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Track review progress of your submitted blog posts. Admin may edit and publish approved entries.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className={`${isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl p-4 mt-6`}>
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-emerald-100 text-emerald-700'} border rounded-xl p-6 mt-6`}>
            <p className="font-semibold">No blog submissions yet.</p>
            <p className="mt-1 text-sm opacity-90">Start by creating your first farming story or practical guide.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {[['ALL', 'All'], ['DRAFT', 'Draft'], ['PENDING_APPROVAL', 'Pending'], ['PUBLISHED', 'Published'], ['ARCHIVED', 'Archived']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    statusFilter === key
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isDark
                        ? 'border-slate-600 text-slate-300 hover:border-slate-500'
                        : 'border-emerald-200 text-emerald-800 hover:border-emerald-300'
                  }`}
                >
                  {label} ({statusCounts[key] || 0})
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <div className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-emerald-100 text-emerald-700'} border rounded-xl p-6 mt-4`}>
                <p className="font-semibold">No submissions in this status.</p>
                <p className="mt-1 text-sm opacity-90">Try another filter to review your full submission history.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {filteredPosts.map((post) => {
                  const status = post.status || 'DRAFT'
                  return (
                    <article key={post.id} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'} border rounded-xl p-4 shadow-sm`}>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.title}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-700'}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className={`mt-2 text-sm line-clamp-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.excerpt}</p>

                      <div className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {post.category || 'General'} • Updated {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : 'recently'}
                      </div>

                      {status === 'PUBLISHED' && post.slug && (
                        <Link to={`/blog/${post.slug}`} className={`mt-3 inline-block text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          Open published blog
                        </Link>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
