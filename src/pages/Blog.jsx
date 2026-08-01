import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getPublicBlogPosts } from '../services/BlogService'
import { GlassPanel, HeroFrame, PillButton, ScrollRail, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

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

  const stats = [
    { label: 'Articles', value: posts.length || '0' },
    { label: 'Categories', value: categories.length || '1' },
    { label: 'Published', value: visiblePosts.length || '0' },
  ]

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-foreground'}`}>
      <section className="px-4 py-10 md:py-12">
        <HeroFrame
          eyebrow="Knowledge Feed"
          title="FarmEazy Knowledge Feed"
          description="This page shows only admin-approved posts for farmers and end users."
          actions={(
            <>
              <PillButton to={isAuthenticated ? '/blog/submit' : '/login'} active>
                {isAuthenticated ? 'Write a Blog' : 'Login to Write a Blog'}
              </PillButton>
              {isAuthenticated && <PillButton to="/blog/my-submissions">My Submissions</PillButton>}
            </>
          )}
          side={(
            <GlassPanel className="p-5 md:p-6">
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className={`rounded-2xl px-4 py-4 text-center ${isDark ? 'bg-background/5' : 'bg-background/75'}`}>
                    <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>{stat.value}</div>
                    <div className={`mt-1 text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className={`mt-5 rounded-2xl p-4 ${isDark ? 'bg-background/70' : 'bg-card text-white'}`}>
                <p className="text-xs uppercase tracking-[0.26em] text-primary">Publishing flow</p>
                <p className="mt-2 text-sm text-muted-foreground">Drafts are reviewed, curated, and then surfaced here for public reading.</p>
              </div>
            </GlassPanel>
          )}
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14 space-y-6">
        <StrongPanel className="p-5 md:p-6">
          <SectionTitle eyebrow="How it works" title="A controlled publishing surface with clear permissions" />
          <ol className={`mt-3 text-sm md:text-base space-y-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
            <li>1. Users or admins can draft blog posts.</li>
            <li>2. Admin reviews and can edit before publishing.</li>
            <li>3. If no article is published yet, this page will show a data-unavailable message.</li>
          </ol>
        </StrongPanel>

        <GlassPanel className="p-4 md:p-5">
          <ScrollRail className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  selectedCategory === cat
                    ? 'bg-primary border-primary text-white'
                    : isDark
                      ? 'bg-muted border-border text-muted-foreground hover:bg-muted'
                      : 'bg-background border-border text-primary hover:bg-primary/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </ScrollRail>
        </GlassPanel>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className={`${isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl p-4`}>
            {error}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className={`${isDark ? 'bg-muted border-border text-muted-foreground' : 'bg-background border-border/60 text-primary'} border rounded-xl p-6`}>
            <p className="font-semibold">No published blog articles are available at the moment.</p>
            <p className="mt-1 text-sm opacity-90">Our team is preparing practical guides and updates. Please check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className={`${isDark ? 'bg-muted border-border' : 'bg-background border-border/60'} border rounded-2xl p-5 shadow-sm hover:shadow-lg transition`}
              >
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/40 text-primary' : 'bg-primary/10 text-primary'}`}>
                    {post.category}
                  </span>
                  <span className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}>{post.readTime}</span>
                </div>
                <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-foreground'}`}>{post.title}</h2>
                <p className={`text-sm line-clamp-4 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
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
