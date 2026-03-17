'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Map } from '@/components/map'
import { ListingDetailSidebar } from '@/components/listing-detail-sidebar/ListingDetailSidebar'
import { FilterBar, type LocationFilter } from '@/components/filters/FilterBar'
import { useListings } from '@/lib/listings-context'
import { distanceKm } from '@/lib/geo'
import type { Listing, ListingCategory } from '@/types/listing'

const NEAR_ME_RADIUS_KM = 15

function getFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('basa-lagbe-favorites')
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function setFavoritesStorage(ids: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem('basa-lagbe-favorites', JSON.stringify([...ids]))
}

function HomeFallback() {
  return (
    <main className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="flex flex-1 items-center justify-center text-[var(--foreground)]/70">
        Loading…
      </div>
    </main>
  )
}

function HomeContent() {
  const router = useRouter()
  const { listings } = useListings()
  const searchParams = useSearchParams()

  const urlListingId = searchParams.get('listing')
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null)
  const selectedListingId = urlListingId || localSelectedId

  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [bedroomsMin, setBedroomsMin] = useState<number | undefined>(undefined)
  const [bathroomsMin, setBathroomsMin] = useState<number | undefined>(undefined)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(getFavorites)

  useEffect(() => {
    setFavoritesStorage(favorites)
  }, [favorites])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationFilter('near_me')
        setIsLocating(false)
      },
      () => setIsLocating(false)
    )
  }, [])

  const handleLocationFilterChange = useCallback(
    (loc: LocationFilter) => {
      setLocationFilter(loc)
      if (loc === 'near_me' && !userLocation) requestLocation()
    },
    [userLocation, requestLocation]
  )

  const filteredListings = useMemo(() => {
    let result = listings

    if (category !== 'all') {
      result = result.filter((l) => l.category === category || l.category === 'both')
    }

    if (locationFilter === 'near_me' && userLocation) {
      result = result.filter(
        (l) => distanceKm(userLocation, { lat: l.lat, lng: l.lng }) <= NEAR_ME_RADIUS_KM
      )
    }

    if (priceMin != null) result = result.filter((l) => l.price >= priceMin)
    if (priceMax != null) result = result.filter((l) => l.price <= priceMax)
    if (bedroomsMin != null) result = result.filter((l) => l.bedrooms >= bedroomsMin)
    if (bathroomsMin != null) result = result.filter((l) => l.bathrooms >= bathroomsMin)
    if (showOnlyFavorites) result = result.filter((l) => favorites.has(l.id))

    return result
  }, [listings, category, locationFilter, userLocation, priceMin, priceMax, bedroomsMin, bathroomsMin, showOnlyFavorites, favorites])

  const selectedListing = useMemo(
    () => (selectedListingId ? listings.find((l) => l.id === selectedListingId) ?? null : null),
    [listings, selectedListingId]
  )

  const handleSelectListing = useCallback((id: string | null) => {
    setLocalSelectedId(id)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setLocalSelectedId(null)
    if (urlListingId) router.replace('/')
  }, [urlListingId, router])

  const handleShare = useCallback(
    (listing: Listing) => {
      const url = `${window.location.origin}?listing=${listing.id}`
      if (navigator.share) {
        navigator.share({
          title: listing.title,
          text: `${listing.title} – ${listing.currency} ${listing.price}/mo`,
          url,
        }).catch(() => {
          navigator.clipboard?.writeText(url)
        })
      } else {
        navigator.clipboard?.writeText(url)
      }
    },
    []
  )

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <main className="flex h-[calc(100vh-5rem)] flex-col">
      <FilterBar
        category={category}
        onCategoryChange={setCategory}
        locationFilter={locationFilter}
        onLocationFilterChange={handleLocationFilterChange}
        userLocation={userLocation}
        isLocating={isLocating}
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceMinChange={setPriceMin}
        onPriceMaxChange={setPriceMax}
        bedroomsMin={bedroomsMin}
        onBedroomsMinChange={setBedroomsMin}
        bathroomsMin={bathroomsMin}
        onBathroomsMinChange={setBathroomsMin}
        showOnlyFavorites={showOnlyFavorites}
        onShowOnlyFavoritesChange={setShowOnlyFavorites}
        favoritesCount={favorites.size}
      />
      <div className="relative flex flex-1 overflow-hidden">
        {selectedListing && (
          <div className="absolute left-0 top-0 z-10 h-full w-full max-w-sm shrink-0 md:relative md:z-0">
            <ListingDetailSidebar
                listing={selectedListing}
                onClose={handleCloseSidebar}
              onShare={handleShare}
              isFavorite={favorites.has(selectedListing.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
        <div className="relative min-w-0 flex-1">
          <Map
            listings={filteredListings}
            selectedListingId={selectedListingId}
            onSelectListing={handleSelectListing}
          />
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  )
}
