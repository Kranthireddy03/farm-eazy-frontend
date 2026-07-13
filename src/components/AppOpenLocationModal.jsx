import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLocationContext } from '../context/LocationContext'

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q='
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1'

function buildAddressLabel(address) {
  const parts = [address?.label, address?.addressLine1, address?.city, address?.state].filter(Boolean)
  return parts.join(', ')
}

async function reverseGeocode(latitude, longitude) {
  const url = `${NOMINATIM_REVERSE}&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const label = data?.display_name || ''
  const city = data?.address?.city || data?.address?.town || data?.address?.village || ''
  const state = data?.address?.state || ''
  const postalCode = data?.address?.postcode || ''
  return { label, city, state, postalCode }
}

export default function AppOpenLocationModal() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isDark } = useTheme()
  const {
    isSelectorOpen,
    closeSelector,
    openSelector,
    hasSelectedLocation,
    recentLocations,
    setSelectedLocation,
  } = useLocationContext()

  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [askingGps, setAskingGps] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  const mustStayOpen = isAuthenticated && !hasSelectedLocation
  const show = isSelectorOpen || mustStayOpen

  useEffect(() => {
    if (mustStayOpen && !isSelectorOpen) {
      openSelector()
    }
  }, [mustStayOpen, isSelectorOpen, openSelector])

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true)
    setAddressError('')
    try {
      const response = await apiClient.get('/addresses')
      const list = Array.isArray(response?.data) ? response.data : []
      setSavedAddresses(list)
    } catch {
      setAddressError('Unable to load saved addresses right now.')
      setSavedAddresses([])
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (!show || !isAuthenticated) return
    fetchSavedAddresses()
  }, [show, isAuthenticated])

  useEffect(() => {
    let active = true
    const runSearch = async () => {
      const query = searchQuery.trim()
      if (query.length < 3) {
        setSearchResults([])
        return
      }
      setSearchLoading(true)
      try {
        const response = await fetch(`${NOMINATIM_SEARCH}${encodeURIComponent(query)}`)
        const data = await response.json()
        if (!active) return
        const mapped = Array.isArray(data)
          ? data.map((item) => ({
              type: 'coords',
              label: item.display_name,
              latitude: Number(item.lat),
              longitude: Number(item.lon),
            }))
          : []
        setSearchResults(mapped)
      } catch {
        if (active) setSearchResults([])
      } finally {
        if (active) setSearchLoading(false)
      }
    }

    const timeout = setTimeout(runSearch, 300)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [searchQuery])

  const chooseAddress = async (address) => {
    await setSelectedLocation({
      type: 'address',
      id: address.id,
      label: buildAddressLabel(address),
      latitude: address.latitude,
      longitude: address.longitude,
      address,
    })
    closeSelector()
  }

  const chooseCoords = async (coordsPayload) => {
    await setSelectedLocation(coordsPayload)
    closeSelector()
  }

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setAddressError('Geolocation is not supported in this browser.')
      return
    }

    setAddressError('')
    setAskingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude)
        const longitude = Number(position.coords.longitude)
        const reverse = await reverseGeocode(latitude, longitude)
        await chooseCoords({
          type: 'coords',
          latitude,
          longitude,
          label: reverse?.label || `Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`,
        })
        setAskingGps(false)
      },
      () => {
        setAskingGps(false)
        setAddressError('Unable to access your GPS location. You can search or pick a saved address.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const canClose = !mustStayOpen
  const recents = useMemo(() => (Array.isArray(recentLocations) ? recentLocations : []), [recentLocations])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Select Delivery Location</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Location is required before you can use products, services, and marketplace features.
            </p>
          </div>
          {canClose && (
            <button type="button" onClick={closeSelector} className={`rounded-lg px-3 py-1 text-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
              Close
            </button>
          )}
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search address, area, or pincode"
            className={`w-full rounded-xl border px-3 py-2 text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={askingGps}
            onClick={useCurrentLocation}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 px-4 py-2 text-white font-semibold"
          >
            {askingGps ? 'Fetching GPS...' : 'Use Current Location'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/address-book')}
            className={`rounded-xl border px-4 py-2 font-semibold ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            Manage Saved Addresses
          </button>
        </div>

        {addressError && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {addressError}
          </div>
        )}

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Search Results</h3>
          <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            {searchLoading && <div className="px-2 py-3 text-sm">Searching...</div>}
            {!searchLoading && searchQuery.trim().length >= 3 && searchResults.length === 0 && (
              <div className="px-2 py-3 text-sm">No matches found.</div>
            )}
            {!searchLoading && searchResults.map((result, index) => (
              <button
                type="button"
                key={`${result.latitude}:${result.longitude}:${index}`}
                onClick={() => chooseCoords(result)}
                className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}
              >
                <p className="text-sm font-semibold">{result.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Saved Addresses</h3>
          <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            {loadingAddresses && <div className="px-2 py-3 text-sm">Loading saved addresses...</div>}
            {!loadingAddresses && savedAddresses.length === 0 && (
              <div className="px-2 py-3 text-sm">No saved addresses yet.</div>
            )}
            {!loadingAddresses && savedAddresses.map((address) => (
              <button
                type="button"
                key={address.id}
                onClick={() => chooseAddress(address)}
                className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold truncate">{buildAddressLabel(address)}</p>
                  {address.isDefault && <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">Default</span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Recent Locations</h3>
          <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            {recents.length === 0 && <div className="px-2 py-3 text-sm">No recent locations.</div>}
            {recents.map((recent, index) => (
              <button
                type="button"
                key={`${recent.type}:${recent.id || index}:${recent.latitude || ''}:${recent.longitude || ''}`}
                onClick={() => chooseCoords(recent)}
                className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}
              >
                <p className="text-sm font-semibold">{recent.label || `Recent ${index + 1}`}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
