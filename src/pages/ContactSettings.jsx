import React, { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

export default function ContactSettings() {
  const { isDark } = useTheme()
  const [form, setForm] = useState({ email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await apiClient.get('/user/contact')
        if (!mounted) return
        setForm({ email: resp.data?.email || '', phone: resp.data?.phone || '' })
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSaving(true)
    try {
      await apiClient.post('/user/contact', form)
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to update contact details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Contact Details</h1>
        <p className="mb-4 text-sm text-gray-600">Update your primary email and phone number. Use the same flow as Change Password UI for consistency.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {apiError && <div className="text-sm text-red-500">{apiError}</div>}
          <label className="text-sm font-medium">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" />

          <label className="text-sm font-medium">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" />

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">{saving ? 'Saving...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
