import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getPublicBlogPostBySlug, submitBlogRating } from '../services/BlogService'

export default function BlogDetail() {
  const { slug } = useParams()
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [post, setPost] = useState(null)
  const [rating, setRating] = useState(0)
  const [ratingSaving, setRatingSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicBlogPostBySlug(slug)
        setPost(data)
      } catch (_err) {
        setError('Unable to load this blog article right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  return (
    <div className={`min-h-screen px-4 py-10 ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/blog" className={`inline-flex mb-6 text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Back to Blog
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className={`${isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl p-4`}>
            {error}
          </div>
        ) : !post ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-emerald-100 text-emerald-700'} border rounded-xl p-6`}>
            Blog article is not available at the moment.
          </div>
        ) : (
          <article className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'} border rounded-2xl p-6 md:p-8 shadow-sm`}>
            <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
              <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                {post.category || 'General'}
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Recently updated'}
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                By {post.authorName || 'FarmEazy Team'}
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {post.source === 'USER_PORTAL' ? 'Community Contributor' : 'Editorial Team'}
              </span>
            </div>

            <div className={`mb-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Rating: {post.averageRating > 0 ? `${post.averageRating}/5` : 'No ratings yet'} ({post.ratingCount || 0} ratings)
            </div>

            {isAuthenticated ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={async () => {
                      try {
                        setRatingSaving(true)
                        setRating(star)
                        const updated = await submitBlogRating(slug, star)
                        setPost(updated)
                      } catch (_err) {
                        // Keep silent inline for now to avoid noisy UI.
                      } finally {
                        setRatingSaving(false)
                      }
                    }}
                    className={`px-2 py-1 rounded border text-sm font-semibold ${rating >= star ? 'bg-amber-500 text-white border-amber-500' : isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700'}`}
                    disabled={ratingSaving}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`mb-5 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Link to="/login" className={`${isDark ? 'text-cyan-300' : 'text-cyan-700'} font-semibold`}>
                  Login
                </Link>{' '}
                to rate this blog.
              </div>
            )}

            <h1 className={`text-2xl md:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{post.title}</h1>
            <p className={`mt-3 text-base md:text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.excerpt}</p>

            <div className={`mt-8 prose max-w-none whitespace-pre-wrap ${isDark ? 'prose-invert text-slate-200' : 'text-slate-800'}`}>
              {post.content}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
