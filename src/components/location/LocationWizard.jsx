import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Navigation, Search, Clock, Home, CheckCircle2,
  AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Building2,
} from 'lucide-react'
import apiClient from '../../services/apiClient'
import { unwrapApiList } from '../../utils/apiResponse'
import { getUserFacingErrorMessage } from '../../utils/userFacingError'
import { useAuth } from '../../context/AuthContext'
import { useSession } from '../../context/SessionContext'
import { useTheme } from '../../context/ThemeContext'
import { useLocationContext, findMatchingActiveZone } from '../../context/LocationContext'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import LocationWizardMap from './LocationWizardMap'

const DEFAULT_MAP_CENTER = { latitude: 17.385, longitude: 78.4867 }
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q='
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
  return {
    label: data?.display_name || '',
    city: data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || '',
    state: data?.address?.state || '',
    postalCode: data?.address?.postcode || '',
  }
}

export default function LocationWizard() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { isBootstrapping, hasEffectiveLocation } = useSession()
  const { isDark } = useTheme()
  const {
    isSelectorOpen,
    closeSelector,
    openSelector,
    wizardDetail,
    recentLocations,
    activeZones,
    checkLocationServiceable,
    submitLocationRequest,
    getLocationDemand,
    setSelectedLocation,
    isSavingLocation,
    selectedLocation,
    selectedLocationLabel,
    isSessionVerified,
    markSessionVerified,
  } = useLocationContext()

  const { profile } = useSession()

  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [askingGps, setAskingGps] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [confirming, setConfirming] = useState(null)
  const [confirmingCheck, setConfirmingCheck] = useState(null)
  const [checkingZone, setCheckingZone] = useState(false)
  const [mapLatitude, setMapLatitude] = useState(DEFAULT_MAP_CENTER.latitude)
  const [mapLongitude, setMapLongitude] = useState(DEFAULT_MAP_CENTER.longitude)
  const [mapLabel, setMapLabel] = useState('')
  const [mapLabelLoading, setMapLabelLoading] = useState(false)
  const [mapMeta, setMapMeta] = useState({ city: '', state: '', postalCode: '' })

  // Location Access Request & Demand State
  const [demandCount, setDemandCount] = useState(0)
  const [loadingDemand, setLoadingDemand] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestForm, setRequestForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    notes: '',
  })

  // Prefill request form if authenticated user
  useEffect(() => {
    if (profile) {
      setRequestForm((prev) => ({
        ...prev,
        userName: prev.userName || profile.username || '',
        userEmail: prev.userEmail || profile.email || '',
        userPhone: prev.userPhone || profile.phone || '',
      }))
    }
  }, [profile])

  const hasExistingLocation = Boolean(
    (selectedLocation?.latitude != null && selectedLocation?.longitude != null) ||
    selectedLocation?.id ||
    hasEffectiveLocation ||
    localStorage.getItem('farmeazy_selected_location')
  )

  const mustStayOpen = isAuthenticated
    && !isAuthLoading
    && !isBootstrapping
    && !isSessionVerified
    && !hasExistingLocation
    && (wizardDetail?.reason === 'SESSION_START' || wizardDetail?.reason === 'POST_LOGIN' || wizardDetail?.reason === 'MISSING_ON_BOOTSTRAP')
  const show = isAuthenticated && (isSelectorOpen || mustStayOpen)
  const isLocationRequired = wizardDetail?.reason === 'LOCATION_REQUIRED' || wizardDetail?.reason === 'SESSION_START' || wizardDetail?.reason === 'POST_LOGIN' || mustStayOpen

  useEffect(() => {
    if (isAuthenticated && mustStayOpen && !isSelectorOpen) {
      openSelector({ reason: 'SESSION_START', blocking: true })
    }
  }, [isAuthenticated, mustStayOpen, isSelectorOpen, openSelector])

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true)
    setAddressError('')
    try {
      const response = await apiClient.get('/addresses')
      const list = unwrapApiList(response?.data)
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
    if (!show) return

    if (selectedLocation?.latitude != null && selectedLocation?.longitude != null) {
      setMapLatitude(Number(selectedLocation.latitude))
      setMapLongitude(Number(selectedLocation.longitude))
      if (selectedLocation.label) setMapLabel(selectedLocation.label)
      return
    }

    const recent = Array.isArray(recentLocations) ? recentLocations[0] : null
    if (recent?.latitude != null && recent?.longitude != null) {
      setMapLatitude(Number(recent.latitude))
      setMapLongitude(Number(recent.longitude))
      if (recent.label) setMapLabel(recent.label)
      return
    }

    if (activeZones && activeZones.length > 0 && activeZones[0].latitude != null && activeZones[0].longitude != null) {
      setMapLatitude(Number(activeZones[0].latitude))
      setMapLongitude(Number(activeZones[0].longitude))
      setMapLabel(activeZones[0].locationName)
      return
    }

    setMapLatitude(DEFAULT_MAP_CENTER.latitude)
    setMapLongitude(DEFAULT_MAP_CENTER.longitude)
    setMapLabel('')
    updateMapFromCoords(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude)
  }, [show, selectedLocation, recentLocations, activeZones])

  const updateMapFromCoords = async (latitude, longitude, labelHint = '', meta = {}) => {
    setMapLatitude(latitude)
    setMapLongitude(longitude)

    let resolvedLabel = labelHint
    let resolvedMeta = {
      city: meta.city || '',
      state: meta.state || '',
      postalCode: meta.postalCode || '',
    }

    if (!labelHint) {
      setMapLabelLoading(true)
      try {
        const reverse = await reverseGeocode(latitude, longitude)
        resolvedLabel = reverse?.label || `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`
        resolvedMeta = {
          city: reverse?.city || '',
          state: reverse?.state || '',
          postalCode: reverse?.postalCode || '',
        }
      } catch {
        resolvedLabel = `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`
      } finally {
        setMapLabelLoading(false)
      }
    }

    setMapLabel(resolvedLabel)
    setMapMeta(resolvedMeta)
    return { label: resolvedLabel, ...resolvedMeta }
  }

  const handleMapLocationChange = (latitude, longitude) => {
    updateMapFromCoords(latitude, longitude)
  }

  const finalizeSelection = (payload) => {
    setAddressError('')
    markSessionVerified()
    closeSelector(true)
    navigate('/dashboard')
    setConfirming(null)
    setConfirmingCheck(null)

    setSelectedLocation(payload, { forceClose: true }).catch((err) => {
      console.warn('Location selection background persist error:', err)
    })
  }

  const handleLocationSelect = async (payload) => {
    setAddressError('')
    setRequestSubmitted(false)
    setRequestError('')

    // 1. Instant check: already marked serviceable or matches active delivery zones locally
    if (payload.isServiceable) {
      finalizeSelection(payload)
      return
    }

    const localMatch = findMatchingActiveZone(payload, activeZones)
    if (localMatch) {
      payload.isServiceable = true
      payload.matchedZoneName = localMatch.locationName
      payload.matchedZoneId = localMatch.id
      finalizeSelection(payload)
      return
    }

    // 2. Otherwise check with backend
    setCheckingZone(true)
    try {
      const checkResult = await checkLocationServiceable(payload)
      if (checkResult?.allowed) {
        // ACTIVE ZONE: Directly enter dashboard without intermediate confirmation
        payload.isServiceable = true
        payload.matchedZoneName = checkResult.matchedLocationName || null
        payload.matchedZoneId = checkResult.matchedLocationId || null
        finalizeSelection(payload)
      } else {
        // INACTIVE ZONE: Show inactive notice, demand counter, and request form
        setConfirming(payload)
        setConfirmingCheck(checkResult)
        setLoadingDemand(true)
        const count = await getLocationDemand({
          city: payload.city,
          postalCode: payload.postalCode,
          lat: payload.latitude,
          lng: payload.longitude,
        })
        setDemandCount(count || checkResult.requestCount || 0)
        setLoadingDemand(false)
      }
    } catch (_err) {
      setConfirming(payload)
      setConfirmingCheck({ allowed: false, message: 'Could not verify active zone status' })
    } finally {
      setCheckingZone(false)
    }
  }

  const confirmMapSelection = () => {
    handleLocationSelect({
      type: 'coords',
      latitude: mapLatitude,
      longitude: mapLongitude,
      label: mapLabel || `Lat ${mapLatitude.toFixed(4)}, Lon ${mapLongitude.toFixed(4)}`,
      city: mapMeta.city,
      state: mapMeta.state,
      postalCode: mapMeta.postalCode,
    })
  }

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
              city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || '',
              state: item.address?.state || '',
              postalCode: item.address?.postcode || '',
            }))
          : []
        setSearchResults(mapped)
      } catch {
        if (active) setSearchResults([])
      } finally {
        if (active) setSearchLoading(false)
      }
    }

    const timeout = setTimeout(runSearch, 350)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [searchQuery])

  const chooseCoords = (coords) => {
    handleLocationSelect({
      type: 'coords',
      label: coords.label,
      latitude: coords.latitude,
      longitude: coords.longitude,
      city: coords.city,
      state: coords.state,
      postalCode: coords.postalCode,
    })
  }

  const chooseActiveZone = (zone) => {
    const lat = zone.latitude != null ? Number(zone.latitude) : DEFAULT_MAP_CENTER.latitude
    const lng = zone.longitude != null ? Number(zone.longitude) : DEFAULT_MAP_CENTER.longitude
    const label = `${zone.locationName} (${zone.city || zone.state || 'Active Zone'})`

    const payload = {
      type: 'coords',
      latitude: lat,
      longitude: lng,
      label,
      city: zone.city,
      state: zone.state,
      postalCode: zone.postalCode,
      isServiceable: true,
      matchedZoneName: zone.locationName,
      matchedZoneId: zone.id,
    }

    finalizeSelection(payload)
  }

  const chooseAddress = (address) => {
    if (address?.latitude != null && address?.longitude != null) {
      setMapLatitude(Number(address.latitude))
      setMapLongitude(Number(address.longitude))
    }
    handleLocationSelect({
      type: 'address',
      id: address.id,
      label: buildAddressLabel(address),
      latitude: address.latitude,
      longitude: address.longitude,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      address,
    })
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setRequestError('')
    setSubmittingRequest(true)
    try {
      const payload = {
        userName: requestForm.userName || 'Valued User',
        userEmail: requestForm.userEmail,
        userPhone: requestForm.userPhone,
        locationName: confirming?.label || mapLabel,
        city: confirming?.city || mapMeta.city,
        state: confirming?.state || mapMeta.state,
        postalCode: confirming?.postalCode || mapMeta.postalCode,
        latitude: confirming?.latitude != null ? confirming.latitude : mapLatitude,
        longitude: confirming?.longitude != null ? confirming.longitude : mapLongitude,
        notes: requestForm.notes,
      }
      await submitLocationRequest(payload)
      setRequestSubmitted(true)
      setDemandCount((prev) => prev + 1)
    } catch (err) {
      setRequestError(getUserFacingErrorMessage(err, 'Failed to record coverage request. Please try again.'))
    } finally {
      setSubmittingRequest(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddressError('Geolocation is not supported in this browser.')
      return
    }

    setAddressError('')
    setAskingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude)
        const longitude = Number(position.coords.longitude)
        setAskingGps(false)

        // Instant local match against active delivery zones
        const localMatch = findMatchingActiveZone({ latitude, longitude }, activeZones)
        if (localMatch) {
          const payload = {
            type: 'coords',
            latitude,
            longitude,
            label: `${localMatch.locationName} (${localMatch.city || 'Active Zone'})`,
            city: localMatch.city,
            state: localMatch.state,
            postalCode: localMatch.postalCode,
            isServiceable: true,
            matchedZoneName: localMatch.locationName,
            matchedZoneId: localMatch.id,
          }
          finalizeSelection(payload)
          // Asynchronously enrich the label in the background via reverse geocoding
          reverseGeocode(latitude, longitude).then((rev) => {
            if (rev?.label) {
              setSelectedLocation({ ...payload, label: rev.label }, { forceClose: true }).catch(() => {})
            }
          }).catch(() => {})
          return
        }

        // If not immediate active zone match, update map and check serviceability
        updateMapFromCoords(latitude, longitude).then((resolved) => {
          handleLocationSelect({
            type: 'coords',
            latitude,
            longitude,
            label: resolved?.label || `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`,
            city: resolved?.city || '',
            state: resolved?.state || '',
            postalCode: resolved?.postalCode || '',
          })
        }).catch(() => {
          handleLocationSelect({
            type: 'coords',
            latitude,
            longitude,
            label: `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`,
          })
        })
      },
      (geoError) => {
        setAskingGps(false)
        if (geoError.code === 1) {
          setAddressError('Location permission was denied. Please allow browser location access or search your city.')
        } else {
          setAddressError('Unable to access GPS location. Please search for your area or pick an active zone below.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const canClose = isSessionVerified && hasExistingLocation && !mustStayOpen && !confirming
  const recents = useMemo(() => (Array.isArray(recentLocations) ? recentLocations : []), [recentLocations])

  if (!show) return null

  const title = isLocationRequired
    ? 'Choose your service location'
    : 'Change service location'
  const subtitle = 'Select your delivery area. Marketplace orders & logistics are verified for active delivery zones.'

  const isFullGating = !canClose || mustStayOpen || (confirming && confirmingCheck && !confirmingCheck.allowed)

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isFullGating
          ? 'bg-slate-950 overflow-y-auto'
          : 'bg-black/75 backdrop-blur-md'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-wizard-title"
    >
      {/* Ambient background glows for full gating mode */}
      {isFullGating && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
        </div>
      )}

      <div className={`relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border shadow-2xl p-5 sm:p-7 transition-all ${isDark ? 'bg-slate-900/95 border-emerald-500/20 text-slate-100 backdrop-blur-xl' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">FarmEazy Service Zone Network</span>
            </div>
            <h2 id="location-wizard-title" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
            {selectedLocationLabel && hasEffectiveLocation && !mustStayOpen && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                <span>Current:</span>
                <span className="text-foreground font-bold truncate max-w-xs">{selectedLocationLabel}</span>
              </div>
            )}
          </div>
          {canClose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeSelector}
              className="rounded-full px-3.5 py-1 text-xs font-semibold cursor-pointer shrink-0"
            >
              Close
            </Button>
          )}
        </div>

        {/* Confirmation & Inactive Zone Gate Stage */}
        {confirming ? (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-border bg-slate-950/60' : 'border-border bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected Location</span>
                {checkingZone && (
                  <span className="text-xs text-emerald-500 font-semibold animate-pulse">Verifying active zone access…</span>
                )}
              </div>

              <p className="mt-2 text-sm sm:text-base font-semibold text-foreground leading-relaxed">{confirming.label}</p>

              {/* Inactive Zone Notice & Community Demand */}
              {!checkingZone && confirmingCheck && !confirmingCheck.allowed && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-amber-800 dark:text-amber-200">
                          We don&apos;t operate in this location yet
                        </p>
                        <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                          {confirmingCheck.message || 'FarmEazy marketplace delivery and farm operations are restricted to active verified hubs.'}
                        </p>
                      </div>
                    </div>

                    {/* Live Demand Counter Badge */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/20 p-3.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl animate-bounce">🔥</span>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 dark:text-amber-300 block">Community Demand</span>
                          <span className="text-sm font-black text-amber-950 dark:text-amber-100">
                            {loadingDemand ? 'Calculating demand…' : `${demandCount} user${demandCount === 1 ? '' : 's'} requested service in this region`}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 shadow-sm">
                        High Expansion Priority
                      </Badge>
                    </div>

                    {/* Direct 1-Click Active Zone Switcher */}
                    {activeZones.length > 0 && (
                      <div className="rounded-xl bg-background/80 border border-border p-3.5 space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <span>📍</span> Instant Access — Switch to an Active Delivery Zone:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeZones.map((z) => (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() => chooseActiveZone(z)}
                              className="p-2.5 rounded-xl text-left bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-950 dark:text-emerald-100 transition-all border border-emerald-500/30 flex items-center justify-between group shadow-xs cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-xs">{z.locationName}</p>
                                <p className="text-[10px] opacity-75">{z.city || z.state} • {z.radiusKm || 5} km radius</p>
                              </div>
                              <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Coverage Form */}
                    {requestSubmitted ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-center space-y-2 animate-fadeIn">
                        <div className="h-10 w-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                          🎉 Your Coverage Request Has Been Recorded!
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                          You are request #{demandCount}. Our operations team reviews weekly rollouts and will notify you via Email and SMS as soon as FarmEazy goes live in this area.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRequestSubmit} className="space-y-3 pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Request Service Launch in this Area:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Your Name</label>
                            <input
                              type="text"
                              required
                              value={requestForm.userName}
                              onChange={(e) => setRequestForm({ ...requestForm, userName: e.target.value })}
                              placeholder="Full Name"
                              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Email Address (for notification)</label>
                            <input
                              type="email"
                              required
                              value={requestForm.userEmail}
                              onChange={(e) => setRequestForm({ ...requestForm, userEmail: e.target.value })}
                              placeholder="name@example.com"
                              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Mobile Phone (optional for SMS)</label>
                            <input
                              type="tel"
                              value={requestForm.userPhone}
                              onChange={(e) => setRequestForm({ ...requestForm, userPhone: e.target.value })}
                              placeholder="9876543210"
                              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Additional Notes / Landmarks</label>
                            <input
                              type="text"
                              value={requestForm.notes}
                              onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                              placeholder="e.g. Near Market Yard, 50+ farms in area"
                              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                        </div>

                        {requestError && (
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{requestError}</p>
                        )}

                        <Button
                          type="submit"
                          disabled={submittingRequest}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 shadow-md cursor-pointer"
                        >
                          {submittingRequest ? 'Submitting request…' : '🚀 Submit FarmEazy Coverage Request'}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfirming(null)
                    setConfirmingCheck(null)
                    setRequestSubmitted(false)
                  }}
                  className="font-semibold text-xs cursor-pointer"
                >
                  ← Choose Different Location
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Action: Swiggy/Zepto-like GPS Geolocation button */}
            <div className="mt-4">
              <button
                type="button"
                disabled={askingGps}
                onClick={useCurrentLocation}
                className="w-full rounded-2xl p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg transition-all duration-200 flex items-center justify-between group cursor-pointer disabled:opacity-75"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                    <Navigation className={`h-5 w-5 ${askingGps ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base">
                      {askingGps ? 'Detecting GPS location…' : 'Use Current Location (GPS)'}
                    </p>
                    <p className="text-xs text-white/80">
                      Instantly check if you are within an active delivery zone
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/70 group-hover:translate-x-1.5 transition-transform shrink-0" />
              </button>
            </div>

            {/* Active Delivery Zones Quick Selection Chips */}
            {activeZones && activeZones.length > 0 && (
              <section className="mt-4" aria-label="Configured active zones">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Serving in Active Operational Hubs
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">1-Click Launch</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeZones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => chooseActiveZone(zone)}
                      className={`group flex items-center justify-between gap-2 rounded-2xl border p-3 text-left text-xs transition-all shadow-xs cursor-pointer ${
                        isDark
                          ? 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/40 text-slate-100'
                          : 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-foreground">{zone.locationName}</p>
                          <p className="text-[10px] text-muted-foreground">{zone.city || zone.state} • {zone.radiusKm || 5} km radius</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 group-hover:bg-emerald-700 text-white text-[10px] font-bold shrink-0">
                        Active Hub
                      </Badge>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Map Preview with Active Zones Circles */}
            <div className="mt-4">
              <LocationWizardMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                onLocationChange={handleMapLocationChange}
                activeZones={activeZones}
                height={210}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>📍 Drag pin to check any area</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🟢 Green circles = Active delivery zones</span>
              </div>

              {(mapLabel || mapLabelLoading) && (
                <div className={`mt-3 rounded-2xl border p-3 flex items-center justify-between gap-3 ${isDark ? 'border-border bg-slate-950/60' : 'border-border bg-muted/20'}`}>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">Map Selection</p>
                    <p className="text-xs text-foreground font-medium truncate">
                      {mapLabelLoading ? 'Resolving address…' : mapLabel}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                    disabled={mapLabelLoading || isSavingLocation}
                    onClick={confirmMapSelection}
                  >
                    Check this pin
                  </Button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search area, landmark, city, or 6-digit pincode…"
                aria-label="Search for a location"
                className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none transition ${isDark ? 'bg-slate-950/80 border-border text-white placeholder:text-slate-500 focus:border-emerald-500/50' : 'bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500'}`}
              />
            </div>

            {addressError && (
              <div className={`mt-3 rounded-2xl border px-3.5 py-2.5 text-xs flex items-start gap-2 ${isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{addressError}</span>
              </div>
            )}

            {/* Search Results */}
            {searchQuery.trim().length >= 3 && (
              <section className="mt-4" aria-label="Search results">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5 mb-1.5">
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  Search Results
                </h3>
                <div className={`rounded-2xl border p-1 max-h-48 overflow-y-auto ${isDark ? 'border-border bg-slate-950/60' : 'border-border bg-muted/20'}`}>
                  {searchLoading && <div className="px-3 py-3 text-xs text-muted-foreground">Searching places…</div>}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="px-3 py-3 text-xs text-muted-foreground">No matches found for &quot;{searchQuery}&quot;. Try a nearby city or pincode.</div>
                  )}
                  {!searchLoading && searchResults.map((result, index) => (
                    <button
                      type="button"
                      key={`${result.latitude}:${result.longitude}:${index}`}
                      onClick={() => chooseCoords(result)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition flex items-center justify-between gap-2 cursor-pointer ${isDark ? 'hover:bg-muted/80' : 'hover:bg-white'}`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{result.label}</p>
                        <p className="text-[10px] text-muted-foreground">{result.city || result.state || 'India'}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Saved Addresses (if authenticated) */}
            {isAuthenticated && (
              <section className="mt-4" aria-label="Saved addresses">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    Saved Addresses
                  </h3>
                  <button
                    type="button"
                    onClick={() => { closeSelector(); navigate('/address-book'); }}
                    className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    + Manage addresses
                  </button>
                </div>
                <div className={`rounded-2xl border p-1 ${isDark ? 'border-border bg-slate-950/60' : 'border-border bg-muted/20'}`}>
                  {loadingAddresses && <div className="px-3 py-2.5 text-xs text-muted-foreground">Loading saved addresses…</div>}
                  {!loadingAddresses && savedAddresses.length === 0 && (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground">No saved addresses yet.</div>
                  )}
                  {!loadingAddresses && savedAddresses.map((address) => (
                    <button
                      type="button"
                      key={address.id}
                      onClick={() => chooseAddress(address)}
                      className={`w-full text-left rounded-xl px-3 py-2 transition flex items-center justify-between gap-2 cursor-pointer ${isDark ? 'hover:bg-muted/80' : 'hover:bg-white'}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate text-foreground">{buildAddressLabel(address)}</p>
                          {address.isDefault && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold uppercase">Default</Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Locations */}
            {recents.length > 0 && (
              <section className="mt-4" aria-label="Recent locations">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Recent Locations
                </h3>
                <div className={`rounded-2xl border p-1 ${isDark ? 'border-border bg-slate-950/60' : 'border-border bg-muted/20'}`}>
                  {recents.map((recent, index) => (
                    <button
                      type="button"
                      key={`${recent.type}:${recent.id || index}:${recent.latitude || ''}:${recent.longitude || ''}`}
                      onClick={() => chooseCoords(recent)}
                      className={`w-full text-left rounded-xl px-3 py-2 transition flex items-center justify-between gap-2 cursor-pointer ${isDark ? 'hover:bg-muted/80' : 'hover:bg-white'}`}
                    >
                      <p className="text-xs font-medium truncate text-foreground">{recent.label || `Recent ${index + 1}`}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
