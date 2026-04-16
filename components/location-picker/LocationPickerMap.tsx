'use client'

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import React, { useCallback, useRef, useState } from 'react'

const DEFAULT_CENTER = { lat: 24.744958651896532, lng: 90.42272470651706 }

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: '280px',
}

/** Format coordinates as a display address (no Geocoding API required). */
function formatAddress(lat: number, lng: number): string {
  return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
}

export interface LocationPickerMapProps {
  /** Current position; null means not set yet */
  value: { lat: number; lng: number } | null
  /** Called when user sets or changes the position */
  onChange: (lat: number, lng: number, address: string) => void
  /** Optional: show a hint that location is required */
  required?: boolean
}

export function LocationPickerMap({ value, onChange, required }: LocationPickerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })
  const mapRef = useRef<google.maps.Map | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  const position = value ?? DEFAULT_CENTER

  const updatePosition = useCallback(
    (lat: number, lng: number) => {
      onChange(lat, lng, formatAddress(lat, lng))
    },
    [onChange]
  )

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat()
      const lng = e.latLng?.lng()
      if (lat != null && lng != null) updatePosition(lat, lng)
    },
    [updatePosition]
  )

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat()
      const lng = e.latLng?.lng()
      if (lat != null && lng != null) updatePosition(lat, lng)
    },
    [updatePosition]
  )

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        updatePosition(lat, lng)
        mapRef.current?.panTo({ lat, lng })
        mapRef.current?.setZoom(16)
        setIsLocating(false)
      },
      () => {
        setLocError('Could not get your location. Check permissions or try again.')
        setIsLocating(false)
      }
    )
  }, [updatePosition])

  if (!apiKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-border bg-muted/50 text-sm text-muted-foreground">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground">
        Loading map…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          Property location {required ? '*' : ''}
        </span>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          {isLocating ? (
            'Getting location…'
          ) : (
            <>
              <span aria-hidden>📍</span> Get my current location
            </>
          )}
        </button>
      </div>
      {locError && (
        <p className="text-sm text-red-600" role="alert">
          {locError}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Click on the map or drag the marker to set your property location.
      </p>
      <div className="h-64 w-full overflow-hidden rounded-xl border border-border shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={position}
          zoom={value ? 16 : 12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            rotateControl: true,
            disableDefaultUI: false,
            gestureHandling: 'cooperative',
            keyboardShortcuts: false,
            cameraControl: false,


          }}
        >
          <Marker
            position={position}
            draggable
            onDragEnd={onMarkerDragEnd}
            title="Drag to adjust"
          />
        </GoogleMap>
      </div>
    </div>
  )
}
