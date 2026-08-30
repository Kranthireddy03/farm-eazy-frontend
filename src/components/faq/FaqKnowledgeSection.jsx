import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  getCoreFaqsForAudience,
  USER_FAQ_CATEGORIES,
  ADMIN_FAQ_CATEGORIES,
  mapApprovedFaqs,
} from '../../constants/faqContent'

export function FaqKnowledgeSection({
  audience = 'user',
  loadApprovedFaqs,
  className,
  title = 'Support knowledge base',
  description = 'Review published answers first. Use See more questions for admin-approved entries from the server.',
}) {
  const coreFaqs = getCoreFaqsForAudience(audience)
  const categories = audience === 'admin' ? ADMIN_FAQ_CATEGORIES : USER_FAQ_CATEGORIES
  const apiSource = audience === 'admin' ? 'admin' : 'user'

  const [faqFilter, setFaqFilter] = useState('all')
  const [openFaq, setOpenFaq] = useState([])
  const [showMoreFaqs, setShowMoreFaqs] = useState(false)
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqList, setFaqList] = useState([])
  const [apiLoaded, setApiLoaded] = useState(false)
  const [apiError, setApiError] = useState('')

  const filteredCoreFaqs =
    faqFilter === 'all' ? coreFaqs : coreFaqs.filter((item) => item.cat === faqFilter)
  const filteredMoreFaqs =
    faqFilter === 'all' ? faqList : faqList.filter((item) => item.cat === faqFilter)

  const toggleFaq = (key) => {
    setOpenFaq((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]))
  }

  const handleSeeMore = async () => {
    if (showMoreFaqs) {
      setShowMoreFaqs(false)
      return
    }

    if (!apiLoaded) {
      setFaqLoading(true)
      setApiError('')
      try {
        const data = await loadApprovedFaqs(apiSource)
        setFaqList(mapApprovedFaqs(data))
        setApiLoaded(true)
      } catch {
        setApiError('Unable to load approved FAQs. If this persists, check API encryption settings or restart the backend after the latest update.')
        setFaqList([])
      } finally {
        setFaqLoading(false)
      }
    }
    setShowMoreFaqs(true)
  }

  return (
    <div className={cn('ops-panel interactive-card rounded-2xl border p-6 md:p-8 border-border', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">FAQ</p>
      <h2 className="mt-2 text-2xl font-extrabold text-foreground">{title}</h2>
      <p className="mt-3 text-muted-foreground text-sm">{description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className={cn('ops-chip', faqFilter === 'all' && 'ops-chip-active')}
          onClick={() => setFaqFilter('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={cn('ops-chip', faqFilter === cat.value && 'ops-chip-active')}
            onClick={() => setFaqFilter(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-sm font-semibold mb-2 text-foreground">Quick answers</p>
          <ul className="space-y-3">
            {filteredCoreFaqs.map((faq, idx) => {
              const key = `core-${idx}`
              return (
                <li key={key} className="rounded-lg border border-border bg-muted/30 p-3">
                  <button
                    type="button"
                    className="w-full text-left flex items-center justify-between gap-3"
                    onClick={() => toggleFaq(key)}
                  >
                    <span className="font-semibold text-foreground">{faq.q}</span>
                    <span className="text-muted-foreground">{openFaq.includes(key) ? '−' : '+'}</span>
                  </button>
                  {openFaq.includes(key) && (
                    <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <Button type="button" variant="outline" size="sm" onClick={handleSeeMore} disabled={faqLoading}>
            {faqLoading ? 'Loading…' : showMoreFaqs ? 'Hide more questions' : 'See more questions'}
          </Button>
        </div>

        {showMoreFaqs && (
          <div>
            <p className="text-sm font-semibold mb-2 text-foreground">Admin-approved questions</p>
            {apiError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-3">
                {apiError}
              </div>
            )}
            {faqLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
              </div>
            ) : filteredMoreFaqs.length === 0 ? (
              <div className="rounded-lg p-4 text-sm bg-primary/5 text-foreground">
                No additional approved questions in this category yet. Use Ask Question to submit yours.
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredMoreFaqs.map((faq, idx) => {
                  const key = `db-${faq.id || idx}`
                  return (
                    <li key={key} className="rounded-lg border border-border bg-muted/30 p-3">
                      <button
                        type="button"
                        className="w-full text-left flex items-center justify-between gap-3"
                        onClick={() => toggleFaq(key)}
                      >
                        <span className="font-semibold text-foreground">{faq.q}</span>
                        <span className="text-muted-foreground">{openFaq.includes(key) ? '−' : '+'}</span>
                      </button>
                      {openFaq.includes(key) && (
                        <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
