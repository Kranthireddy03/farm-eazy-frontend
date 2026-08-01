import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useLocationContext } from '../context/LocationContext'
import AppPage from '../components/layout/AppPage'
import apiClient from '../services/apiClient'

const EMPTY_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  label: '',
  latitude: '',
  longitude: '',
  isDefault: false,
}

function AddressBook() {
  const { isDark } = useTheme()
  const { setSelectedLocation } = useLocationContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/addresses')
      const data = Array.isArray(response?.data) ? response.data : []
      setAddresses(data)
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to load addresses right now.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim() || 'India',
      label: form.label.trim() || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
    }

    try {
      if (editingId) {
        await apiClient.put(`/addresses/${editingId}`, payload)
        setMessage({ type: 'success', text: 'Address updated successfully.' })
      } else {
        await apiClient.post('/addresses', payload)
        setMessage({ type: 'success', text: 'Address added successfully.' })
      }

      resetForm()
      await loadAddresses()
    } catch (_error) {
      setMessage({ type: 'error', text: 'Could not save address. Please check the fields and retry.' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (address) => {
    setEditingId(address.id)
    setForm({
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber || '',
      email: address.email || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
      label: address.label || '',
      latitude: address.latitude ?? '',
      longitude: address.longitude ?? '',
      isDefault: Boolean(address.isDefault),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setDefault = async (id) => {
    try {
      await apiClient.post(`/addresses/${id}/default`)
      setMessage({ type: 'success', text: 'Default address updated.' })
      await loadAddresses()
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to set default address.' })
    }
  }

  const setAsCurrentLocation = async (address) => {
    try {
      await apiClient.patch('/addresses/current', { addressId: address.id })
      await setSelectedLocation({
        type: 'address',
        id: address.id,
        label: [address.label, address.addressLine1, address.city, address.state].filter(Boolean).join(', '),
        latitude: address.latitude,
        longitude: address.longitude,
        address,
      }, { syncCurrentAddress: false })
      setMessage({ type: 'success', text: 'Current location updated from address.' })
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to set this as current location.' })
    }
  }

  const removeAddress = async (id) => {
    try {
      await apiClient.delete(`/addresses/${id}`)
      setMessage({ type: 'success', text: 'Address deleted.' })
      await loadAddresses()
      if (editingId === id) {
        resetForm()
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Unable to delete address.' })
    }
  }

  const defaultCount = addresses.filter((address) => address.isDefault).length
  const uniqueCities = new Set(addresses.map((address) => address.city).filter(Boolean)).size

  return (
    <AppPage
      title="Address Book"
      description="Save delivery addresses for orders and vendor profile requirements."
    >
      <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border/60'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Saved</p>
          <p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>{addresses.length}</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border/60'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Default</p>
          <p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>{defaultCount}</p>
        </div>
        <div className={`ops-panel interactive-card rounded-xl border p-4 ${isDark ? 'border-border' : 'border-border/60'}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Cities</p>
          <p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-foreground'}`}>{uniqueCities}</p>
        </div>
      </div>

      {message.text && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'error'
          ? (isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
          : (isDark ? 'bg-emerald-950/30 border-emerald-800 text-primary' : 'bg-primary/5 border-border text-primary')}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`ops-panel interactive-card rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
        <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Phone Number" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Postal Code" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="label" value={form.label} onChange={handleChange} placeholder="Label (Home/Farm/Office)" className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="latitude" type="number" step="0.000001" value={form.latitude} onChange={handleChange} placeholder="Latitude (optional)" className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="longitude" type="number" step="0.000001" value={form.longitude} onChange={handleChange} placeholder="Longitude (optional)" className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Address Line 1" required className={`px-3 py-2 rounded-lg border md:col-span-2 ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Address Line 2" className={`px-3 py-2 rounded-lg border md:col-span-2 ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="city" value={form.city} onChange={handleChange} placeholder="City" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />
        <input name="state" value={form.state} onChange={handleChange} placeholder="State" required className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-muted border-border text-white' : 'bg-background border-border text-foreground'}`} />

        <label className={`text-sm flex items-center gap-2 md:col-span-2 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
          <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} />
          Set as default address
        </label>

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted'}`}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className={`ops-panel interactive-card rounded-2xl border p-5 ${isDark ? 'border-border' : 'border-border shadow-sm'}`}>
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>Saved Addresses</h2>

        {loading ? (
          <div className="mt-3 text-sm text-muted-foreground">Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No addresses found. Add one to complete profile location.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className={`rounded-lg border p-3 ${isDark ? 'border-border bg-muted' : 'border-border bg-muted/30'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`font-semibold ${isDark ? 'text-foreground' : 'text-foreground'}`}>
                    {address.fullName}
                    {address.isDefault && <span className="ml-2 text-xs text-primary font-bold">DEFAULT</span>}
                  </p>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button type="button" onClick={() => setDefault(address.id)} className="px-2 py-1 text-xs rounded bg-primary text-white hover:bg-primary/90">Set Default</button>
                    )}
                    <button type="button" onClick={() => setAsCurrentLocation(address)} className="px-2 py-1 text-xs rounded bg-violet-600 text-white hover:bg-violet-700">Set Current</button>
                    <button type="button" onClick={() => startEdit(address)} className="px-2 py-1 text-xs rounded bg-cyan-600 text-white hover:bg-cyan-700">Edit</button>
                    <button type="button" onClick={() => removeAddress(address.id)} className="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700">Delete</button>
                  </div>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state} {address.postalCode}
                </p>
                {(address.latitude != null && address.longitude != null) && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    Coords: {Number(address.latitude).toFixed(5)}, {Number(address.longitude).toFixed(5)}
                  </p>
                )}
                <p className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {address.phoneNumber} | {address.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </AppPage>
  )
}

export default AddressBook
