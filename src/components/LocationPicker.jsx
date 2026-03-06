/**
 * LocationPicker Component
 * 
 * A food delivery app-style location picker with:
 * - Interactive map with draggable pin
 * - Manual address entry option
 * - Current location detection
 * - Address search/autocomplete
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Draggable marker component
function DraggableMarker({ position, setPosition, onDragEnd }) {
  const markerRef = useRef(null)
  
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current
      if (marker != null) {
        const newPos = marker.getLatLng()
        setPosition([newPos.lat, newPos.lng])
        if (onDragEnd) onDragEnd(newPos.lat, newPos.lng)
      }
    },
  }), [setPosition, onDragEnd])

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  )
}

// Map click handler
function MapClickHandler({ setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
      if (onLocationSelect) onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to recenter map
function RecenterMap({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])
  return null
}

function LocationPicker({ onLocationSelect, onAddressSubmit, initialAddress = null }) {
  // Default position (India - Hyderabad)
  const defaultPosition = [17.3850, 78.4867]
  
  const [position, setPosition] = useState(defaultPosition)
  const [locationMode, setLocationMode] = useState('map') // 'map' or 'manual'
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [addressFromMap, setAddressFromMap] = useState('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef(null)
  
  const [manualAddress, setManualAddress] = useState({
    fullName: initialAddress?.fullName || '',
    phoneNumber: initialAddress?.phoneNumber || '',
    email: initialAddress?.email || '',
    addressLine1: initialAddress?.addressLine1 || '',
    addressLine2: initialAddress?.addressLine2 || '',
    landmark: initialAddress?.landmark || '',
    addressType: initialAddress?.addressType || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postalCode: initialAddress?.postalCode || '',
    latitude: null,
    longitude: null
  })

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    setIsLoadingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      
      if (data && data.address) {
        const addr = data.address
        setAddressFromMap(data.display_name || '')
        
        // Auto-fill address fields from map selection
        setManualAddress(prev => ({
          ...prev,
          addressLine1: `${addr.road || addr.neighbourhood || addr.suburb || ''}`.trim(),
          addressLine2: addr.hamlet || addr.village || addr.town || '',
          city: addr.city || addr.town || addr.district || addr.county || '',
          state: addr.state || '',
          postalCode: addr.postcode || '',
          latitude: lat,
          longitude: lng
        }))
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    setIsLocating(true)
    setLocationError('')
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
        reverseGeocode(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('An unknown error occurred.')
        }
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Search for location
  const searchLocation = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    
    setIsSearching(true)
    setShowDropdown(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&countrycodes=in`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Auto-search with debounce when typing
  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search - wait 400ms after user stops typing
    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(value)
      }, 400)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  // Select search result
  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setPosition([lat, lng])
    reverseGeocode(lat, lng)
    setSearchResults([])
    setSearchQuery(result.display_name.split(',')[0]) // Keep first part of address in search
    setShowDropdown(false)
  }

  // Handle marker drag end
  const handleMarkerDragEnd = (lat, lng) => {
    reverseGeocode(lat, lng)
  }

  // Handle map location selection
  const handleLocationSelect = (lat, lng) => {
    reverseGeocode(lat, lng)
  }

  // Handle manual address change
  const handleManualAddressChange = (e) => {
    const { name, value } = e.target
    setManualAddress(prev => ({ ...prev, [name]: value }))
  }

  // Submit address
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const addressData = {
      ...manualAddress,
      latitude: position[0],
      longitude: position[1]
    }
    
    if (onAddressSubmit) {
      onAddressSubmit(addressData)
    }
  }

  // Use location from map button
  const confirmMapLocation = () => {
    if (addressFromMap) {
      setLocationMode('manual')
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-700">
        <button
          type="button"
          onClick={() => setLocationMode('map')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            locationMode === 'map'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <span>📍</span> Select on Map
        </button>
        <button
          type="button"
          onClick={() => setLocationMode('manual')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            locationMode === 'manual'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <span>✍️</span> Enter Manually
        </button>
      </div>

      {/* Map Mode */}
      {locationMode === 'map' && (
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search for a location... (type at least 3 characters)"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => searchLocation()}
                disabled={isSearching}
                className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {isSearching ? '...' : '🔍'}
              </button>
            </div>
            
            {/* Search Results Dropdown - Shows multiple locations */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                <div className="sticky top-0 bg-slate-600 px-3 py-2 text-xs text-slate-300 font-medium border-b border-slate-500">
                  📍 {searchResults.length} location{searchResults.length > 1 ? 's' : ''} found - Select one
                </div>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-orange-600/30 border-b border-slate-600/50 last:border-0 transition-colors"
                  >
                    <div className="font-medium text-white">{result.display_name.split(',')[0]}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{result.display_name}</div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Close dropdown when clicking outside */}
            {showDropdown && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)}
              />
            )}
          </div>

          {/* Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLocating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detecting location...
              </>
            ) : (
              <>
                <span>📍</span> Use Current Location
              </>
            )}
          </button>

          {locationError && (
            <div className="bg-red-900/30 border border-red-600/30 text-red-300 px-4 py-2 rounded-lg text-sm">
              {locationError}
            </div>
          )}

          {/* Map Container */}
          <div className="rounded-lg overflow-hidden border border-slate-600" style={{ height: '300px' }}>
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker 
                position={position} 
                setPosition={setPosition} 
                onDragEnd={handleMarkerDragEnd}
              />
              <MapClickHandler 
                setPosition={setPosition} 
                onLocationSelect={handleLocationSelect}
              />
              <RecenterMap position={position} />
            </MapContainer>
          </div>

          {/* Instruction */}
          <p className="text-center text-sm text-slate-400">
            🎯 Drag the pin or tap on map to set your delivery location
          </p>

          {/* Selected Address Preview */}
          {addressFromMap && (
            <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 font-semibold mb-1">Selected Location:</p>
                  <p className="text-sm text-green-300">
                    {isLoadingAddress ? 'Loading address...' : addressFromMap}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={confirmMapLocation}
                className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
              >
                ✓ Confirm & Add Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Mode */}
      {locationMode === 'manual' && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Show map preview if location was selected */}
          {manualAddress.latitude && manualAddress.longitude && (
            <div className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Location from map</p>
                <p className="text-sm text-green-400 truncate">{addressFromMap || 'Location selected'}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationMode('map')}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Change
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name (as per ID proof) *"
              value={manualAddress.fullName}
              onChange={handleManualAddressChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address *"
              value={manualAddress.email}
              onChange={handleManualAddressChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
          </div>

          <input
            type="tel"
            name="phoneNumber"
            placeholder="10-digit Mobile Number *"
            pattern="[0-9]{10}"
            value={manualAddress.phoneNumber}
            onChange={handleManualAddressChange}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            required
          />

          <input
            type="text"
            name="addressLine1"
            placeholder="Flat, House no., Building, Company, Apartment *"
            value={manualAddress.addressLine1}
            onChange={handleManualAddressChange}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            required
          />

          <input
            type="text"
            name="addressLine2"
            placeholder="Area, Street, Sector, Village (optional)"
            value={manualAddress.addressLine2}
            onChange={handleManualAddressChange}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />

          <input
            type="text"
            name="landmark"
            placeholder="Landmark (e.g. near temple, school)"
            value={manualAddress.landmark}
            onChange={handleManualAddressChange}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />

          <select
            name="addressType"
            value={manualAddress.addressType}
            onChange={handleManualAddressChange}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            required
          >
            <option value="">Select Address Type *</option>
            <option value="Home">🏠 Home</option>
            <option value="Work">🏢 Work</option>
            <option value="Other">📍 Other</option>
          </select>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="city"
              placeholder="City / Town *"
              value={manualAddress.city}
              onChange={handleManualAddressChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State *"
              value={manualAddress.state}
              onChange={handleManualAddressChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="postalCode"
              placeholder="PIN Code *"
              pattern="[0-9]{6}"
              value={manualAddress.postalCode}
              onChange={handleManualAddressChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition shadow-lg"
          >
            ✓ Save Address
          </button>
        </form>
      )}
    </div>
  )
}

export default LocationPicker
