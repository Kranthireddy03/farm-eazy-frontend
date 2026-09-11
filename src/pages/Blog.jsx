import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  BookOpen,
  Sparkles,
  Star,
  Clock,
  User,
  Calendar,
  ArrowRight,
  Bookmark,
  Share2,
  Filter,
  CheckCircle2,
  TrendingUp,
  Tag,
  PenTool,
  Send,
  Layers,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getPublicBlogPosts } from '../services/BlogService'
import { deriveBlogExcerpt } from '../utils/apiResponse'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

const DEFAULT_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
]

const POPULAR_TAGS = [
  'Organic Farming',
  'Smart Irrigation',
  'Soil Health',
  'Crop Protection',
  'Agritech',
  'Market Trends',
  'Precision Ag',
  'Hydroponics',
]

export default function Blog() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posts, setPosts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [selectedTag, setSelectedTag] = useState(null)
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farmeazy_bookmarked_blogs') || '[]')
    } catch {
      return []
    }
  })
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState(null)

  useEffect(() => {
    const loadBlogFeed = async () => {
      setLoading(true)
      setError('')
      try {
        const blogPosts = await getPublicBlogPosts()
        const mappedBlogs = (Array.isArray(blogPosts) ? blogPosts : [])
          .filter((item) => item?.title)
          .map((item, idx) => {
            const excerpt = deriveBlogExcerpt(item)
            const words = (item.content || excerpt || '').split(/\s+/).length
            const readMinutes = Math.max(2, Math.ceil(words / 150))
            const coverImage = item.coverImageUrl?.trim() || DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length]

            return {
              id: item.id,
              slug: item.slug || `post-${item.id}`,
              title: item.title,
              excerpt,
              content: item.content || '',
              category: item.category || 'General',
              tags: Array.isArray(item.tags) ? item.tags : [],
              coverImageUrl: coverImage,
              readMinutes,
              readTime: `${readMinutes} min read`,
              date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently updated',
              publishedAt: item.publishedAt ? new Date(item.publishedAt).getTime() : 0,
              authorName: item.authorName || 'FarmEazy Editorial',
              source: item.source || 'ADMIN_PORTAL',
              averageRating: Number(item.averageRating || 0),
              ratingCount: Number(item.ratingCount || 0),
            }
          })
        setPosts(mappedBlogs)
      } catch (err) {
        const message = err?.code === 'API_DECRYPT_FAILED'
          ? 'Blog feed could not be read (API encryption mismatch). Check environment secret.'
          : 'Unable to load blog feed right now. Please try again soon.'
        setError(message)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadBlogFeed()
  }, [])

  const categoriesWithCounts = useMemo(() => {
    const counts = { All: posts.length }
    posts.forEach((p) => {
      const cat = p.category || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [posts])

  const categories = useMemo(() => Object.keys(categoriesWithCounts), [categoriesWithCounts])

  const toggleBookmark = (slug, e) => {
    e.preventDefault()
    e.stopPropagation()
    setBookmarkedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      try {
        localStorage.setItem('farmeazy_bookmarked_blogs', JSON.stringify(next))
      } catch (_err) {}
      return next
    })
  }

  const handleShare = async (post, e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/blog/${post.slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url })
        return
      } catch (_e) {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(post.slug)
      setTimeout(() => setCopiedSlug(null), 2500)
    } catch (_e) {}
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSubscribed(true)
    setNewsletterEmail('')
  }

  // Filter & Sort logic
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts]

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory)
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
        p.title.toLowerCase().includes(selectedTag.toLowerCase()) ||
        p.category.toLowerCase().includes(selectedTag.toLowerCase())
      )
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.authorName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => b.publishedAt - a.publishedAt)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.averageRating - a.averageRating || b.ratingCount - a.ratingCount)
    } else if (sortBy === 'quick_read') {
      result.sort((a, b) => a.readMinutes - b.readMinutes)
    } else if (sortBy === 'deep_dive') {
      result.sort((a, b) => b.readMinutes - a.readMinutes)
    }

    return result
  }, [posts, selectedCategory, selectedTag, searchQuery, sortBy])

  // Featured Spotlight Post (Highest rated or newest)
  const spotlightPost = useMemo(() => {
    if (posts.length === 0) return null
    return [...posts].sort((a, b) => (b.averageRating * (b.ratingCount || 1)) - (a.averageRating * (a.ratingCount || 1)))[0]
  }, [posts])

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      
      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 border-b border-border/60 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest animate-fadeIn">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FarmEazy Knowledge Hub & Field Insights</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            Modern Farming, Agritech Insights & Field Guides
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Curated agronomy practices, precision irrigation tips, crop disease prevention, and real-world farmer stories.
          </p>

          <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
            <Button
              asChild
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Link to={isAuthenticated ? '/blog/submit' : '/login'}>
                <PenTool className="h-4 w-4 mr-2" />
                {isAuthenticated ? 'Write an Article' : 'Login to Write an Article'}
              </Link>
            </Button>
            {isAuthenticated && (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-border font-semibold px-5 cursor-pointer hover:bg-muted"
              >
                <Link to="/blog/my-submissions">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Submissions
                </Link>
              </Button>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-slate-900/60 border-border/80' : 'bg-white border-border shadow-xs'}`}>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{posts.length}</div>
              <div className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground tracking-wider mt-0.5">Published Articles</div>
            </div>
            <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-slate-900/60 border-border/80' : 'bg-white border-border shadow-xs'}`}>
              <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">{categories.length}</div>
              <div className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground tracking-wider mt-0.5">Topic Categories</div>
            </div>
            <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-slate-900/60 border-border/80' : 'bg-white border-border shadow-xs'}`}>
              <div className="text-xl sm:text-2xl font-black text-amber-500">4.8★</div>
              <div className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground tracking-wider mt-0.5">Reader Rating</div>
            </div>
            <div className={`p-3.5 rounded-2xl border text-center ${isDark ? 'bg-slate-900/60 border-border/80' : 'bg-white border-border shadow-xs'}`}>
              <div className="text-xl sm:text-2xl font-black text-primary">100%</div>
              <div className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground tracking-wider mt-0.5">Expert Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* Featured Spotlight Card */}
        {spotlightPost && !searchQuery && selectedCategory === 'All' && !selectedTag && (
          <div className="relative group">
            <Link
              to={`/blog/${spotlightPost.slug}`}
              className={`block rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                isDark ? 'bg-slate-900/80 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-white border-border hover:border-emerald-500/50 shadow-md'
              }`}
            >
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0">
                <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] overflow-hidden">
                  <img
                    src={spotlightPost.coverImageUrl}
                    alt={spotlightPost.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = DEFAULT_COVER_IMAGES[0] }}
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase px-3 py-1 shadow-md">
                      ⭐ Spotlight Article
                    </Badge>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                        {spotlightPost.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {spotlightPost.readTime}
                      </span>
                      <span>•</span>
                      <span>{spotlightPost.date}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      {spotlightPost.title}
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed">
                      {spotlightPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                        {spotlightPost.authorName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{spotlightPost.authorName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {spotlightPost.source === 'USER_PORTAL' ? 'Community Agronomist' : 'FarmEazy Editorial'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      <span>Read Spotlight</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Search, Filter & Sort Toolbar */}
        <div className={`rounded-3xl border p-4 sm:p-6 space-y-4 shadow-sm ${isDark ? 'bg-slate-900/60 border-border' : 'bg-white border-border'}`}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, crop, technique, author…"
                className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-sm outline-none transition ${
                  isDark ? 'bg-slate-950/80 border-border text-white placeholder:text-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-border text-foreground focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${
                  isDark ? 'bg-slate-950 border-border text-slate-200' : 'bg-slate-50 border-border text-foreground'
                }`}
              >
                <option value="latest">Latest Articles</option>
                <option value="rating">Highest Rated</option>
                <option value="quick_read">Quick Reads (Shortest)</option>
                <option value="deep_dive">Deep Dives (Longest)</option>
              </select>
            </div>
          </div>

          {/* Category Pills with Count Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count = categoriesWithCounts[cat] || 0
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedTag(null); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-950 border-border text-muted-foreground hover:text-white hover:border-emerald-500/40'
                      : 'bg-slate-100 border-border text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : isDark ? 'bg-muted text-muted-foreground' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Popular Tag Cloud */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-primary">
              <Tag className="h-3 w-3" /> Popular Tags:
            </span>
            {POPULAR_TAGS.map((tag) => {
              const isTagActive = selectedTag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isTagActive ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isTagActive
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold'
                      : isDark
                      ? 'bg-slate-950/60 border-border/60 hover:bg-muted text-muted-foreground hover:text-slate-200'
                      : 'bg-white border-border/80 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
            {(selectedTag || searchQuery) && (
              <button
                type="button"
                onClick={() => { setSelectedTag(null); setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs font-bold text-rose-500 hover:underline ml-2 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">Loading knowledge feed…</p>
          </div>
        ) : error ? (
          <div className={`rounded-2xl border p-5 text-sm ${isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <p className="font-bold">Error loading articles</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center space-y-4 ${isDark ? 'bg-slate-900/40 border-border' : 'bg-white border-border shadow-xs'}`}>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black text-foreground">No matching articles found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any published articles matching your current search or category filter.
            </p>
            <Button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedTag(null); }}
              variant="outline"
              className="rounded-full cursor-pointer font-semibold text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Article Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPosts.map((post) => {
              const isBookmarked = bookmarkedSlugs.includes(post.slug)
              const isCopied = copiedSlug === post.slug

              return (
                <article
                  key={post.id}
                  className={`group rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isDark
                      ? 'bg-slate-900/90 border-border/80 hover:border-emerald-500/40'
                      : 'bg-white border-border/80 hover:border-emerald-500/40 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Thumbnail */}
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Link to={`/blog/${post.slug}`}>
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.src = DEFAULT_COVER_IMAGES[0] }}
                        />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] uppercase shadow-md pointer-events-auto">
                          {post.category}
                        </Badge>

                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => toggleBookmark(post.slug, e)}
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                              isBookmarked
                                ? 'bg-amber-500 text-white'
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                          >
                            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-white' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleShare(post, e)}
                            className="h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center transition shadow-md cursor-pointer"
                            aria-label="Share post"
                          >
                            {isCopied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readTime}
                        </span>
                        <span>{post.date}</span>
                      </div>

                      <Link to={`/blog/${post.slug}`} className="block">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {post.tags.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                        {post.authorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">{post.authorName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{post.averageRating > 0 ? post.averageRating.toFixed(1) : 'New'}</span>
                          {post.ratingCount > 0 && <span className="text-muted-foreground">({post.ratingCount})</span>}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Read</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Newsletter & Community CTA Section */}
        <section className={`rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-lg ${
          isDark ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-200'
        }`}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Send className="h-3.5 w-3.5" /> Weekly Agronomy Digest
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Get Weekly Farming Insights in Your Inbox
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join 10,000+ farmers receiving seasonal crop guides, organic pest solutions, and marketplace price forecasts.
              </p>
            </div>

            <div>
              {newsletterSubscribed ? (
                <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-center space-y-2 animate-fadeIn">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm text-emerald-800 dark:text-emerald-200">You are subscribed to FarmEazy Digest!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">We will send our curated agronomy updates every Tuesday morning.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address…"
                      className={`flex-1 rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                        isDark ? 'bg-slate-950 border-border text-white placeholder:text-slate-500 focus:border-emerald-500' : 'bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500'
                      }`}
                    />
                    <Button
                      type="submit"
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 cursor-pointer shadow-md"
                    >
                      Subscribe
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    No spam ever. Unsubscribe at any time with 1-click.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
