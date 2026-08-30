import { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { Button } from './ui/button'

export default function RateLimitOverlay() {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const onRateLimited = (event) => {
      setDetail(event.detail || { message: 'Too many requests. Please wait and try again.' })
    }
    window.addEventListener('farmeazy:rate-limited', onRateLimited)
    return () => window.removeEventListener('farmeazy:rate-limited', onRateLimited)
  }, [])

  if (!detail) return null

  const retrySeconds = Number(detail.retryAfter || 0)

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-labelledby="rate-limit-title"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card text-card-foreground shadow-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 id="rate-limit-title" className="text-lg font-bold">Please slow down</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {detail.message || 'You have made too many requests. Wait a moment and try again.'}
            </p>
            {retrySeconds > 0 && (
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Try again in about {retrySeconds} seconds.
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={() => setDetail(null)}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
