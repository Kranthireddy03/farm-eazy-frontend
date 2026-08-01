import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../services/apiClient'
import { STORAGE_KEYS } from '../config/api'

const LOCATION_STORAGE_KEY = 'farmeazy_selected_location'
const RECENT_STORAGE_KEY = 'farmeazy_recent_locations'
const LOCATION_SESSION_READY_KEY = 'farmeazy_location_session_ready'
const MAX_RECENT = 5

const LocationContext = createContext(null)

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeLocationPayload(payload) {
  if (!payload || typeof payload !== 'object') return null

  if (payload.type === 'coords' && payload.latitude != null && payload.longitude != null) {
    return {
      type: 'coords',
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      label: payload.label || payload.address || null,
      timestamp: Date.now(),
    }
  }

  if (payload.type === 'address' && payload.id != null) {
    return {
      type: 'address',
      id: Number(payload.id),
      label: payload.label || payload.addressLine1 || 'Saved address',
      latitude: payload.latitude != null ? Number(payload.latitude) : null,
      longitude: payload.longitude != null ? Number(payload.longitude) : null,
      address: payload.address || null,
      timestamp: Date.now(),
    }
  }

  return null
}

function buildLocationLabel(location) {
  if (!location) return ''
  if (location.label) return location.label
  if (location.type === 'coords' && location.latitude != null && location.longitude != null) {
    return `Lat ${Number(location.latitude).toFixed(3)}, Lon ${Number(location.longitude).toFixed(3)}`
  }
  if (location.type === 'address' && location.id != null) {
    return `Address #${location.id}`
  }
  return ''
}

function buildAddressLabel(address) {
  const parts = [address?.label, address?.addressLine1, address?.city, address?.state].filter(Boolean)
  return parts.join(', ')
}

function mergeRecent(nextLocation, previousRecent) {
  const base = Array.isArray(previousRecent) ? previousRecent : []
  const key = nextLocation.type === 'address' ? `address:${nextLocation.id}` : `coords:${nextLocation.latitude}:${nextLocation.longitude}`

  const deduped = base.filter((item) => {
    if (!item) return false
    const itemKey = item.type === 'address' ? `address:${item.id}` : `coords:${item.latitude}:${item.longitude}`
    return itemKey !== key
  })

  return [nextLocation, ...deduped].slice(0, MAX_RECENT)
}

function markLocationSessionReady() {
  sessionStorage.setItem(LOCATION_SESSION_READY_KEY, '1')
}

function clearLocationSessionReady() {
  sessionStorage.removeItem(LOCATION_SESSION_READY_KEY)
}

export function LocationProvider({ children }) {
  const [selectedLocation, setSelectedLocationState] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [locationVersion, setLocationVersion] = useState(0)
  const [isHydratingLocation, setIsHydratingLocation] = useState(false)
  const [locationSessionReady, setLocationSessionReady] = useState(
    () => sessionStorage.getItem(LOCATION_SESSION_READY_KEY) === '1'
  )

  useEffect(() => {
    const fromStorage = safeParse(localStorage.getItem(LOCATION_STORAGE_KEY))
    const normalized = normalizeLocationPayload(fromStorage)
    if (normalized) {
      setSelectedLocationState(normalized)
      if (!sessionStorage.getItem(LOCATION_SESSION_READY_KEY)) {
        markLocationSessionReady()
        setLocationSessionReady(true)
      }
    }

    const recent = safeParse(localStorage.getItem(RECENT_STORAGE_KEY), [])
    if (Array.isArray(recent)) {
      setRecentLocations(recent.map((entry) => normalizeLocationPayload(entry)).filter(Boolean))
    }
  }, [])

  const persistSelection = useCallback(async (payload, options = {}) => {
    const normalized = normalizeLocationPayload(payload)
    if (!normalized) {
      return null
    }

    setSelectedLocationState(normalized)
    setLocationVersion((previous) => previous + 1)
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(normalized))
    markLocationSessionReady()
    setLocationSessionReady(true)

    setRecentLocations((previous) => {
      const merged = mergeRecent(normalized, previous)
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(merged))
      return merged
    })

    if (normalized.type === 'address' && normalized.id != null && options.syncCurrentAddress !== false) {
      try {
        await apiClient.patch('/addresses/current', { addressId: normalized.id })
      } catch {
        // Non-blocking sync to backend
      }
    }

    window.dispatchEvent(new CustomEvent('farmeazy:location-changed', { detail: normalized }))
    return normalized
  }, [])

    const hydrateFromCurrentAddress = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
    if (!token) {
      markLocationSessionReady()
      setLocationSessionReady(true)
      return
    }

    if (locationSessionReady) {
      return
    }

    if (selectedLocation) {
      markLocationSessionReady()
      setLocationSessionReady(true)
      return
    }

    setIsHydratingLocation(true)
    try {
      const response = await apiClient.get('/addresses/current')
      const address = response?.data
      if (address?.id != null) {
        await persistSelection({
          type: 'address',
          id: address.id,
          label: buildAddressLabel(address),
          latitude: address.latitude,
          longitude: address.longitude,
          address,
        }, { syncCurrentAddress: false })
      }
    } catch {
      // No current address or endpoint unavailable — user will pick location once
    } finally {
      markLocationSessionReady()
      setLocationSessionReady(true)
      setIsHydratingLocation(false)
    }
  }, [locationSessionReady, persistSelection, selectedLocation])

  useEffect(() => {
    const onLogin = () => {
      clearLocationSessionReady()
      setLocationSessionReady(false)
      hydrateFromCurrentAddress()
    }
    const onLogout = () => {
      clearLocationSessionReady()
      setLocationSessionReady(false)
    }

    window.addEventListener('farmeazy:auth-login', onLogin)
    window.addEventListener('farmeazy:auth-logout', onLogout)
    return () => {
      window.removeEventListener('farmeazy:auth-login', onLogin)
      window.removeEventListener('farmeazy:auth-logout', onLogout)
    }
  }, [hydrateFromCurrentAddress])

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
    if (token && !locationSessionReady && !selectedLocation) {
      hydrateFromCurrentAddress()
    }
  }, [hydrateFromCurrentAddress, locationSessionReady, selectedLocation])

  const clearSelection = useCallback(() => {
    setSelectedLocationState(null)
    setLocationVersion((previous) => previous + 1)
    localStorage.removeItem(LOCATION_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('farmeazy:location-cleared'))
  }, [])

  const openSelector = useCallback(() => setIsSelectorOpen(true), [])
  const closeSelector = useCallback(() => setIsSelectorOpen(false), [])

  useEffect(() => {
    const onOpen = () => setIsSelectorOpen(true)
    window.addEventListener('farmeazy:open-location-modal', onOpen)
    return () => window.removeEventListener('farmeazy:open-location-modal', onOpen)
  }, [])

  const value = useMemo(() => ({
    selectedLocation,
    selectedLocationLabel: buildLocationLabel(selectedLocation),
    hasSelectedLocation: Boolean(selectedLocation),
    locationVersion,
    locationSessionReady,
    isHydratingLocation,
    recentLocations,
    isSelectorOpen,
    openSelector,
    closeSelector,
    setSelectedLocation: persistSelection,
    hydrateFromCurrentAddress,
    clearSelection,
  }), [
    selectedLocation,
    locationVersion,
    locationSessionReady,
    isHydratingLocation,
    recentLocations,
    isSelectorOpen,
    openSelector,
    closeSelector,
    persistSelection,
    hydrateFromCurrentAddress,
    clearSelection,
  ])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used inside LocationProvider')
  }
  return context
}
