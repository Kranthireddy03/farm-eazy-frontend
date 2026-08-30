import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Search, Clock, Home } from 'lucide-react'
import apiClient from '../../services/apiClient'
import { unwrapApiList } from '../../utils/apiResponse'
import { getUserFacingErrorMessage } from '../../utils/userFacingError'
import { useAuth } from '../../context/AuthContext'
import { useSession } from '../../context/SessionContext'
import { useTheme } from '../../context/ThemeContext'
import { useLocationContext } from '../../context/LocationContext'
import { Button } from '../ui/button'
import LocationWizardMap from './LocationWizardMap'

const DEFAULT_MAP_CENTER = { latitude: 17.385, longitude: 78.4867 }
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
  return {
    label: data?.display_name || '',
    city: data?.address?.city || data?.address?.town || data?.address?.village || '',
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
    setSelectedLocation,
    isSavingLocation,
    selectedLocation,
    selectedLocationLabel,
  } = useLocationContext()

  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [askingGps, setAskingGps] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [confirming, setConfirming] = useState(null)
  const [mapLatitude, setMapLatitude] = useState(DEFAULT_MAP_CENTER.latitude)
  const [mapLongitude, setMapLongitude] = useState(DEFAULT_MAP_CENTER.longitude)
  const [mapLabel, setMapLabel] = useState('')
  const [mapLabelLoading, setMapLabelLoading] = useState(false)
  const [mapMeta, setMapMeta] = useState({ city: '', state: '', postalCode: '' })

  const mustStayOpen = isAuthenticated && !isAuthLoading && !isBootstrapping && !hasEffectiveLocation
  const show = isSelectorOpen || mustStayOpen
  const isLocationRequired = wizardDetail?.reason === 'LOCATION_REQUIRED' || mustStayOpen

  useEffect(() => {
    if (mustStayOpen && !isSelectorOpen) {
      openSelector({ reason: 'MISSING_ON_BOOTSTRAP', blocking: true })
    }
  }, [mustStayOpen, isSelectorOpen, openSelector])

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

    setMapLatitude(DEFAULT_MAP_CENTER.latitude)
    setMapLongitude(DEFAULT_MAP_CENTER.longitude)
    setMapLabel('')
    updateMapFromCoords(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude)
  }, [show, selectedLocation, recentLocations])

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
        resolvedLabel = reverse?.label || `Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`
        resolvedMeta = {
          city: reverse?.city || '',
          state: reverse?.state || '',
          postalCode: reverse?.postalCode || '',
        }
      } catch {
        resolvedLabel = `Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`
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

  const confirmMapSelection = () => {
    chooseCoords({
      type: 'coords',
      latitude: mapLatitude,
      longitude: mapLongitude,
      label: mapLabel || `Lat ${mapLatitude.toFixed(3)}, Lon ${mapLongitude.toFixed(3)}`,
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
              city: item.address?.city || item.address?.town || item.address?.village || '',
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

    const timeout = setTimeout(runSearch, 300)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [searchQuery])

  const finalizeSelection = async (payload) => {
    setAddressError('')
    try {
      await setSelectedLocation(payload)
      setConfirming(null)
    } catch (err) {
      setAddressError(getUserFacingErrorMessage(err, 'Could not save your location. Please try again.'))
    }
  }

  const chooseAddress = (address) => {
    if (address?.latitude != null && address?.longitude != null) {
      setMapLatitude(Number(address.latitude))
      setMapLongitude(Number(address.longitude))
    }
    setConfirming({
      type: 'address',
      id: address.id,
      label: buildAddressLabel(address),
      latitude: address.latitude,
      longitude: address.longitude,
      address,
    })
  }

  const chooseCoords = (coordsPayload) => {
    if (coordsPayload?.latitude != null && coordsPayload?.longitude != null) {
      setMapLatitude(Number(coordsPayload.latitude))
      setMapLongitude(Number(coordsPayload.longitude))
      if (coordsPayload.label) setMapLabel(coordsPayload.label)
    }
    setConfirming(coordsPayload)
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
        const resolved = await updateMapFromCoords(latitude, longitude)
        chooseCoords({
          type: 'coords',
          latitude,
          longitude,
          label: resolved.label,
          city: resolved.city,
          state: resolved.state,
          postalCode: resolved.postalCode,
        })
        setAskingGps(false)
      },
      () => {
        setAskingGps(false)
        setAddressError('Unable to access GPS. Search for an area or pick a saved address.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const canClose = !mustStayOpen && !isLocationRequired
  const recents = useMemo(() => (Array.isArray(recentLocations) ? recentLocations : []), [recentLocations])

  if (!show || !isAuthenticated) return null

  const title = isLocationRequired
    ? 'Choose your preferred location'
    : 'Update your location'
  const subtitle = 'We use your location to show nearby products, services, and vendors.'

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-wizard-title"
    >
      <div className={`w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border shadow-2xl p-5 sm:p-6 ${isDark ? 'bg-slate-950/95 border-sky-500/20 text-slate-100' : 'bg-white border-sky-200/60 text-foreground'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Location</span>
            </div>
            <h2 id="location-wizard-title" className="text-xl sm:text-2xl font-black tracking-tight">
              {title}
            </h2>
            <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              {subtitle}
            </p>
            {selectedLocationLabel && hasEffectiveLocation && !mustStayOpen && (
              <p className="mt-2 text-xs text-muted-foreground">
                Current: {selectedLocationLabel}
              </p>
            )}
          </div>
          {canClose && (
            <Button type="button" variant="outline" size="sm" onClick={closeSelector}>
              Close
            </Button>
          )}
        </div>

        {confirming ? (
          <div className={`mt-5 rounded-2xl border p-4 ${isDark ? 'border-border bg-muted/40' : 'border-border bg-muted/20'}`}>
            <p className="text-sm font-semibold">Confirm this location</p>
            <p className="mt-2 text-sm text-muted-foreground">{confirming.label}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={isSavingLocation}
                onClick={() => finalizeSelection(confirming)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSavingLocation ? 'Saving…' : 'Select location'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <LocationWizardMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                onLocationChange={handleMapLocationChange}
                height={220}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Drag the pin or tap the map to set your location
              </p>
              {(mapLabel || mapLabelLoading) && (
                <div className={`mt-3 rounded-xl border p-3 ${isDark ? 'border-border bg-muted/40' : 'border-border bg-muted/20'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Map selection</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mapLabelLoading ? 'Loading address…' : mapLabel}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                    disabled={mapLabelLoading || isSavingLocation}
                    onClick={confirmMapSelection}
                  >
                    Use map location
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search address, area, or pincode"
                aria-label="Search for a location"
                className={`w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm ${isDark ? 'bg-muted border-border text-white' : 'bg-white border-border text-foreground'}`}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={askingGps}
                onClick={useCurrentLocation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Navigation className="h-4 w-4 mr-2" aria-hidden="true" />
                {askingGps ? 'Fetching GPS…' : 'Use current location'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/address-book')}
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Manage saved addresses
              </Button>
            </div>

            {addressError && (
              <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {addressError}
              </div>
            )}

            <section className="mt-5" aria-label="Search results">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-2">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                Search results
              </h3>
              <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-border bg-muted/50' : 'border-border bg-muted/30'}`}>
                {searchLoading && <div className="px-2 py-3 text-sm">Searching…</div>}
                {!searchLoading && searchQuery.trim().length >= 3 && searchResults.length === 0 && (
                  <div className="px-2 py-3 text-sm">No matches found.</div>
                )}
                {!searchLoading && searchResults.map((result, index) => (
                  <button
                    type="button"
                    key={`${result.latitude}:${result.longitude}:${index}`}
                    onClick={() => chooseCoords(result)}
                    className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-muted' : 'hover:bg-white'}`}
                  >
                    <p className="text-sm font-semibold">{result.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5" aria-label="Saved addresses">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-2">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Saved addresses
              </h3>
              <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-border bg-muted/50' : 'border-border bg-muted/30'}`}>
                {loadingAddresses && <div className="px-2 py-3 text-sm">Loading saved addresses…</div>}
                {!loadingAddresses && savedAddresses.length === 0 && (
                  <div className="px-2 py-3 text-sm">No saved addresses yet.</div>
                )}
                {!loadingAddresses && savedAddresses.map((address) => (
                  <button
                    type="button"
                    key={address.id}
                    onClick={() => chooseAddress(address)}
                    className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-muted' : 'hover:bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold truncate">{buildAddressLabel(address)}</p>
                      {address.isDefault && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Default</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5" aria-label="Recent locations">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Recent locations
              </h3>
              <div className={`mt-2 rounded-xl border p-2 ${isDark ? 'border-border bg-muted/50' : 'border-border bg-muted/30'}`}>
                {recents.length === 0 && <div className="px-2 py-3 text-sm">No recent locations.</div>}
                {recents.map((recent, index) => (
                  <button
                    type="button"
                    key={`${recent.type}:${recent.id || index}:${recent.latitude || ''}:${recent.longitude || ''}`}
                    onClick={() => chooseCoords(recent)}
                    className={`w-full text-left rounded-lg px-3 py-2 mb-1 last:mb-0 ${isDark ? 'hover:bg-muted' : 'hover:bg-white'}`}
                  >
                    <p className="text-sm font-semibold">{recent.label || `Recent ${index + 1}`}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
