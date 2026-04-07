'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Map } from '@/components/map'
import { ListingDetailSidebar } from '@/components/listing-detail-sidebar/ListingDetailSidebar'
import { FilterBar, type LocationFilter } from '@/components/filters/FilterBar'
import { HomeFiltersSheet } from '@/components/filters/HomeFiltersSheet'
import { ListingsList } from '@/components/listings-list/listings-list'
import { useListings } from '@/lib/listings-context'
import { distanceKm } from '@/lib/geo'
import type { ListingSortMode } from '@/types/filters'
import type { Listing, ListingCategory } from '@/types/listing'

const NEAR_ME_RADIUS_KM = 15
const IMPRESSION_STORAGE_PREFIX = 'basa-lagbe-impression'
const IMPRESSION_COOLDOWN_MS = 30 * 60 * 1000

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
      <div className="flex flex-1 items-center justify-center text-(--foreground)/70">
        Loading…
      </div>
    </main>
  )
}

function HomeContent() {
  const router = useRouter()
  const { listings } = useListings()
  const searchParams = useSearchParams()
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<ListingSortMode>('newest')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

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
    /* Expiry is intentionally evaluated when listings or filters change (not a pure snapshot of time). */
    const nowMs = +new Date()
    let result = listings.filter((l) => new Date(l.expiresAt).getTime() > nowMs)
    result = result.filter(
      (l) => !l.publicationStatus || l.publicationStatus === 'published'
    )

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

  const searchFilteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return filteredListings
    return filteredListings.filter(
      (list) =>
        list.title.toLowerCase().includes(query) ||
        list.address.toLowerCase().includes(query) ||
        list.description.toLowerCase().includes(query)
    )
  }, [filteredListings, searchQuery])

  const canSortByDistance = locationFilter === 'near_me' && userLocation != null

  const effectiveSortMode = useMemo<ListingSortMode>(
    () => (sortMode === 'distance_asc' && !canSortByDistance ? 'newest' : sortMode),
    [sortMode, canSortByDistance]
  )

  const sortedListings = useMemo(() => {
    const arr = [...searchFilteredListings]
    switch (effectiveSortMode) {
      case 'price_asc':
        arr.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        arr.sort((a, b) => b.price - a.price)
        break
      case 'distance_asc':
        if (userLocation) {
          arr.sort(
            (a, b) =>
              distanceKm(userLocation, { lat: a.lat, lng: a.lng }) -
              distanceKm(userLocation, { lat: b.lat, lng: b.lng })
          )
        }
        break
      case 'newest':
      default:
        arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    return arr
  }, [searchFilteredListings, effectiveSortMode, userLocation])

  const listVersion = useMemo(
    () =>
      [
        searchQuery,
        category,
        locationFilter,
        String(priceMin),
        String(priceMax),
        String(bedroomsMin),
        String(bathroomsMin),
        String(showOnlyFavorites),
        sortMode,
        sortedListings.map((l) => l.id).join(','),
      ].join('|'),
    [
      searchQuery,
      category,
      locationFilter,
      priceMin,
      priceMax,
      bedroomsMin,
      bathroomsMin,
      showOnlyFavorites,
      sortMode,
      sortedListings,
    ]
  )

  const selectedListing = useMemo(
    () => (selectedListingId ? listings.find((l) => l.id === selectedListingId) ?? null : null),
    [listings, selectedListingId]
  )

  useEffect(() => {
    if (!supabaseConfigured || !selectedListing?.id) return
    const key = `${IMPRESSION_STORAGE_PREFIX}:${selectedListing.id}`
    const now = Date.now()
    try {
      const last = sessionStorage.getItem(key)
      if (last != null && now - Number(last) < IMPRESSION_COOLDOWN_MS) return
      sessionStorage.setItem(key, String(now))
    } catch {
      /* sessionStorage unavailable */
    }

    const path = `${window.location.pathname}${window.location.search}`
    const referrer = document.referrer || null

    void fetch(`/api/listings/${selectedListing.id}/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ path, referrer }),
    }).catch(() => { })
  }, [selectedListing?.id, supabaseConfigured])

  const handleSelectListing = useCallback(
    (id: string | null) => {
      setLocalSelectedId(id)
      if (id) {
        router.replace(`/?listing=${encodeURIComponent(id)}`, { scroll: false })
      }
    },
    [router]
  )

  const handleCloseSidebar = useCallback(() => {
    setLocalSelectedId(null)
    if (urlListingId) router.replace('/')
  }, [urlListingId, router])

  const clearFilters = useCallback(() => {
    setCategory('all')
    setLocationFilter('all')
    setPriceMin(undefined)
    setPriceMax(undefined)
    setBedroomsMin(undefined)
    setBathroomsMin(undefined)
    setShowOnlyFavorites(false)
    setSearchQuery('')
    setSortMode('newest')
  }, [])

  const handleShare = useCallback((listing: Listing) => {
    const url = `${window.location.origin}?listing=${listing.id}`
    if (navigator.share) {
      navigator
        .share({
          title: listing.title,
          text: `${listing.title} – ${listing.currency} ${listing.price}/mo`,
          url,
        })
        .catch(() => {
          navigator.clipboard?.writeText(url)
        })
    } else {
      navigator.clipboard?.writeText(url)
    }
  }, [])

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const showDistanceOnCards = canSortByDistance

  const filterFormProps = {
    category,
    onCategoryChange: setCategory,
    locationFilter,
    onLocationFilterChange: handleLocationFilterChange,
    userLocation,
    isLocating,
    priceMin,
    priceMax,
    onPriceMinChange: setPriceMin,
    onPriceMaxChange: setPriceMax,
    bedroomsMin,
    onBedroomsMinChange: setBedroomsMin,
    bathroomsMin,
    onBathroomsMinChange: setBathroomsMin,
    showOnlyFavorites,
    onShowOnlyFavoritesChange: setShowOnlyFavorites,
    favoritesCount: favorites.size,
  }

  return (
    <main className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--foreground)]/10 bg-[var(--background)] px-3 py-2 md:hidden">
        <label htmlFor="filter-search-mobile" className="sr-only">
          Search listings
        </label>
        <input
          id="filter-search-mobile"
          type="search"
          placeholder="Search title, address…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2 text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          className="shrink-0 rounded border border-[var(--foreground)]/25 bg-[var(--foreground)]/5 px-3 py-2 text-sm font-medium"
          onClick={() => setFilterSheetOpen(true)}
        >
          Filters
        </button>
        {favorites.size > 0 && (
          <span className="shrink-0 text-xs text-[var(--foreground)]/60" aria-live="polite">
            Saved {favorites.size}
          </span>
        )}
      </div>

      <div className="hidden md:block">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          canSortByDistance={canSortByDistance}
          {...filterFormProps}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative hidden min-h-0 min-w-0 flex-1 md:block">
          <Map
            listings={sortedListings}
            selectedListingId={selectedListingId}
            onSelectListing={handleSelectListing}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 md:hidden">
          <ListingsList
            key={listVersion}
            className="w-full"
            listings={sortedListings}
            selectedListingId={selectedListingId}
            onSelectListing={(id) => handleSelectListing(id)}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            canSortByDistance={canSortByDistance}
            userLocation={userLocation}
            showDistance={showDistanceOnCards}
          />
        </div>

        {selectedListing && (
          <div className="absolute right-0 top-0 z-20 h-full w-full max-w-sm shrink-0 md:relative md:z-0">
            <ListingDetailSidebar
              listing={selectedListing}
              onClose={handleCloseSidebar}
              onShare={handleShare}
              isFavorite={favorites.has(selectedListing.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </div>

      <HomeFiltersSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={() => setFilterSheetOpen(false)}
        onClear={clearFilters}
        {...filterFormProps}
      />
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
