import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AppOpenLocationModal() {
  const [show, setShow] = useState(false)
  const [asking, setAsking] = useState(false)
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

  const useCurrent = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported')
    setAsking(true)
    navigator.geolocation.getCurrentPosition((pos) => {
      const payload = { type: 'coords', latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      localStorage.setItem('farmeazy_selected_location', JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('farmeazy:location-changed', { detail: payload }))
      setShow(false)
      setAsking(false)
    }, (err) => { setAsking(false); alert('Failed to read current location: ' + (err.message || 'Denied')) })
  }

  const openAddressBook = () => { setShow(false); navigate('/user/address') }

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
        <div className="text-sm text-gray-500 mb-2">Manage your saved addresses from the address book.</div>
        <div className="text-right mt-4">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm text-gray-600">Skip for now</button>
        </div>
      </div>
    </div>
  )
}
