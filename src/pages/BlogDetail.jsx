import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Share2,
  Bookmark,
  Star,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Send,
  BookOpen,
  Eye,
  Tag,
  ThumbsUp,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  getPublicBlogPostBySlug,
  getPublicBlogPosts,
  submitBlogRating,
  getBlogComments,
  submitBlogComment,
} from '../services/BlogService'
import { deriveBlogExcerpt } from '../utils/apiResponse'
import RichArticleRenderer, { extractTableOfContents } from '../components/blog/RichArticleRenderer'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

const DEFAULT_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
]

export default function BlogDetail() {
  const { slug } = useParams()
  const { isDark } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingSaving, setRatingSaving] = useState(false)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  // Track scroll progress for reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check bookmarks
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('farmeazy_bookmarked_blogs') || '[]')
      setIsBookmarked(saved.includes(slug))
    } catch {
      setIsBookmarked(false)
    }
  }, [slug])

  const toggleBookmark = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('farmeazy_bookmarked_blogs') || '[]')
      const next = saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug]
      localStorage.setItem('farmeazy_bookmarked_blogs', JSON.stringify(next))
      setIsBookmarked(!isBookmarked)
    } catch {}
  }

  // Load Post & Comments
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicBlogPostBySlug(slug)
        setPost(data)

        if (data?.averageRating) {
          setRating(Math.round(data.averageRating))
        }

        // Load comments
        try {
          const cms = await getBlogComments(slug)
          setComments(Array.isArray(cms) ? cms : [])
        } catch (_e) {
          setComments([])
        }

        // Load related posts in same category
        try {
          const allPosts = await getPublicBlogPosts()
          if (Array.isArray(allPosts)) {
            const related = allPosts
              .filter((p) => p.slug !== slug && (p.category === data?.category || !data?.category))
              .slice(0, 3)
            setRelatedPosts(related)
          }
        } catch (_e) {}
      } catch (_err) {
        setError('Unable to load this blog article. It may have been unpublished or moved.')
      } finally {
        setLoading(false)
      }
    }

    load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  // Table of Contents extraction
  const toc = useMemo(() => {
    if (!post?.content) return []
    return extractTableOfContents(post.content)
  }, [post?.content])

  const galleryImages = useMemo(() => {
    if (Array.isArray(post?.imageUrls)) return post.imageUrls.filter(Boolean)
    if (post?.imageUrls && typeof post.imageUrls === 'string') {
      return post.imageUrls.split(/\n|,/).map((u) => u.trim()).filter(Boolean)
    }
    return []
  }, [post?.imageUrls])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || 'FarmEazy Field Guide',
          text: post?.excerpt || 'Check out this agricultural guide on FarmEazy!',
          url,
        })
        return
      } catch (_e) {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch (_e) {}
  }

  const handleRatingSubmit = async (stars) => {
    if (!isAuthenticated) return
    setRatingSaving(true)
    setRating(stars)
    try {
      const updated = await submitBlogRating(slug, stars)
      if (updated) {
        setPost(updated)
      }
      setRatingSuccess(true)
      setTimeout(() => setRatingSuccess(false), 3000)
    } catch (_err) {
      console.warn('Rating submission error:', _err)
    } finally {
      setRatingSaving(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || commentSaving) return
    setCommentSaving(true)
    try {
      const newComment = await submitBlogComment(slug, commentText.trim())
      setComments((prev) => [newComment, ...prev])
      setCommentText('')
    } catch (_err) {
      console.warn('Comment submission error:', _err)
    } finally {
      setCommentSaving(false)
    }
  }

  const words = (post?.content || '').split(/\s+/).length
  const readMinutes = Math.max(2, Math.ceil(words / 150))
  const coverImage = post?.coverImageUrl?.trim() || DEFAULT_COVER_IMAGES[0]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      
      {/* Sticky Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 sm:h-1.5 z-[100] bg-muted/40">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-foreground transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/blog" className="hover:text-foreground transition">Knowledge Hub</Link>
            {post?.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{post.category}</span>
              </>
            )}
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-semibold cursor-pointer px-3 py-1 h-8"
          >
            <Link to="/blog">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All Articles
            </Link>
          </Button>
        </div>

        {/* Loading / Error State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Opening article…</p>
          </div>
        ) : error ? (
          <div className={`rounded-2xl sm:rounded-3xl border p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto ${isDark ? 'bg-red-950/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <h2 className="text-lg sm:text-xl font-bold">Article Unavailable</h2>
            <p className="text-xs sm:text-sm opacity-90">{error}</p>
            <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to="/blog">Return to Blog Feed</Link>
            </Button>
          </div>
        ) : !post ? null : (
          
          <div className="space-y-6 sm:space-y-10">
            
            {/* Article Header & Hero */}
            <header className="space-y-4 sm:space-y-6 max-w-4xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 text-white font-bold text-[10px] sm:text-xs uppercase px-2.5 sm:px-3 py-1 shadow-xs">
                  {post.category || 'General'}
                </Badge>
                {post.tags && Array.isArray(post.tags) && post.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 sm:px-2.5 py-0.5 rounded-full bg-muted text-[10px] sm:text-xs font-medium text-muted-foreground border border-border"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight sm:leading-[1.15]">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-sm sm:text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  {post.excerpt}
                </p>
              )}

              {/* Author & Meta Row */}
              <div className="pt-3 sm:pt-4 border-t border-b border-border/70 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-md shrink-0">
                    {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'F'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="font-bold text-xs sm:text-sm text-foreground">{post.authorName || 'FarmEazy Editorial'}</p>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 px-1.5 font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        {post.source === 'USER_PORTAL' ? 'Community Agronomist' : 'Verified Editorial'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently updated'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {readMinutes} min read
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Share & Bookmark Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleBookmark}
                    className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isBookmarked
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : isDark
                        ? 'border-border bg-slate-900 hover:bg-slate-800 text-slate-200'
                        : 'border-border bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isBookmarked ? 'fill-white' : ''}`} />
                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      copiedLink
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isDark
                        ? 'border-border bg-slate-900 hover:bg-slate-800 text-slate-200'
                        : 'border-border bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /> : <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Cover Image Banner */}
            {coverImage && (
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-lg sm:shadow-xl max-h-[260px] sm:max-h-[380px] lg:max-h-[460px] bg-muted">
                <img
                  src={coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover max-h-[260px] sm:max-h-[380px] lg:max-h-[460px]"
                  onError={(e) => { e.currentTarget.src = DEFAULT_COVER_IMAGES[0] }}
                />
              </div>
            )}

            {/* Mobile Expandable Table of Contents (< lg screens) */}
            {toc.length > 0 && (
              <div className="lg:hidden rounded-2xl border p-3.5 bg-muted/30 border-border">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="flex items-center justify-between w-full text-xs font-bold text-foreground cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="h-4 w-4" /> Jump to Section ({toc.length} topics)
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileTocOpen && (
                  <nav className="mt-3 pt-3 border-t border-border/60 space-y-1 text-xs">
                    {toc.map((item, idx) => (
                      <a
                        key={idx}
                        href={`#${item.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className={`block py-1 text-foreground/90 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 ${
                          item.level === 1 ? 'font-bold' : item.level === 2 ? 'pl-2 text-muted-foreground' : 'pl-4 text-muted-foreground/80'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Two-Column Layout: Article Body + Sticky Sidebar */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-6 sm:gap-10 items-start">
              
              {/* Left Column: Article Content */}
              <main className="space-y-6 sm:space-y-8 min-w-0">
                <div className={`p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border shadow-sm ${
                  isDark ? 'bg-slate-900/70 border-border' : 'bg-white border-border'
                }`}>
                  <RichArticleRenderer content={post.content || post.excerpt} />

                  {/* Gallery Grid if attached */}
                  {galleryImages.length > 0 && (
                    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                        <span>📸 Field Gallery & Visual References</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {galleryImages.map((imgUrl, i) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt={`${post.title} gallery ${i + 1}`}
                            loading="lazy"
                            className="w-full h-40 sm:h-48 object-cover rounded-xl sm:rounded-2xl border border-border shadow-sm hover:scale-101 transition-transform"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating & Reader Signal Box */}
                <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border shadow-md space-y-3 sm:space-y-4 ${
                  isDark ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border-emerald-500/20' : 'bg-gradient-to-br from-white via-white to-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5 sm:mb-1">
                        Rate this Field Guide
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        Was this article helpful to your farming practice?
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Current rating: {post.averageRating > 0 ? `${post.averageRating.toFixed(1)} / 5.0` : 'Not rated yet'} ({post.ratingCount || 0} reviews)
                      </p>
                    </div>

                    {/* Star Rating Buttons */}
                    {isAuthenticated ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 pt-1 sm:pt-0">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = (hoverRating || rating) >= star
                          return (
                            <button
                              key={star}
                              type="button"
                              disabled={ratingSaving}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => handleRatingSubmit(star)}
                              className="p-1 text-2xl transition active:scale-125 sm:hover:scale-125 cursor-pointer disabled:opacity-60"
                              aria-label={`Rate ${star} stars`}
                            >
                              <Star className={`h-7 w-7 sm:h-7 sm:w-7 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                  : isDark
                                  ? 'text-slate-600'
                                  : 'text-slate-300'
                              }`} />
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="rounded-full text-xs font-semibold w-full sm:w-auto mt-2 sm:mt-0">
                        <Link to="/login">Login to Rate</Link>
                      </Button>
                    )}
                  </div>

                  {ratingSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Thank you! Your rating has been recorded.</span>
                    </div>
                  )}
                </div>

                {/* Community Discussion / Comments Section */}
                <section className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border shadow-sm space-y-4 sm:space-y-6 ${
                  isDark ? 'bg-slate-900/70 border-border' : 'bg-white border-border'
                }`} id="comments">
                  <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-lg sm:text-xl font-black text-foreground">Reader Comments</h3>
                      <Badge className="bg-muted text-foreground text-xs font-bold">
                        {comments.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Comment Submission Form */}
                  {isAuthenticated ? (
                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1">
                          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <textarea
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add your agronomy question, field experience, or feedback…"
                            className={`w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm outline-none transition ${
                              isDark ? 'bg-slate-950 border-border text-white placeholder:text-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500'
                            }`}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              Formatting supported: **bold**, *italic*, `code`.
                            </span>
                            <Button
                              type="submit"
                              disabled={commentSaving || !commentText.trim()}
                              size="sm"
                              className="rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {commentSaving ? 'Posting…' : 'Post Comment'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className={`p-4 rounded-xl sm:rounded-2xl border text-center space-y-2 ${isDark ? 'bg-slate-950/60 border-border' : 'bg-slate-50 border-border'}`}>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">Join the Community Discussion</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">Please login to ask questions and share insights on this article.</p>
                      <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold mt-1">
                        <Link to="/login">Login to Comment</Link>
                      </Button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                    {comments.length === 0 ? (
                      <div className="py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
                        No comments yet. Be the first to share your thoughts!
                      </div>
                    ) : (
                      comments.map((c, idx) => (
                        <div
                          key={c.id || idx}
                          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border space-y-2 ${
                            isDark ? 'bg-slate-950/60 border-border/80' : 'bg-slate-50 border-border/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                                {(c.authorName || 'User').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-xs text-foreground truncate max-w-[140px] sm:max-w-none">{c.authorName || 'Community Member'}</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-8 sm:pl-9 break-words">
                            {c.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </main>

              {/* Right Column: Sticky Table of Contents & Social Links (Desktop & Tablet) */}
              <aside className="space-y-6 lg:sticky lg:top-20">
                
                {/* Desktop Table of Contents Box */}
                {toc.length > 0 && (
                  <div className={`hidden lg:block p-5 rounded-3xl border shadow-sm space-y-3 ${
                    isDark ? 'bg-slate-900/80 border-border' : 'bg-white border-border'
                  }`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" /> Table of Contents
                    </h4>
                    <nav className="space-y-1.5 text-xs">
                      {toc.map((item, idx) => (
                        <a
                          key={idx}
                          href={`#${item.id}`}
                          className={`block py-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 ${
                            item.level === 1
                              ? 'font-bold text-foreground'
                              : item.level === 2
                              ? 'pl-2 text-muted-foreground'
                              : 'pl-4 text-muted-foreground/80'
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Social Sharing Box */}
                <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm space-y-3 ${
                  isDark ? 'bg-slate-900/80 border-border' : 'bg-white border-border'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-emerald-500" /> Share this Guide
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-foreground active:scale-95"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-sky-500/10 hover:border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-foreground active:scale-95"
                    >
                      <span>🐦 Twitter (X)</span>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-blue-500/10 hover:border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-foreground active:scale-95"
                    >
                      <span>💼 LinkedIn</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-2 sm:p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition text-foreground cursor-pointer active:scale-95"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Author Card Box */}
                <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm space-y-2.5 sm:space-y-3 ${
                  isDark ? 'bg-slate-900/80 border-border' : 'bg-white border-border'
                }`}>
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">About the Author</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-foreground">{post.authorName || 'FarmEazy Editorial'}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                        {post.source === 'USER_PORTAL' ? 'Contributing Agronomist' : 'FarmEazy Agronomy Specialist'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sharing verified agronomy insights and sustainable practices to empower farm yields and marketplace logistics across India.
                  </p>
                </div>

              </aside>
            </div>

            {/* Related Articles Carousel / Grid */}
            {relatedPosts.length > 0 && (
              <section className="pt-6 sm:pt-8 border-t border-border/80 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-2xl font-black text-foreground">
                    Related Articles & Guides
                  </h3>
                  <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-semibold">
                    <Link to="/blog">View All</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/blog/${rel.slug}`}
                      className={`group rounded-2xl sm:rounded-3xl border overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl sm:hover:-translate-y-1 active:scale-[0.99] ${
                        isDark ? 'bg-slate-900/80 border-border hover:border-emerald-500/40' : 'bg-white border-border hover:border-emerald-500/40 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2 sm:space-y-2.5">
                        <Badge className="bg-emerald-600 text-white font-bold text-[9px] sm:text-[10px] uppercase">
                          {rel.category || 'General'}
                        </Badge>
                        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      </div>

                      <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Read Guide</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
