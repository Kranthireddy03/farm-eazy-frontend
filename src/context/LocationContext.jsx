import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../services/apiClient'
import LocationService from '../services/LocationService'
import { flushLocationRetryQueue } from '../services/locationApiBridge'
import { persistCoordsAsCurrentAddress } from '../services/locationPersistenceService'
import { useSession } from './SessionContext'

const LOCATION_STORAGE_KEY = 'farmeazy_selected_location'
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
      return sessionStorage.getItem(SESSION_LOCATION_KEY) === 'true'
    } catch {
      return false
    }
  })

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

  // Prompt location selection on every new session
  useEffect(() => {
    try {
      const verified = sessionStorage.getItem(SESSION_LOCATION_KEY) === 'true'
      if (!verified) {
        setIsSelectorOpen(true)
        setWizardDetail({ reason: 'SESSION_START', blocking: true })
      }
    } catch (_e) {
      // sessionStorage unavailable
    }
  }, [])

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

  const markSessionVerified = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_LOCATION_KEY, 'true')
      setIsSessionVerified(true)
    } catch (_e) {
      setIsSessionVerified(true)
    }
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
      // Validate serviceability against active delivery zones
      const status = await checkLocationServiceable(normalized)
      normalized.isServiceable = Boolean(status?.allowed)
      normalized.matchedZoneName = status?.matchedLocationName || null
      normalized.matchedZoneId = status?.matchedLocationId || null

      setActiveZoneStatus({
        allowed: Boolean(status?.allowed),
        message: status?.message || '',
        matchedLocationName: status?.matchedLocationName || null,
      })

      if (normalized.isServiceable) {
        markSessionVerified()
      }

      if (normalized.type === 'coords') {
        normalized = await persistCoordsAsCurrentAddress(normalized, profile)
      }

      if (normalized.type === 'address' && normalized.id != null && options.syncCurrentAddress !== false) {
        await apiClient.patch('/addresses/current', { addressId: normalized.id })
      }

      applySelectionState(normalized)

      try {
        if (options.refreshProfile !== false) {
          await refreshProfile()
        }
      } catch (_e) {
        // Profile refresh is best-effort after selection
      }

      try {
        await flushLocationRetryQueue()
      } catch (_e) {
        // Non-blocking
      }

      if (normalized.isServiceable || options.forceClose) {
        setIsSelectorOpen(false)
        setWizardDetail(null)
      }

      return { location: normalized, status }
    } finally {
      setIsSavingLocation(false)
    }
  }, [applySelectionState, refreshProfile, profile, checkLocationServiceable, markSessionVerified])

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
      setSelectedLocationState(null)
      setLocationVersion((previous) => previous + 1)
      localStorage.removeItem(LOCATION_STORAGE_KEY)
      try {
        sessionStorage.removeItem(SESSION_LOCATION_KEY)
      } catch (_e) {}
      setIsSessionVerified(false)
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

  const closeSelector = useCallback(() => {
    const sessionRestricted = !isSessionVerified && wizardDetail?.reason === 'SESSION_START'
    const mustStayOpen = sessionRestricted
      || (!hasEffectiveLocation && !isSessionVerified)
      || wizardDetail?.blocking
      || wizardDetail?.reason === 'MISSING_ON_BOOTSTRAP'
      || wizardDetail?.reason === 'LOCATION_REQUIRED';
    if (mustStayOpen) {
      return;
    }
    setIsSelectorOpen(false);
    setWizardDetail(null);
  }, [hasEffectiveLocation, wizardDetail, isSessionVerified]);

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
