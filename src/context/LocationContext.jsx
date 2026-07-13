import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../services/apiClient'

const LOCATION_STORAGE_KEY = 'farmeazy_selected_location'
const RECENT_STORAGE_KEY = 'farmeazy_recent_locations'
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

export function LocationProvider({ children }) {
  const [selectedLocation, setSelectedLocationState] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [locationVersion, setLocationVersion] = useState(0)

  useEffect(() => {
    const fromStorage = safeParse(localStorage.getItem(LOCATION_STORAGE_KEY))
    const normalized = normalizeLocationPayload(fromStorage)
    if (normalized) {
      setSelectedLocationState(normalized)
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
    recentLocations,
    isSelectorOpen,
    openSelector,
    closeSelector,
    setSelectedLocation: persistSelection,
    clearSelection,
  }), [selectedLocation, locationVersion, recentLocations, isSelectorOpen, openSelector, closeSelector, persistSelection, clearSelection])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used inside LocationProvider')
  }
  return context
}
