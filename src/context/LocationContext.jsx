import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../services/apiClient'
import LocationService from '../services/LocationService'
import { flushLocationRetryQueue } from '../services/locationApiBridge'
import { persistCoordsAsCurrentAddress } from '../services/locationPersistenceService'
import { useSession } from './SessionContext'


const LOCATION_STORAGE_KEY = 'farmeazy_selected_location'
const LOCATION_CONFIGURED_KEY = 'farmeazy_location_configured'
const RECENT_STORAGE_KEY = 'farmeazy_recent_locations'
const ACTIVE_ZONES_KEY = 'farmeazy_active_zones'
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
      city: payload.city || '',
      state: payload.state || '',
      postalCode: payload.postalCode || '',
      isServiceable: payload.isServiceable !== undefined ? Boolean(payload.isServiceable) : null,
      matchedZoneName: payload.matchedZoneName || null,
      matchedZoneId: payload.matchedZoneId || null,
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
      city: payload.city || payload.address?.city || '',
      state: payload.state || payload.address?.state || '',
      postalCode: payload.postalCode || payload.address?.postalCode || '',
      address: payload.address || null,
      isServiceable: payload.isServiceable !== undefined ? Boolean(payload.isServiceable) : null,
      matchedZoneName: payload.matchedZoneName || null,
      matchedZoneId: payload.matchedZoneId || null,
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

const SESSION_LOCATION_KEY = 'farmeazy_session_location_selected'

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function findMatchingActiveZone(payload, zones) {
  if (!payload || !Array.isArray(zones) || zones.length === 0) return null
  const lat = Number(payload.latitude)
  const lng = Number(payload.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  for (const zone of zones) {
    if (!zone) continue
    if (payload.matchedZoneId && Number(zone.id) === Number(payload.matchedZoneId)) {
      return zone
    }
    if (payload.matchedZoneName && String(zone.locationName).toLowerCase() === String(payload.matchedZoneName).toLowerCase()) {
      return zone
    }
    // Check coordinate distance with zone radius
    if (hasCoords && zone.latitude != null && zone.longitude != null) {
      const zLat = Number(zone.latitude)
      const zLng = Number(zone.longitude)
      const radiusKm = Number(zone.radiusKm) || 10
      const d = haversineDistance(lat, lng, zLat, zLng)
      if (d <= radiusKm) {
        return zone
      }
    }
    // Check city / postal match
    if (payload.postalCode && zone.postalCode && String(payload.postalCode).trim() === String(zone.postalCode).trim()) {
      return zone
    }
    if (payload.city && zone.city && String(payload.city).trim().toLowerCase() === String(zone.city).trim().toLowerCase()) {
      return zone
    }
  }
  return null
}

export function LocationProvider({ children }) {
  const { refreshProfile, hasEffectiveLocation, profile } = useSession()
  const [selectedLocation, setSelectedLocationState] = useState(null)
  const [recentLocations, setRecentLocations] = useState([])
  const [activeZones, setActiveZones] = useState([])
  const [activeZoneStatus, setActiveZoneStatus] = useState({ allowed: true, message: '', matchedLocationName: null })
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [wizardDetail, setWizardDetail] = useState(null)
  const [locationVersion, setLocationVersion] = useState(0)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [loadingActiveZones, setLoadingActiveZones] = useState(false)
  const [isSessionVerified, setIsSessionVerified] = useState(() => {
    try {
      return (
        localStorage.getItem(LOCATION_CONFIGURED_KEY) === 'true' ||
        sessionStorage.getItem(SESSION_LOCATION_KEY) === 'true' ||
        Boolean(localStorage.getItem(LOCATION_STORAGE_KEY))
      )
    } catch {
      return false
    }
  })

  const markSessionVerified = useCallback(() => {
    try {
      localStorage.setItem(LOCATION_CONFIGURED_KEY, 'true')
      sessionStorage.setItem(SESSION_LOCATION_KEY, 'true')
      setIsSessionVerified(true)
    } catch (_e) {
      setIsSessionVerified(true)
    }
  }, [])

  const fetchActiveZones = useCallback(async () => {
    setLoadingActiveZones(true)
    try {
      const zones = await LocationService.getActiveZones()
      setActiveZones(zones)
      localStorage.setItem(ACTIVE_ZONES_KEY, JSON.stringify(zones))
      return zones
    } catch (_err) {
      const fromStorage = safeParse(localStorage.getItem(ACTIVE_ZONES_KEY), [])
      setActiveZones(fromStorage)
      return fromStorage
    } finally {
      setLoadingActiveZones(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveZones()
  }, [fetchActiveZones])

  // Prompt location selection for authenticated user sessions only once if no location exists
  useEffect(() => {
    const hasAuthToken = Boolean(localStorage.getItem('token') || localStorage.getItem('farmEazy_token'))
    if (!hasAuthToken && !profile) {
      return
    }
    const hasStoredLocation = Boolean(localStorage.getItem(LOCATION_STORAGE_KEY))
    const isConfigured = localStorage.getItem(LOCATION_CONFIGURED_KEY) === 'true'
    const verified = sessionStorage.getItem(SESSION_LOCATION_KEY) === 'true'

    if (hasStoredLocation || isConfigured || verified || hasEffectiveLocation) {
      markSessionVerified()
      return
    }

    setIsSelectorOpen(true)
    setWizardDetail({ reason: 'SESSION_START', blocking: true })
  }, [profile, hasEffectiveLocation, markSessionVerified])

  // Listen for login event: prompt location selection once per session
  useEffect(() => {
    const onLogin = () => {
      try {
        const verified = sessionStorage.getItem(SESSION_LOCATION_KEY) === 'true'
        if (verified) {
          markSessionVerified()
          return
        }
        setIsSelectorOpen(true)
        setWizardDetail({ reason: 'POST_LOGIN', blocking: true })
      } catch (_e) {}
    }
    window.addEventListener('farmeazy:auth-login', onLogin)
    return () => window.removeEventListener('farmeazy:auth-login', onLogin)
  }, [markSessionVerified])

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

  const checkLocationServiceable = useCallback(async (payload) => {
    if (!payload) return { allowed: false, message: 'No location provided', activeZones: [] }
    const checkPayload = {
      latitude: payload.latitude != null ? payload.latitude : null,
      longitude: payload.longitude != null ? payload.longitude : null,
      city: payload.city || null,
      state: payload.state || null,
      postalCode: payload.postalCode || null,
      addressId: payload.id || null,
    }
    return await LocationService.checkLocationStatus(checkPayload)
  }, [])

  const submitLocationRequest = useCallback(async (payload) => {
    return await LocationService.submitLocationRequest(payload)
  }, [])

  const getLocationDemand = useCallback(async (params) => {
    return await LocationService.getLocationDemand(params)
  }, [])

  const applySelectionState = useCallback((normalized) => {
    setSelectedLocationState(normalized)
    setLocationVersion((previous) => previous + 1)
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(normalized))

    setRecentLocations((previous) => {
      const merged = mergeRecent(normalized, previous)
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(merged))
      return merged
    })

    window.dispatchEvent(new CustomEvent('farmeazy:location-changed', { detail: normalized }))
  }, [])

  const persistSelection = useCallback(async (payload, options = {}) => {
    let normalized = normalizeLocationPayload(payload)
    if (!normalized) {
      return null
    }

    setIsSavingLocation(true)
    try {
      // 1. Instant check: already known serviceable or matches active zones locally
      let isAllowed = normalized.isServiceable === true
      let matchedZone = null

      if (!isAllowed) {
        matchedZone = findMatchingActiveZone(normalized, activeZones)
        if (matchedZone) {
          isAllowed = true
          normalized.isServiceable = true
          normalized.matchedZoneName = matchedZone.locationName
          normalized.matchedZoneId = matchedZone.id
        }
      }

      let checkStatus = { allowed: isAllowed, matchedLocationName: normalized.matchedZoneName || null }

      // 2. Fallback to API check only if serviceability is still not determined
      if (!isAllowed) {
        try {
          checkStatus = await checkLocationServiceable(normalized)
          isAllowed = Boolean(checkStatus?.allowed)
          normalized.isServiceable = isAllowed
          if (isAllowed) {
            normalized.matchedZoneName = checkStatus.matchedLocationName || null
            normalized.matchedZoneId = checkStatus.matchedLocationId || null
          }
        } catch (_e) {
          // If check fails, keep tentative
        }
      }

      setActiveZoneStatus({
        allowed: isAllowed,
        message: checkStatus?.message || (isAllowed ? 'Service is available in your current location' : ''),
        matchedLocationName: normalized.matchedZoneName || checkStatus?.matchedLocationName || null,
      })

      if (isAllowed) {
        markSessionVerified()
      }

      // 3. Immediately apply selection state to storage & context (Instant UI update)
      applySelectionState(normalized)
      markSessionVerified()

      if (isAllowed || options.forceClose) {
        setIsSelectorOpen(false)
        setWizardDetail(null)
      }

      // 4. Background persistence: asynchronously save address and refresh profile without blocking navigation
      const syncBackendAsync = async () => {
        try {
          let updatedPayload = { ...normalized }
          if (normalized.type === 'coords') {
            try {
              const persisted = await persistCoordsAsCurrentAddress(normalized, profile)
              if (persisted?.id) {
                updatedPayload = { ...updatedPayload, id: persisted.id, address: persisted.address }
                applySelectionState(updatedPayload)
              }
            } catch (addrErr) {
              console.warn('Backend address creation failed, proceeding with coordinates selection:', addrErr)
            }
          }

          if (normalized.type === 'address' && normalized.id != null && options.syncCurrentAddress !== false) {
            try {
              await apiClient.patch('/addresses/current', { addressId: normalized.id })
            } catch (addrErr) {
              console.warn('Current address update failed:', addrErr)
            }
          }

          if (options.refreshProfile !== false) {
            try {
              await refreshProfile()
            } catch (_e) {
              // Best-effort
            }
          }

          try {
            await flushLocationRetryQueue()
          } catch (_e) {
            // Non-blocking
          }
        } catch (syncErr) {
          console.warn('Background location sync error:', syncErr)
        }
      }

      // Fire in background
      syncBackendAsync()

      return { location: normalized, status: checkStatus }
    } finally {
      setIsSavingLocation(false)
    }
  }, [applySelectionState, refreshProfile, profile, checkLocationServiceable, markSessionVerified, activeZones])

  const syncFromProfile = useCallback((locationSelection) => {
    const normalized = normalizeLocationPayload(locationSelection)
    if (!normalized) return
    applySelectionState(normalized)
  }, [applySelectionState])

  useEffect(() => {
    const onProfileLoaded = (event) => {
      const selection = event?.detail?.locationSelection
      if (selection) {
        syncFromProfile(selection)
      }
    }

    window.addEventListener('farmeazy:profile-loaded', onProfileLoaded)
    return () => window.removeEventListener('farmeazy:profile-loaded', onProfileLoaded)
  }, [syncFromProfile])

  useEffect(() => {
    const onOpen = (event) => {
      setWizardDetail(event?.detail || null)
      setIsSelectorOpen(true)
    }
    window.addEventListener('farmeazy:open-location-modal', onOpen)
    return () => window.removeEventListener('farmeazy:open-location-modal', onOpen)
  }, [])

  useEffect(() => {
    const onLogout = () => {
      setLocationVersion((previous) => previous + 1)
      try {
        sessionStorage.removeItem(SESSION_LOCATION_KEY)
      } catch (_e) {}
      setIsSelectorOpen(false)
      setWizardDetail(null)
      window.dispatchEvent(new CustomEvent('farmeazy:location-cleared'))
    }
    window.addEventListener('farmeazy:auth-logout', onLogout)
    return () => window.removeEventListener('farmeazy:auth-logout', onLogout)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedLocationState(null)
    setLocationVersion((previous) => previous + 1)
    localStorage.removeItem(LOCATION_STORAGE_KEY)
    localStorage.removeItem(LOCATION_CONFIGURED_KEY)
    try {
      sessionStorage.removeItem(SESSION_LOCATION_KEY)
    } catch (_e) {}
    setIsSessionVerified(false)
    window.dispatchEvent(new CustomEvent('farmeazy:location-cleared'))
  }, [])

  const openSelector = useCallback((detail = null) => {
    setWizardDetail(detail)
    setIsSelectorOpen(true)
  }, [])

  const closeSelector = useCallback((force = false) => {
    if (force === true) {
      setIsSelectorOpen(false)
      setWizardDetail(null)
      return
    }

    const hasAuthToken = Boolean(localStorage.getItem('token') || localStorage.getItem('farmEazy_token'))
    const hasLocation = Boolean(
      selectedLocation ||
      localStorage.getItem(LOCATION_STORAGE_KEY) ||
      hasEffectiveLocation
    )

    // If verified or has location, permit closing cleanly
    if (isSessionVerified || hasLocation) {
      setIsSelectorOpen(false)
      setWizardDetail(null)
      return
    }

    const sessionRestricted = hasAuthToken && !isSessionVerified && (wizardDetail?.reason === 'SESSION_START' || wizardDetail?.reason === 'POST_LOGIN')
    const mustStayOpen = sessionRestricted
      || (hasAuthToken && !hasEffectiveLocation && !isSessionVerified)
      || (hasAuthToken && wizardDetail?.reason === 'MISSING_ON_BOOTSTRAP')
      || (hasAuthToken && wizardDetail?.reason === 'LOCATION_REQUIRED')

    if (mustStayOpen) {
      return
    }
    setIsSelectorOpen(false)
    setWizardDetail(null)
  }, [hasEffectiveLocation, wizardDetail, isSessionVerified, selectedLocation])

  const isServiceable = selectedLocation?.isServiceable !== false

  const value = useMemo(() => ({
    selectedLocation,
    selectedLocationLabel: buildLocationLabel(selectedLocation),
    hasSelectedLocation: Boolean(selectedLocation),
    hasEffectiveLocation,
    isServiceable,
    isSessionVerified,
    activeZones,
    activeZoneStatus,
    loadingActiveZones,
    locationVersion,
    isSavingLocation,
    recentLocations,
    isSelectorOpen,
    wizardDetail,
    fetchActiveZones,
    checkLocationServiceable,
    submitLocationRequest,
    getLocationDemand,
    markSessionVerified,
    openSelector,
    closeSelector,
    setSelectedLocation: persistSelection,
    clearSelection,
  }), [
    selectedLocation,
    hasEffectiveLocation,
    isServiceable,
    isSessionVerified,
    activeZones,
    activeZoneStatus,
    loadingActiveZones,
    locationVersion,
    isSavingLocation,
    recentLocations,
    isSelectorOpen,
    wizardDetail,
    fetchActiveZones,
    checkLocationServiceable,
    submitLocationRequest,
    getLocationDemand,
    markSessionVerified,
    openSelector,
    closeSelector,
    persistSelection,
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
