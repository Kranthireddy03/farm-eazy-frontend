import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMapEvents, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DEFAULT_CENTER = { latitude: 17.385, longitude: 78.4867 }

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null)

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current
      if (!marker) return
      const { lat, lng } = marker.getLatLng()
      onPositionChange(lat, lng)
    },
  }), [onPositionChange])

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={markerIcon}
    />
  )
}

function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function RecenterMap({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])
  return null
}

export default function LocationWizardMap({
  latitude,
  longitude,
  onLocationChange,
  activeZones = [],
  height = 240,
}) {
  const lat = Number.isFinite(Number(latitude)) ? Number(latitude) : DEFAULT_CENTER.latitude
  const lng = Number.isFinite(Number(longitude)) ? Number(longitude) : DEFAULT_CENTER.longitude
  const position = [lat, lng]

  const validActiveZones = useMemo(() => {
    if (!Array.isArray(activeZones)) return []
    return activeZones.filter(
      (z) => z && z.latitude != null && z.longitude != null && Number.isFinite(Number(z.latitude)) && Number.isFinite(Number(z.longitude))
    )
  }, [activeZones])

  return (
    <div
      className="rounded-xl overflow-hidden border border-border"
      style={{ height }}
      aria-label="Location map"
    >
      <MapContainer
        center={position}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          crossOrigin="true"
        />

        {/* Render active delivery zones boundary circles */}
        {validActiveZones.map((zone) => {
          const zLat = Number(zone.latitude)
          const zLng = Number(zone.longitude)
          const radiusMeters = Math.max(500, Number(zone.radiusKm || 5) * 1000)
          return (
            <Circle
              key={`zone-circle-${zone.id || `${zLat}-${zLng}`}`}
              center={[zLat, zLng]}
              radius={radiusMeters}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '4, 4',
              }}
            >
              <Tooltip direction="top" opacity={0.9} permanent={false}>
                <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-300">
                  📍 {zone.locationName} ({zone.radiusKm || 5} km radius)
                </span>
              </Tooltip>
            </Circle>
          )
        })}

        <DraggableMarker position={position} onPositionChange={onLocationChange} />
        <MapClickHandler onPositionChange={onLocationChange} />
        <RecenterMap position={position} />
      </MapContainer>
    </div>
  )
}
