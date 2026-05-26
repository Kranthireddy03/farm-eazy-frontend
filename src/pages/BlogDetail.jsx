import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getPublicBlogPostBySlug, submitBlogRating, getBlogComments, submitBlogComment } from '../services/BlogService'
import { GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'

export default function BlogDetail() {
  const { slug } = useParams()
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [post, setPost] = useState(null)
  const [rating, setRating] = useState(0)
  const [ratingSaving, setRatingSaving] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicBlogPostBySlug(slug)
        setPost(data)
        const cms = await getBlogComments(slug)
        setComments(cms)
      } catch (_err) {
        setError('Unable to load this blog article right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  return (
    <div className={`min-h-screen px-4 py-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <HeroFrame
          eyebrow="Knowledge Article"
          title={post?.title || 'FarmEazy Knowledge Feed'}
          description={post?.excerpt || 'Read a curated article from the FarmEazy knowledge feed.'}
          actions={(
            <>
              <PillButton to="/blog" active>Back to Blog</PillButton>
              <PillButton to="/faq">Open FAQ</PillButton>
            </>
          )}
          side={post ? (
            <GlassPanel className="p-5 md:p-6">
              <SectionTitle eyebrow="Metadata" title="At a glance" />
              <div className={`mt-4 space-y-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <div>Category: {post.category || 'General'}</div>
                <div>{post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Recently updated'}</div>
                <div>By {post.authorName || 'FarmEazy Team'}</div>
                <div>{post.source === 'USER_PORTAL' ? 'Community Contributor' : 'Editorial Team'}</div>
              </div>
            </GlassPanel>
          ) : null}
        >
          <div className="mt-6">
            <SectionTitle eyebrow="Comments" title="Reader comments" />
            {comments.length === 0 ? (
              <div className="text-sm text-slate-500 mt-2">No comments yet. Be the first to comment.</div>
            ) : (
              <div className="space-y-3 mt-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/80 dark:bg-slate-800/80">
                    <div className="text-sm font-semibold">{c.authorName}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{c.content}</div>
                    <div className="text-xs text-slate-400 mt-2">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated ? (
              <div className="mt-4">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} className="w-full p-3 rounded border" placeholder="Write a comment..." />
                <div className="mt-2 flex gap-2">
                  <button disabled={commentSaving || !commentText.trim()} onClick={async () => {
                    try {
                      setCommentSaving(true)
                      const added = await submitBlogComment(slug, commentText.trim())
                      setComments((prev) => [...prev, added])
                      setCommentText('')
                    } catch (_err) {
                    } finally { setCommentSaving(false) }
                  }} className="px-3 py-2 bg-emerald-600 text-white rounded">Comment</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm"> <Link to="/login" className="text-cyan-600">Login</Link> to comment.</div>
            )}
          </div>
        </HeroFrame>

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
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-6 items-start">
            <StrongPanel className="p-6 md:p-8">
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

              <h1 className={`text-2xl md:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{post.title}</h1>
              <p className={`mt-3 text-base md:text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.excerpt}</p>

              <div className={`mt-8 prose max-w-none whitespace-pre-wrap ${isDark ? 'prose-invert text-slate-200' : 'text-slate-800'}`}>
                {post.content}
              </div>
            </StrongPanel>

            <GlassPanel className="p-6 md:p-8">
              <SectionTitle eyebrow="Rating" title="Share a quick signal on this article" />
              <div className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Rating: {post.averageRating > 0 ? `${post.averageRating}/5` : 'No ratings yet'} ({post.ratingCount || 0} ratings)
              </div>

              {isAuthenticated ? (
                <div className="mt-5 flex flex-wrap items-center gap-2">
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
                <div className={`mt-5 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Link to="/login" className={`${isDark ? 'text-cyan-300' : 'text-cyan-700'} font-semibold`}>
                    Login
                  </Link>{' '}
                  to rate this blog.
                </div>
              )}
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  )
}
