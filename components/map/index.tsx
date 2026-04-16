'use client'

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MAP_CENTER } from '@/lib/home-listing-search-params'
import type { Listing, ListingCategory } from '@/types/listing'

export interface MapViewportBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

function boundsKey(bounds: MapViewportBounds): string {
  return [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]
    .map((coordinate) => coordinate.toFixed(6))
    .join('|')
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

/** Snappy, neutral map style – light land, clear roads, soft water */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a8d4e6' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9fb5' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#eef2f0' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f3' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d0d5dd' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e8eae8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#b8c4ce' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#dde2e6' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8f94' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5c6166' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2d3238' }],
  },
]

function formatPrice(listing: Listing): string {
  const n = listing.price
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

/** Pill colors per category (unselected fill, selected fill). */
const PILL_COLORS: Record<
  ListingCategory,
  { fill: string; stroke: string; selectedFill: string; selectedStroke: string }
> = {
  bachelor: {
    fill: '#fef3c7',
    stroke: '#f59e0b',
    selectedFill: '#d97706',
    selectedStroke: '#b45309',
  },
  family: {
    fill: '#dbeafe',
    stroke: '#3b82f6',
    selectedFill: '#1d4ed8',
    selectedStroke: '#1e40af',
  },
  both: {
    fill: '#d1fae5',
    stroke: '#10b981',
    selectedFill: '#059669',
    selectedStroke: '#047857',
  },
}

/** Build SVG data URL for a pill-shaped marker with price. */
function markerIconUrl(
  label: string,
  selected: boolean,
  category: ListingCategory
): string {
  const colors = PILL_COLORS[category]
  const fill = selected ? colors.selectedFill : colors.fill
  const stroke = selected ? colors.selectedStroke : colors.stroke
  const textColor = selected ? '#ffffff' : '#1f2937'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="32" viewBox="0 0 72 32">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.15"/>
        </filter>
      </defs>
      <rect x="2" y="2" width="68" height="28" rx="14" ry="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="36" y="20" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${textColor}">${escapeXml(label)}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface MapProps {
  listings: Listing[]
  selectedListingId: string | null
  onSelectListing: (id: string | null) => void
  /** Viewport from URL / server — map fits this on load, not the listing set. */
  viewportBounds: MapViewportBounds
  onViewportChange: (bounds: MapViewportBounds) => void
}

export const Map = ({
  listings,
  selectedListingId,
  onSelectListing,
  viewportBounds,
  onViewportChange,
}: MapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const lastEmittedBoundsKeyRef = useRef<string | null>(null)
  const idleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map)
      const bounds = new google.maps.LatLngBounds(
        { lat: viewportBounds.minLat, lng: viewportBounds.minLng },
        { lat: viewportBounds.maxLat, lng: viewportBounds.maxLng }
      )
      map.fitBounds(bounds)
      lastEmittedBoundsKeyRef.current = boundsKey(viewportBounds)
    },
    [viewportBounds]
  )

  const onUnmount = useCallback(() => {
    if (idleDebounceRef.current) {
      clearTimeout(idleDebounceRef.current)
      idleDebounceRef.current = null
    }
    idleListenerRef.current?.remove()
    idleListenerRef.current = null
    setMapInstance(null)
    clustererRef.current?.clearMarkers()
    clustererRef.current = null
    markersRef.current = []
  }, [])

  useEffect(() => {
    if (!mapInstance || !window.google) return

    const map = mapInstance
    const onIdle = () => {
      if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current)
      idleDebounceRef.current = setTimeout(() => {
        const googleBounds = map.getBounds()
        if (!googleBounds) return
        const northEast = googleBounds.getNorthEast()
        const southWest = googleBounds.getSouthWest()
        const next: MapViewportBounds = {
          minLat: southWest.lat(),
          maxLat: northEast.lat(),
          minLng: southWest.lng(),
          maxLng: northEast.lng(),
        }
        const key = boundsKey(next)
        if (key === lastEmittedBoundsKeyRef.current) return
        lastEmittedBoundsKeyRef.current = key
        onViewportChange(next)
      }, 400)
    }
    idleListenerRef.current?.remove()
    idleListenerRef.current = map.addListener('idle', onIdle)
    return () => {
      if (idleDebounceRef.current) {
        clearTimeout(idleDebounceRef.current)
        idleDebounceRef.current = null
      }
      idleListenerRef.current?.remove()
      idleListenerRef.current = null
    }
  }, [mapInstance, onViewportChange])

  /** When the URL viewport changes externally (e.g. back/forward), fit the map without relying on remount. */
  useEffect(() => {
    if (!mapInstance) return
    const key = boundsKey(viewportBounds)
    if (key === lastEmittedBoundsKeyRef.current) return
    const bounds = new google.maps.LatLngBounds(
      { lat: viewportBounds.minLat, lng: viewportBounds.minLng },
      { lat: viewportBounds.maxLat, lng: viewportBounds.maxLng }
    )
    mapInstance.fitBounds(bounds)
    lastEmittedBoundsKeyRef.current = key
  }, [mapInstance, viewportBounds])

  useEffect(() => {
    if (!mapInstance || !window.google) return

    // Clear previous markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
    }
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (listings.length === 0) return

    const map = mapInstance
    const markers: google.maps.Marker[] = listings.map((listing) => {
      const label = `${listing.currency} ${formatPrice(listing)}`
      const marker = new google.maps.Marker({
        position: { lat: listing.lat, lng: listing.lng },

        map,
        icon: {
          url: markerIconUrl(label, selectedListingId === listing.id, listing.category),
          scaledSize: new google.maps.Size(72, 40),
          anchor: new google.maps.Point(36, 32),
        },
        title: listing.title,
        zIndex: selectedListingId === listing.id ? 1000 : 0,
      })
      marker.addListener('click', () => onSelectListing(listing.id))
      return marker
    })

    markersRef.current = markers
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: {
        render: (cluster) => {
          const count = cluster.count
          const position = cluster.position
          const color = '#1e40af'
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="${color}" stroke="#fff" stroke-width="3" opacity="0.95"/>
              <text x="22" y="27" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#fff">${count}</text>
            </svg>
          `
          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
              scaledSize: new google.maps.Size(44, 44),
              anchor: new google.maps.Point(22, 22),
            },
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          })
        },
      },
    })
  }, [mapInstance, listings, selectedListingId, onSelectListing])

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#e5e7eb] text-[#374151]">
        <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to load the map.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#e5e7eb] text-[#374151]">
        <p>Loading map…</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={15}
      center={DEFAULT_MAP_CENTER}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        mapTypeControl: false,
        disableDefaultUI: true,
        keyboardShortcuts: false,
        styles: MAP_STYLES,
        cameraControl: false,

      }}
    />
  )
}
