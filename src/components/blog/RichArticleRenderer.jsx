import React, { useMemo, useState } from 'react'
import {
  Lightbulb,
  Info,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  X,
} from 'lucide-react'

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extracts Table of Contents (TOC) items from article markdown text
 */
export function extractTableOfContents(content) {
  if (!content || typeof content !== 'string') return []
  const lines = content.split(/\r?\n/)
  const toc = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const rawText = headingMatch[2].replace(/\*\*/g, '').replace(/`/g, '').trim()
      const id = slugify(rawText) || `section-${toc.length + 1}`
      toc.push({ id, text: rawText, level })
    }
  }

  return toc
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [link](url)
 */
function renderInlineFormatting(text) {
  if (!text) return ''

  // Split by markdown link pattern [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIdx = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: text.slice(lastIdx, match.index) })
    }
    parts.push({ type: 'link', text: match[1], url: match[2] })
    lastIdx = linkRegex.lastIndex
  }

  if (lastIdx < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIdx) })
  }

  return parts.map((part, pIdx) => {
    if (part.type === 'link') {
      const isExternal = /^https?:\/\//i.test(part.url)
      return (
        <a
          key={`link-${pIdx}`}
          href={part.url}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2 hover:text-emerald-500 transition-colors break-words"
        >
          <span>{part.text}</span>
          {isExternal && <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />}
        </a>
      )
    }

    // Process bold, italic, code inside text part
    const subText = part.content
    // Tokenize by `code`, **bold**, *italic*
    const tokens = subText.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)

    return (
      <React.Fragment key={`text-frag-${pIdx}`}>
        {tokens.map((token, tIdx) => {
          if (!token) return null
          if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            return (
              <code
                key={`code-${tIdx}`}
                className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 border border-border break-all"
              >
                {token.slice(1, -1)}
              </code>
            )
          }
          if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return (
              <strong key={`bold-${tIdx}`} className="font-bold text-foreground">
                {token.slice(2, -2)}
              </strong>
            )
          }
          if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
            return (
              <em key={`italic-${tIdx}`} className="italic text-foreground/90">
                {token.slice(1, -1)}
              </em>
            )
          }
          return <span key={`plain-${tIdx}`}>{token}</span>
        })}
      </React.Fragment>
    )
  })
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_e) {}
  }

  return (
    <div className="relative my-4 rounded-xl sm:rounded-2xl overflow-hidden border border-border bg-slate-950 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-border/40 text-xs text-muted-foreground font-mono">
        <span className="truncate max-w-[150px] sm:max-w-none">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer p-1 rounded-md hover:bg-slate-800"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-[11px] sm:text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px] sm:text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 sm:p-4 overflow-x-auto text-[11px] sm:text-xs md:text-sm font-mono leading-relaxed touch-pan-x">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CalloutBox({ type, text }) {
  const configs = {
    tip: {
      border: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
      icon: <Lightbulb className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      title: 'Pro Tip',
    },
    warning: {
      border: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
      icon: <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
      title: 'Important Note',
    },
    important: {
      border: 'border-purple-500/40 bg-purple-500/10 text-purple-950 dark:text-purple-100',
      icon: <ShieldCheck className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />,
      title: 'Key Takeaway',
    },
    info: {
      border: 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100',
      icon: <Info className="h-4 sm:h-5 w-4 sm:w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />,
      title: 'Farming Insight',
    },
  }

  const current = configs[type] || configs.info

  return (
    <div className={`my-4 sm:my-5 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border ${current.border} flex items-start gap-2.5 sm:gap-3.5 shadow-xs`}>
      {current.icon}
      <div className="text-xs sm:text-sm md:text-base leading-relaxed break-words min-w-0 flex-1">
        <p className="font-bold text-[10px] sm:text-xs uppercase tracking-wider mb-1 opacity-90">{current.title}</p>
        <div>{renderInlineFormatting(text)}</div>
      </div>
    </div>
  )
}

export default function RichArticleRenderer({ content, className = '' }) {
  const [lightboxImage, setLightboxImage] = useState(null)

  const elements = useMemo(() => {
    if (!content || typeof content !== 'string') return []

    const lines = content.split(/\r?\n/)
    const blocks = []
    let currentParagraph = []
    let inCodeBlock = false
    let codeLanguage = ''
    let codeLines = []

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const fullText = currentParagraph.join(' ').trim()
        if (fullText) {
          const lower = fullText.toLowerCase()
          if (fullText.startsWith('> [!TIP]') || lower.startsWith('tip:') || lower.startsWith('pro tip:')) {
            const cleanText = fullText.replace(/^(>\s*\[!TIP\]|tip:|pro tip:)/i, '').trim()
            blocks.push({ type: 'callout', calloutType: 'tip', text: cleanText })
          } else if (fullText.startsWith('> [!WARNING]') || lower.startsWith('warning:') || lower.startsWith('caution:')) {
            const cleanText = fullText.replace(/^(>\s*\[!WARNING\]|warning:|caution:)/i, '').trim()
            blocks.push({ type: 'callout', calloutType: 'warning', text: cleanText })
          } else if (fullText.startsWith('> [!IMPORTANT]') || lower.startsWith('important:') || lower.startsWith('takeaway:')) {
            const cleanText = fullText.replace(/^(>\s*\[!IMPORTANT\]|important:|takeaway:)/i, '').trim()
            blocks.push({ type: 'callout', calloutType: 'important', text: cleanText })
          } else if (fullText.startsWith('> [!NOTE]') || lower.startsWith('note:') || lower.startsWith('insight:')) {
            const cleanText = fullText.replace(/^(>\s*\[!NOTE\]|note:|insight:)/i, '').trim()
            blocks.push({ type: 'callout', calloutType: 'info', text: cleanText })
          } else if (fullText.startsWith('>')) {
            const cleanText = fullText.replace(/^>\s*/, '').trim()
            blocks.push({ type: 'blockquote', text: cleanText })
          } else {
            blocks.push({ type: 'paragraph', text: fullText })
          }
        }
        currentParagraph = []
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          blocks.push({
            type: 'code',
            language: codeLanguage,
            code: codeLines.join('\n'),
          })
          inCodeBlock = false
          codeLines = []
          codeLanguage = ''
        } else {
          flushParagraph()
          inCodeBlock = true
          codeLanguage = line.trim().slice(3).trim()
          codeLines = []
        }
        continue
      }

      if (inCodeBlock) {
        codeLines.push(line)
        continue
      }

      // Empty line -> flush paragraph
      if (!line.trim()) {
        flushParagraph()
        continue
      }

      // Horizontal rule
      if (/^(\*\*\*|---|___)$/.test(line.trim())) {
        flushParagraph()
        blocks.push({ type: 'hr' })
        continue
      }

      // Headings
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
      if (headingMatch) {
        flushParagraph()
        const level = headingMatch[1].length
        const rawText = headingMatch[2].replace(/\*\*/g, '').replace(/`/g, '').trim()
        const id = slugify(rawText) || `heading-${blocks.length + 1}`
        blocks.push({ type: 'heading', level, text: rawText, id })
        continue
      }

      // Image: ![alt](url)
      const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (imgMatch) {
        flushParagraph()
        blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] })
        continue
      }

      // Unordered list item: - or *
      const ulMatch = line.match(/^[-*]\s+(.+)$/)
      if (ulMatch) {
        flushParagraph()
        blocks.push({ type: 'ul_item', text: ulMatch[1] })
        continue
      }

      // Numbered list item: 1.
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/)
      if (olMatch) {
        flushParagraph()
        blocks.push({ type: 'ol_item', number: olMatch[1], text: olMatch[2] })
        continue
      }

      // Regular text line
      currentParagraph.push(line)
    }

    flushParagraph()
    return blocks
  }, [content])

  return (
    <div className={`space-y-3 sm:space-y-4 text-foreground/90 break-words leading-relaxed ${className}`}>
      {elements.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const HeadingTag = `h${Math.min(4, Math.max(1, block.level))}`
            const sizeClass =
              block.level === 1
                ? 'text-xl sm:text-2xl md:text-3xl font-black mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-border/50 pb-2 text-foreground tracking-tight'
                : block.level === 2
                ? 'text-lg sm:text-xl md:text-2xl font-bold mt-5 sm:mt-7 mb-2 sm:mb-3 text-foreground tracking-tight'
                : block.level === 3
                ? 'text-base sm:text-lg md:text-xl font-bold mt-4 sm:mt-6 mb-2 text-foreground'
                : 'text-sm sm:text-base md:text-lg font-bold mt-3 sm:mt-5 mb-1.5 text-foreground'

            return (
              <HeadingTag
                key={`h-${idx}`}
                id={block.id}
                className={`scroll-mt-20 sm:scroll-mt-24 group flex items-center justify-between ${sizeClass}`}
              >
                <span>{block.text}</span>
                <a
                  href={`#${block.id}`}
                  className="opacity-0 group-hover:opacity-100 text-xs font-normal text-emerald-600 hover:underline ml-2 transition-opacity p-1"
                  aria-label={`Link to ${block.text}`}
                >
                  #
                </a>
              </HeadingTag>
            )
          }

          case 'paragraph':
            return (
              <p
                key={`p-${idx}`}
                className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground/90 my-2.5 sm:my-3 font-normal"
              >
                {renderInlineFormatting(block.text)}
              </p>
            )

          case 'blockquote':
            return (
              <blockquote
                key={`bq-${idx}`}
                className="my-4 sm:my-5 pl-3 sm:pl-6 py-2 border-l-4 border-emerald-500 italic text-sm sm:text-base md:text-lg text-foreground/80 bg-muted/30 rounded-r-xl sm:rounded-r-2xl"
              >
                &ldquo;{renderInlineFormatting(block.text)}&rdquo;
              </blockquote>
            )

          case 'callout':
            return <CalloutBox key={`callout-${idx}`} type={block.calloutType} text={block.text} />

          case 'code':
            return <CodeBlock key={`code-${idx}`} code={block.code} language={block.language} />

          case 'ul_item':
            return (
              <div key={`ul-${idx}`} className="flex items-start gap-2 sm:gap-2.5 my-1.5 sm:my-2 pl-1 sm:pl-2">
                <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground/90 flex-1 min-w-0">
                  {renderInlineFormatting(block.text)}
                </span>
              </div>
            )

          case 'ol_item':
            return (
              <div key={`ol-${idx}`} className="flex items-start gap-2.5 sm:gap-3 my-1.5 sm:my-2 pl-1 sm:pl-2">
                <span className="h-5 sm:h-6 w-5 sm:w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {block.number}
                </span>
                <span className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground/90 flex-1 min-w-0">
                  {renderInlineFormatting(block.text)}
                </span>
              </div>
            )

          case 'image':
            return (
              <figure key={`img-${idx}`} className="my-4 sm:my-6">
                <div
                  className="relative group rounded-xl sm:rounded-2xl overflow-hidden border border-border shadow-md bg-muted/40 cursor-pointer"
                  onClick={() => setLightboxImage(block.src)}
                >
                  <img
                    src={block.src}
                    alt={block.alt || 'Blog illustration'}
                    loading="lazy"
                    className="w-full max-h-[300px] sm:max-h-[480px] object-cover transition duration-300 group-hover:scale-101"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="h-3.5 w-3.5" /> Tap to zoom
                    </span>
                  </div>
                </div>
                {block.alt && (
                  <figcaption className="mt-2 text-center text-xs text-muted-foreground italic px-2">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            )

          case 'hr':
            return <hr key={`hr-${idx}`} className="my-6 sm:my-8 border-border/60" />

          default:
            return null
        }
      })}

      {/* Full-res Image Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 h-11 w-11 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition cursor-pointer z-10"
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Expanded view"
            className="max-w-[96vw] sm:max-w-[90vw] max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
