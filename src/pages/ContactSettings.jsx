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
    <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-slate-900 dark:text-slate-100">Contact Details</h1>
        <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Update your primary email or phone with OTP verification. A secure two-step OTP flow is required before any contact changes are finalized.
        </p>

        {statusMessage && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-600/40 dark:bg-emerald-950/40 dark:text-emerald-200">{statusMessage}</div>}
        {errorMessage && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-600/40 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Loading contact details…</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary email</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100 break-words">{contact.email || 'Not set'}</p>
                </div>
                <button
                  onClick={() => setActiveChange(activeChange === 'email' ? null : 'email')}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {activeChange === 'email' ? 'Cancel' : 'Change email'}
                </button>
              </div>

              {activeChange === 'email' && (
                <div className="mt-6">
                  <ChangeContact type="email" onSuccess={() => handleSuccess('email')} />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary phone</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100 break-words">{contact.phone || 'Not set'}</p>
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
                  <ChangeContact type="phone" onSuccess={() => handleSuccess('phone')} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
