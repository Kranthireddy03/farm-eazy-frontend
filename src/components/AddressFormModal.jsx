import React, { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import LocationPicker from './LocationPicker'

export default function AddressFormModal({ address, onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: '', addressLine1: '', city: '', state: '', pinCode: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (address) setForm({
      fullName: address.fullName || '',
      addressLine1: address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      pinCode: address.pinCode || '',
      phone: address.phone || ''
    })
  }, [address])

  const change = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const save = async () => {
    const err = {}
    if (!form.addressLine1 || !form.addressLine1.trim()) err.addressLine1 = 'Address is required'
    if (!form.pinCode || !/^[0-9]{4,6}$/.test(String(form.pinCode))) err.pinCode = 'Enter a valid pin code'
    setErrors(err)
    if (Object.keys(err).length) return

    setSaving(true)
    try {
      if (address && address.id) {
        await apiClient.put(`/api/addresses/${address.id}`, form)
      } else {
        await apiClient.post('/api/addresses', form)
      }
      if (onSaved) await onSaved()
    } catch (err) {
      console.error('Failed to save address', err)
      alert('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleMapSelect = (loc) => {
    if (!loc) return
    setForm(prev => ({ ...prev, addressLine1: loc.display_name || prev.addressLine1, city: loc.city || prev.city, state: loc.state || prev.state, pinCode: loc.postcode || prev.pinCode }))
    setShowMap(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-xl p-6">
        <h3 className="text-lg font-bold mb-2">{address ? 'Edit Address' : 'Add Address'}</h3>
        <div className="grid grid-cols-1 gap-3">
          <input value={form.fullName} onChange={change('fullName')} placeholder="Full name" className="px-3 py-2 border rounded" />
          <div className="flex gap-2">
            <input value={form.addressLine1} onChange={change('addressLine1')} placeholder="Address line 1" className="flex-1 px-3 py-2 border rounded" />
            <button type="button" onClick={() => setShowMap(true)} className="px-3 py-2 rounded bg-slate-100">Pick on map</button>
          </div>
          {errors.addressLine1 && <div className="text-xs text-red-500">{errors.addressLine1}</div>}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.city} onChange={change('city')} placeholder="City" className="px-3 py-2 border rounded" />
            <input value={form.state} onChange={change('state')} placeholder="State" className="px-3 py-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={form.pinCode} onChange={change('pinCode')} placeholder="Pin code" className="px-3 py-2 border rounded" />
              {errors.pinCode && <div className="text-xs text-red-500">{errors.pinCode}</div>}
            </div>
            <input value={form.phone} onChange={change('phone')} placeholder="Phone" className="px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white">{saving ? 'Saving...' : 'Save'}</button>
        </div>
        {showMap && (
          <div className="mt-4 border-t pt-4">
            <LocationPicker onLocationSelect={handleMapSelect} initialAddress={address} />
          </div>
        )}
      </div>
    </div>
  )
}
