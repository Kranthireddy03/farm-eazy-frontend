import React, { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext'

export default function AddressSettings() {
  const { isDark } = useTheme()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ fullName: '', addressLine1: '', city: '', pincode: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const resp = await apiClient.get('/addresses')
      setAddresses(resp.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSaving(true)
    try {
      await apiClient.post('/addresses', form)
      setForm({ fullName: '', addressLine1: '', city: '', pincode: '', phone: '' })
      await load()
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Manage Addresses</h1>
        <div className="mb-4">Saved addresses are used for deliveries and location-based services.</div>

        <div className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {apiError && <div className="text-sm text-red-500">{apiError}</div>}
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="w-full px-3 py-2 rounded-lg border" />
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Address line 1" className="w-full px-3 py-2 rounded-lg border" />
            <div className="grid grid-cols-2 gap-2">
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="px-3 py-2 rounded-lg border" />
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="PIN" className="px-3 py-2 rounded-lg border" />
            </div>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full px-3 py-2 rounded-lg border" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">{saving ? 'Saving...' : 'Add address'}</button>
            </div>
          </form>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Saved Addresses</h2>
          {loading ? <div>Loading...</div> : (
            addresses.length ? addresses.map(a => (
              <div key={a.id} className="p-3 border rounded-lg">
                <div className="font-medium">{a.fullName}</div>
                <div className="text-sm text-gray-600">{a.addressLine1}{a.city ? ', ' + a.city : ''} {a.pincode ? ' - ' + a.pincode : ''}</div>
              </div>
            )) : <div className="text-sm text-gray-500">No saved addresses</div>
          )}
        </div>
      </div>
    </div>
  )
}
