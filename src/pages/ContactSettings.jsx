import React, { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'
import ChangeContact from '../components/Account/ChangeContact'

export default function ContactSettings() {
  const { isDark } = useTheme()
  const [contact, setContact] = useState({ email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [activeChange, setActiveChange] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await apiClient.get('/account/contact')
        if (!mounted) return
        setContact({ email: resp.data?.email || '', phone: resp.data?.phone || '' })
      } catch (_) {
        if (mounted) setErrorMessage('Unable to load contact details')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const loadContact = async () => {
    try {
      const resp = await apiClient.get('/account/contact')
      setContact({ email: resp.data?.email || '', phone: resp.data?.phone || '' })
    } catch (error) {
      setErrorMessage('Unable to reload contact details.')
    }
  }

  const handleSuccess = async (type) => {
    setStatusMessage(type === 'email' ? 'Email updated successfully.' : 'Phone number updated successfully.')
    setActiveChange(null)
    await loadContact()
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-background' : 'bg-background'}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-foreground dark:text-foreground">Contact Details</h1>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground dark:text-muted-foreground">
          Existing values are shown below. The first OTP is sent to your current contact to confirm ownership, and a second OTP is sent to the new contact before the change is finalized.
        </p>

        {statusMessage && <div className="mb-4 rounded-xl border border-border bg-primary/5 px-4 py-3 text-sm text-foreground dark:border-primary/40 dark:bg-primary/10 dark:text-primary/80">{statusMessage}</div>}
        {errorMessage && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-600/40 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</div>}

        {loading ? (
          <div className="rounded-3xl border border-border bg-muted/30 p-6 text-muted-foreground shadow-sm dark:border-border dark:bg-card dark:text-muted-foreground">Loading contact details…</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-muted/30 p-6 shadow-sm dark:border-border dark:bg-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Primary email</p>
                  <p className="mt-2 text-base font-semibold text-foreground dark:text-foreground break-words">{contact.email || 'Not set'}</p>
                </div>
                <button
                  onClick={() => setActiveChange(activeChange === 'email' ? null : 'email')}
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  {activeChange === 'email' ? 'Cancel' : 'Change email'}
                </button>
              </div>

              {activeChange === 'email' && (
                <div className="mt-6">
                  <ChangeContact type="email" currentValue={contact.email} onSuccess={() => handleSuccess('email')} />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-muted/30 p-6 shadow-sm dark:border-border dark:bg-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Primary phone</p>
                  <p className="mt-2 text-base font-semibold text-foreground dark:text-foreground break-words">{contact.phone || 'Not set'}</p>
                </div>
                <button
                  onClick={() => setActiveChange(activeChange === 'phone' ? null : 'phone')}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  {activeChange === 'phone' ? 'Cancel' : 'Change phone'}
                </button>
              </div>

              {activeChange === 'phone' && (
                <div className="mt-6">
                  <ChangeContact type="phone" currentValue={contact.phone} onSuccess={() => handleSuccess('phone')} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
