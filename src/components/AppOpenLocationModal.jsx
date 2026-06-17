import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'

export default function AppOpenLocationModal() {
  const [show, setShow] = useState(false)
  const [asking, setAsking] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [addressError, setAddressError] = useState('')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const existing = localStorage.getItem('farmeazy_selected_location')
      if (!existing && isAuthenticated()) {
        setTimeout(() => setShow(true), 300)
      }
    } catch (e) {}

    const onOpen = () => setShow(true)
    window.addEventListener('farmeazy:open-location-modal', onOpen)
    return () => window.removeEventListener('farmeazy:open-location-modal', onOpen)
  }, [isAuthenticated])

  const reverseGeocodeLabel = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=14&addressdetails=1`
      )
      if (!response.ok) return null
      const data = await response.json()
      if (data?.display_name) return data.display_name
      if (data?.address) {
        const { road, neighbourhood, suburb, village, town, city, state, postcode, country } = data.address
        return [road || neighbourhood || suburb, village || town || city, state, postcode, country].filter(Boolean).join(', ')
      }
    } catch (error) {
      console.error('Reverse geocoding failed', error)
    }
    return null
  }

  const useCurrent = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported')
    setAsking(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const payload = { type: 'coords', latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      const label = await reverseGeocodeLabel(payload.latitude, payload.longitude)
      if (label) {
        payload.label = label
      }
      localStorage.setItem('farmeazy_selected_location', JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('farmeazy:location-changed', { detail: payload }))
      setShow(false)
      setAsking(false)
    }, (err) => { setAsking(false); alert('Failed to read current location: ' + (err.message || 'Denied')) })
  }

  const openAddressBook = () => { setShow(false); navigate('/address-book') }

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true)
    setAddressError('')
    try {
      const response = await apiClient.get('/addresses')
      setSavedAddresses(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to load saved addresses', error)
      setAddressError('Unable to load saved addresses. Please try again.')
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (!show) return
    fetchSavedAddresses()
  }, [show])

  const chooseAddress = (addr) => {
    const label = addr.city ? `${addr.fullName}, ${addr.city}` : addr.addressLine1 || addr.fullName
    const payload = {
      type: 'address',
      id: addr.id,
      label,
      address: {
        fullName: addr.fullName,
        phoneNumber: addr.phoneNumber,
        email: addr.email,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      },
    }
    localStorage.setItem('farmeazy_selected_location', JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('farmeazy:location-changed', { detail: payload }))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl p-6">
        <h3 className="text-lg font-bold mb-2">Choose your location</h3>
        <p className="text-sm text-gray-600 mb-4">Select current location or pick from your saved addresses. This will be used for deliveries and service availability.</p>
        <div className="flex gap-3 mb-3">
          <button onClick={useCurrent} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white">Use current location</button>
          <button onClick={openAddressBook} className="flex-1 px-4 py-2 rounded-lg border">Choose saved address</button>
        </div>
        <div className="text-sm text-gray-500 mb-2">Pick a saved address below or manage your address book.</div>

        <div className="max-h-64 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-2">
          {loadingAddresses && <div className="p-4 text-sm text-slate-500">Loading saved addresses…</div>}
          {addressError && <div className="p-4 text-sm text-red-600">{addressError}</div>}
          {!loadingAddresses && savedAddresses.length === 0 && (
            <div className="p-4 text-sm text-slate-500">No saved addresses found. Add one in the address book.</div>
          )}
          {!loadingAddresses && savedAddresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => chooseAddress(addr)}
              className="w-full text-left rounded-2xl border border-slate-200 bg-white px-3 py-3 mb-2 hover:border-emerald-300 hover:bg-emerald-50 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{addr.fullName || addr.addressLine1}</p>
                  <p className="text-xs text-slate-500 truncate">{addr.city ? `${addr.city}${addr.state ? ', ' + addr.state : ''}` : addr.addressLine1}</p>
                </div>
                {addr.isDefault && <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Default</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="text-right mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button onClick={openAddressBook} className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-100">Manage address book</button>
          <button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 hover:bg-slate-200">Skip for now</button>
        </div>
      </div>
    </div>
  )
}
