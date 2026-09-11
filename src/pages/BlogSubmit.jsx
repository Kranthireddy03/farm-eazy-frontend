import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PenLine,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Trash2,
  BookOpen,
  Layers,
  ArrowLeft,
  List,
  Heading2,
  Bold,
  Italic,
  Quote,
  Code,
  Lightbulb,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import { submitUserBlogPost } from '../services/BlogService'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { DetailPanel } from '../components/platform/DetailPanel'
import { InfoPanel } from '../components/platform/InfoPanel'
import { FePanel } from '../components/platform/FeOpsPrimitives'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import RichArticleRenderer from '../components/blog/RichArticleRenderer'
import { cn } from '../lib/utils'

const DRAFT_STORAGE_KEY = 'farmeazy_blog_submit_draft_v1'

const CATEGORY_PRESETS = [
  'Organic Farming',
  'Precision Agriculture',
  'Soil Health & Nutrients',
  'Smart Irrigation',
  'Crop Protection & Pest Control',
  'Agritech & Automation',
  'Market Trends & Finance',
  'Dairy & Livestock',
]

const POPULAR_TAG_SUGGESTIONS = [
  'Drip Irrigation',
  'Composting',
  'Biofertilizers',
  'IoT Sensors',
  'Monsoon Crops',
  'Soil Testing',
  'Pest Management',
  'Solar Farming',
]

const SAMPLE_COVERS = [
  {
    label: 'Wheat & Crops',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Smart Irrigation',
    url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'High-Tech Agronomy',
    url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Soil & Sprout',
    url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
  },
]

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Organic Farming',
  tags: ['Farming', 'Best Practices'],
  coverImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  imageUrlsText: '',
  authorName: '',
}

export default function BlogSubmit() {
  const { toast, showToast, closeToast } = useToast()
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('write') // 'write' | 'preview'
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {}
    return {
      ...EMPTY_FORM,
      authorName: user?.name || user?.fullName || '',
    }
  })

  // Auto save draft to local storage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  // Word count & read time estimation
  const wordCount = useMemo(() => {
    const text = (form.content || '').trim()
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
  }, [form.content])

  const estimatedReadMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 160))
  }, [wordCount])

  // Quality check items
  const qualityChecks = useMemo(() => [
    { label: 'Catchy & descriptive title (10+ characters)', valid: form.title.trim().length >= 10 },
    { label: 'Concise summary / excerpt (30+ characters)', valid: form.excerpt.trim().length >= 30 },
    { label: 'Detailed article content (100+ words)', valid: wordCount >= 100 },
    { label: 'Valid farming category selected', valid: Boolean(form.category.trim()) },
    { label: 'At least 2 relevant tags', valid: (form.tags || []).length >= 2 },
    { label: 'Cover image URL provided', valid: Boolean(form.coverImageUrl.trim()) },
  ], [form, wordCount])

  const readinessScore = useMemo(() => {
    const passed = qualityChecks.filter((c) => c.valid).length
    return Math.round((passed / qualityChecks.length) * 100)
  }, [qualityChecks])

  // Tag chip handlers
  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim().replace(/^#/, '')
    if (!clean) return
    if (!form.tags.includes(clean) && form.tags.length < 8) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, clean] }))
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }))
  }

  // Markdown toolbar insertion helper
  const insertMarkdownSnippet = (snippetPrefix, snippetSuffix = '') => {
    const textarea = document.getElementById('blog-content-textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = form.content || ''
    const selectedText = currentText.substring(start, end) || 'Sample text'

    const replacement = `${snippetPrefix}${selectedText}${snippetSuffix}`
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end)

    setForm((prev) => ({ ...prev, content: newContent }))

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + snippetPrefix.length,
        start + snippetPrefix.length + selectedText.length
      )
    }, 50)
  }

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to reset your draft? Any unsaved changes will be lost.')) {
      setForm({
        ...EMPTY_FORM,
        authorName: user?.name || user?.fullName || '',
      })
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      showToast('Draft has been reset.', 'info')
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim() || 'General',
      tags: form.tags,
      coverImageUrl: form.coverImageUrl.trim(),
      imageUrls: form.imageUrlsText
        .split(/\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
      authorName: form.authorName.trim() || user?.name || 'FarmEazy Contributor',
    }

    if (!payload.title || !payload.excerpt || !payload.content) {
      showToast('Title, summary, and article body are required.', 'error')
      return
    }

    if (payload.title.length < 5) {
      showToast('Title is too short. Please provide a descriptive title.', 'error')
      return
    }

    if (wordCount < 40) {
      showToast('Please provide a more informative article (at least 40 words).', 'warning')
      return
    }

    try {
      setSaving(true)
      await submitUserBlogPost(payload)
      showToast('Your article was submitted for editorial review! Redirecting...', 'success')
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setForm(EMPTY_FORM)
      setTimeout(() => navigate('/blog/my-submissions'), 1200)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to submit blog right now. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppPage
      title="Write for FarmEazy Community"
      description="Share your practical farming knowledge, agritech innovations, and crop management insights with thousands of farmers."
      actions={
        <div className="flex items-center gap-3">
          <Link
            to="/blog/my-submissions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            My Submissions
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Blog
          </Link>
        </div>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      {/* Editor Top Bar & Readiness Header */}
      <div className={cn(
        'p-5 rounded-2xl border mb-6 transition-all',
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Submission Readiness</span>
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                readinessScore >= 80 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                readinessScore >= 50 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              )}>
                {readinessScore}% Ready
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {wordCount} words • ~{estimatedReadMinutes} min read estimated
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'write'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <PenLine className="w-3.5 h-3.5" />
                Write & Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearDraft}
              title="Reset Draft"
              className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Readiness progress line */}
        <div className="mt-3 h-2 rounded-full overflow-hidden bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-500',
              readinessScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              readinessScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-emerald-400' :
              'bg-gradient-to-r from-rose-500 to-amber-500'
            )}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      {activeTab === 'preview' ? (
        /* LIVE ARTICLE PREVIEW MODE */
        <div className="space-y-6">
          <div className={cn(
            'p-4 rounded-xl border flex items-center justify-between',
            isDark ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          )}>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>You are viewing a <strong>live rendered simulation</strong> of how readers will experience your article.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('write')}
              className="text-xs"
            >
              <PenLine className="w-3.5 h-3.5 mr-1" />
              Back to Editing
            </Button>
          </div>

          <div className={cn(
            'p-6 sm:p-10 rounded-3xl border shadow-xl',
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          )}>
            {/* Header tags & meta */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="success" className="px-3 py-1 text-xs">
                {form.category || 'General Agriculture'}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {estimatedReadMinutes} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-snug mb-4">
              {form.title || 'Untitled Blog Article'}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-base">
                {(form.authorName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {form.authorName || 'FarmEazy Community Member'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Draft Submission • Preview Mode
                </p>
              </div>
            </div>

            {/* Cover Image */}
            {form.coverImageUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-border/60 shadow-md">
                <img
                  src={form.coverImageUrl}
                  alt={form.title}
                  className="w-full h-72 sm:h-96 object-cover"
                  onError={(e) => {
                    e.target.src = SAMPLE_COVERS[0].url
                  }}
                />
              </div>
            )}

            {/* Excerpt Lead */}
            {form.excerpt && (
              <div className={cn(
                'p-4 rounded-xl border-l-4 border-emerald-500 mb-8 italic text-base leading-relaxed',
                isDark ? 'bg-slate-800/40 text-slate-300' : 'bg-emerald-50/50 text-slate-700'
              )}>
                {form.excerpt}
              </div>
            )}

            {/* Main Rich Content */}
            <div className="prose prose-emerald dark:prose-invert max-w-none">
              <RichArticleRenderer content={form.content || '*No content written yet. Switch back to Write mode to draft your article.*'} />
            </div>

            {/* Tags */}
            {form.tags && form.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Tags:</span>
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveTab('write')}>
              Edit Content
            </Button>
            <Button
              onClick={onSubmit}
              disabled={saving || readinessScore < 40}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {saving ? 'Submitting Article...' : 'Submit for Editorial Review'}
            </Button>
          </div>
        </div>
      ) : (
        /* WRITE / EDIT MODE */
        <PageScaffold
          aside={
            <div className="space-y-6">
              {/* Submission Quality Checklist */}
              <InfoPanel
                title="Publishing Checklist"
                description="Meet these standards for swift admin review."
              >
                <div className="mt-3 space-y-2.5">
                  {qualityChecks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {check.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        check.valid ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </InfoPanel>

              {/* Tips for Farmers & Writers */}
              <InfoPanel
                title="Writing Tips"
                description="How to write articles that farmers love."
              >
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <strong className="text-foreground block mb-0.5">🌾 Real-World Experience</strong>
                    Share practical numbers (crop yield % increase, water saved, fertilizer dosage).
                  </li>
                  <li className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <strong className="text-foreground block mb-0.5">📑 Clear Subheadings</strong>
                    Use <code className="text-emerald-500 font-mono">## Heading</code> to break complex topics into readable chunks.
                  </li>
                  <li className="p-2.5 rounded-lg border border-border/70 bg-muted/20">
                    <strong className="text-foreground block mb-0.5">💡 Highlights & Tips</strong>
                    Use callout boxes like <code className="text-emerald-500 font-mono">&gt; [!TIP]</code> for golden takeaways.
                  </li>
                </ul>
              </InfoPanel>

              {/* Safety & Editorial Notice */}
              <div className={cn(
                'p-4 rounded-2xl border text-xs space-y-2',
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              )}>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Editorial Review Guarantee
                </div>
                <p>
                  To ensure quality and agronomic safety, every post is reviewed within 24–48 hours before appearing on the public blog feed.
                </p>
              </div>
            </div>
          }
        >
          <form onSubmit={onSubmit} className="space-y-6">
            {/* 1. Basic Metadata */}
            <DetailPanel
              title="Article Overview"
              description="Craft a headline, select category, and introduce your topic."
            >
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Step-by-Step Guide to Drip Irrigation for High-Yield Tomato Farming"
                    className="text-base font-medium"
                    maxLength={140}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1 px-1">
                    <span>Be clear and specific about the crop, practice, or tool.</span>
                    <span>{form.title.length}/140</span>
                  </div>
                </div>

                {/* Author Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Author / Contributor Name
                  </label>
                  <Input
                    value={form.authorName}
                    onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
                    placeholder="e.g., Dr. Ramesh Patil or Green Acres Farm"
                  />
                </div>

                {/* Category Preset Pills */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CATEGORY_PRESETS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-xl border transition-all font-medium',
                          form.category === cat
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Or type a custom category..."
                    className="text-xs"
                  />
                </div>

                {/* Summary / Excerpt */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Short Summary / Excerpt <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief 2-3 sentence overview highlighting what the reader will learn..."
                    maxLength={350}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1 px-1">
                    <span>This appears on search cards and article previews.</span>
                    <span>{form.excerpt.length}/350</span>
                  </div>
                </div>
              </div>
            </DetailPanel>

            {/* 2. Article Body with Markdown Toolbar */}
            <DetailPanel
              title="Article Content"
              description="Write your full guide. Markdown formatting is fully supported."
            >
              <div className="space-y-3">
                {/* Quick Markdown Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/60 border border-border text-xs">
                  <span className="text-[11px] font-semibold text-muted-foreground px-1.5">Format:</span>
                  
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('## ', '')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Section Heading"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('**', '**')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Bold Text"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('*', '*')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Italic Text"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n- ', '')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n> ', '')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Quote Block"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="h-4 w-[1px] bg-border mx-1" />

                  {/* Callout helpers */}
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n> [!TIP]\n> **Pro Tip:** ')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors"
                    title="Insert Tip Box"
                  >
                    <Lightbulb className="w-3 h-3" />
                    + Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n> [!WARNING]\n> **Important Note:** ')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
                    title="Insert Warning Box"
                  >
                    <AlertCircle className="w-3 h-3" />
                    + Caution
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet('\n```\n', '\n```\n')}
                    className="p-1.5 rounded-lg hover:bg-background text-foreground transition-colors"
                    title="Code or Data snippet"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>

                  <div className="ml-auto text-[11px] text-muted-foreground font-mono">
                    {wordCount} words
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  id="blog-content-textarea"
                  rows={16}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Draft your detailed guide here...&#10;&#10;## 1. Overview & Setup&#10;Describe the background and requirements...&#10;&#10;## 2. Step-by-Step Implementation&#10;- Step 1: Soil preparation&#10;- Step 2: Seed treatment&#10;&#10;> [!TIP]&#10;> Keep moisture levels between 60-70% for optimal seedling germination.&#10;&#10;## 3. Results & Summary&#10;Summarize the yield outcomes and key lessons."
                  className="flex w-full rounded-2xl border border-input bg-background p-4 text-sm font-sans leading-relaxed ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[350px]"
                />
              </div>
            </DetailPanel>

            {/* 3. Media & Visuals */}
            <DetailPanel
              title="Cover & Media"
              description="Add visuals to make your article engaging and informative."
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Cover Image URL <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={form.coverImageUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                {/* Sample Presets */}
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block mb-2">
                    Or select a curated agricultural cover photo:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SAMPLE_COVERS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, coverImageUrl: sample.url }))}
                        className={cn(
                          'group relative rounded-xl overflow-hidden border text-left transition-all',
                          form.coverImageUrl === sample.url
                            ? 'ring-2 ring-emerald-500 border-emerald-500'
                            : 'border-border opacity-70 hover:opacity-100'
                        )}
                      >
                        <img
                          src={sample.url}
                          alt={sample.label}
                          className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex items-end">
                          <span className="text-[10px] font-semibold text-white truncate">
                            {sample.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Live Preview */}
                {form.coverImageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-muted/40 h-44 flex items-center justify-center">
                    <img
                      src={form.coverImageUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
                      Cover Preview
                    </div>
                  </div>
                )}

                {/* Additional Images */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Additional Gallery Image URLs (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.imageUrlsText}
                    onChange={(e) => setForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                    placeholder="Paste extra image URLs (one per line or separated by comma)..."
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </DetailPanel>

            {/* 4. Tags & Taxonomy */}
            <DetailPanel
              title="Tags & Discoverability"
              description="Help farmers find your article via search filters."
            >
              <div className="space-y-3">
                {/* Active Tag Chips */}
                <div className="flex flex-wrap items-center gap-2 min-h-[36px] p-2 rounded-xl bg-muted/40 border border-border">
                  {form.tags && form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder={form.tags.length === 0 ? 'Type tag and press Enter...' : 'Add tag...'}
                    className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-[120px] px-1"
                  />
                </div>

                {/* Popular suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1">Suggested:</span>
                  {POPULAR_TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      disabled={form.tags.includes(tag)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-md border transition-colors',
                        form.tags.includes(tag)
                          ? 'opacity-40 cursor-not-allowed border-transparent'
                          : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </DetailPanel>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Save className="w-3.5 h-3.5 text-emerald-500" />
                <span>Draft automatically saved to your browser session.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                  className="w-full sm:w-auto"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Live Preview
                </Button>
                <Button
                  type="submit"
                  disabled={saving || readinessScore < 30}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                >
                  {saving ? 'Submitting Article...' : 'Submit for Review'}
                </Button>
              </div>
            </div>
          </form>
        </PageScaffold>
      )}
    </AppPage>
  )
}
