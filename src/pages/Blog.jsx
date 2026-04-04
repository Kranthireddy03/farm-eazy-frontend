import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getPublicBlogPosts } from '../services/BlogService'

export default function Blog() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [posts, setPosts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const loadBlogFeed = async () => {
      setLoading(true)
      setError('')
      try {
        const blogPosts = await getPublicBlogPosts()
        const mappedBlogs = blogPosts
          .filter(item => item?.title && item?.excerpt)
          .map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            excerpt: item.excerpt,
            category: item.category || 'General',
            readTime: `${Math.max(2, Math.ceil((item.excerpt || '').split(' ').length / 120))} min read`,
            date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recently updated',
            authorName: item.authorName || 'FarmEazy Team',
            source: item.source || 'ADMIN_PORTAL',
            averageRating: item.averageRating || 0,
            ratingCount: item.ratingCount || 0,
          }))
        setPosts(mappedBlogs)
      } catch (_err) {
        setError('Unable to load blog feed right now. Please try again soon.')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadBlogFeed()
  }, [])

  const categories = useMemo(() => {
    const dynamic = [...new Set(posts.map(post => post.category))]
    return ['All', ...dynamic]
  }, [posts])

  const visiblePosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-cyan-50 text-gray-900'}`}>
      <section className="px-4 py-10 md:py-12">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>FarmEazy Knowledge Feed</h1>
          <p className={`mt-3 md:mt-4 text-base md:text-lg ${isDark ? 'text-slate-300' : 'text-emerald-700'}`}>
            This page shows only admin-approved posts for farmers and end users.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className={`mb-6 rounded-2xl border p-4 md:p-5 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100 shadow-sm'}`}>
          <h2 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>How Blog Publishing Works</h2>
          <ol className={`mt-2 text-sm md:text-base space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <li>1. Users or admins can draft blog posts.</li>
            <li>2. Admin reviews and can edit before publishing.</li>
            <li>3. If no article is published yet, this page will show a data-unavailable message.</li>
          </ol>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Link
                to={isAuthenticated ? '/blog/submit' : '/login'}
                className="inline-flex px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                {isAuthenticated ? 'Write a Blog' : 'Login to Write a Blog'}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/blog/my-submissions"
                  className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold border ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'}`}
                >
                  My Submissions
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className={`${isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl p-4`}>
            {error}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-emerald-100 text-emerald-700'} border rounded-xl p-6`}>
            <p className="font-semibold">No published blog articles are available at the moment.</p>
            <p className="mt-1 text-sm opacity-90">Our team is preparing practical guides and updates. Please check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'} border rounded-2xl p-5 shadow-sm hover:shadow-lg transition`}
              >
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    {post.category}
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{post.readTime}</span>
                </div>
                <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-emerald-900'}`}>{post.title}</h2>
                <p className={`text-sm line-clamp-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    <div>{post.date}</div>
                    <div>By {post.authorName} • {post.source === 'USER_PORTAL' ? 'Community Contributor' : 'Editorial Team'}</div>
                    <div>{post.averageRating > 0 ? `${post.averageRating}/5` : 'No ratings yet'} ({post.ratingCount || 0})</div>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className={`text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}
                  >
                    Read full blog
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
