'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Map, type MapViewportBounds } from '@/components/map'
import { ListingDetailSidebar } from '@/components/listing-detail-sidebar/ListingDetailSidebar'
import { FilterBar, type LocationFilter } from '@/components/filters/FilterBar'
import { HomeFiltersSheet } from '@/components/filters/HomeFiltersSheet'
import { ListingsList } from '@/components/listings-list/listings-list'
import { HomeSearchField } from '@/components/home/home-search-field'
import type { HomeListingSearch } from '@/lib/home-listing-search-params'
import {
  defaultListingSearchParams,
  formatCoord,
  patchHomeListingParams,
} from '@/lib/home-listing-url'
import type { ListingSortMode } from '@/types/filters'
import type { Listing, ListingCategory } from '@/types/listing'

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

export interface HomePageClientProps {
  listings: Listing[]
  search: HomeListingSearch
}

export function HomePageClient({ listings, search }: HomePageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const basePath = pathname ?? '/'
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  const urlListingId = searchParams.get('listing')
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null)
  const selectedListingId = urlListingId || localSelectedId

  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(getFavorites)

  const [fetchedListing, setFetchedListing] = useState<Listing | null>(null)

  useEffect(() => {
    setFavoritesStorage(favorites)
  }, [favorites])

  useEffect(() => {
    const fromList = selectedListingId
      ? listings.find((listing) => listing.id === selectedListingId)
      : undefined
    if (!selectedListingId || fromList) return
    const requestedId = selectedListingId
    let cancelled = false
    void fetch(`/api/listings/${requestedId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { listing?: Listing } | null) => {
        if (cancelled || !payload?.listing || payload.listing.id !== requestedId) return
        setFetchedListing(payload.listing)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [selectedListingId, listings])

  const selectedListing = useMemo(() => {
    if (!selectedListingId) return null
    const fromList = listings.find((listing) => listing.id === selectedListingId) ?? null
    if (fromList) return fromList
    if (fetchedListing?.id === selectedListingId) return fetchedListing
    return null
  }, [listings, selectedListingId, fetchedListing])

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
    }).catch(() => {})
  }, [selectedListing?.id, supabaseConfigured])

  const replaceParams = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>) => {
      const next = patchHomeListingParams(new URLSearchParams(searchParams.toString()), patch)
      router.replace(`${basePath}?${next.toString()}`, { scroll: false })
    },
    [basePath, router, searchParams]
  )

  const commitSearchQuery = useCallback(
    (query: string) => {
      replaceParams({ q: query.length > 0 ? query : null })
    },
    [replaceParams]
  )

  const handleViewportChange = useCallback(
    (bounds: MapViewportBounds) => {
      replaceParams({
        minLat: formatCoord(bounds.minLat),
        maxLat: formatCoord(bounds.maxLat),
        minLng: formatCoord(bounds.minLng),
        maxLng: formatCoord(bounds.maxLng),
      })
    },
    [replaceParams]
  )

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        replaceParams({
          location: 'near_me',
          userLat: formatCoord(position.coords.latitude),
          userLng: formatCoord(position.coords.longitude),
        })
        setIsLocating(false)
      },
      () => setIsLocating(false)
    )
  }, [replaceParams])

  const handleLocationFilterChange = useCallback(
    (locationFilter: LocationFilter) => {
      if (locationFilter === 'all') {
        replaceParams({ location: null, userLat: null, userLng: null })
        return
      }
      if (search.userLat != null && search.userLng != null) {
        replaceParams({ location: 'near_me' })
        return
      }
      requestLocation()
    },
    [replaceParams, requestLocation, search.userLat, search.userLng]
  )

  const handleCategoryChange = useCallback(
    (category: ListingCategory | 'all') => {
      replaceParams({ category: category === 'all' ? null : category })
    },
    [replaceParams]
  )

  const handleSortModeChange = useCallback(
    (mode: ListingSortMode) => {
      replaceParams({ sort: mode === 'newest' ? null : mode })
    },
    [replaceParams]
  )

  const handleSelectListing = useCallback(
    (listingId: string | null) => {
      setLocalSelectedId(listingId)
      if (listingId) {
        replaceParams({ listing: listingId })
      }
    },
    [replaceParams]
  )

  const handleCloseSidebar = useCallback(() => {
    setLocalSelectedId(null)
    if (urlListingId) replaceParams({ listing: null })
  }, [urlListingId, replaceParams])

  const clearFilters = useCallback(() => {
    const next = defaultListingSearchParams()
    const keepListing = searchParams.get('listing')
    if (keepListing) next.set('listing', keepListing)
    router.replace(`${basePath}?${next.toString()}`, { scroll: false })
  }, [basePath, router, searchParams])

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

  const handleToggleFavorite = useCallback((listingId: string) => {
    setFavorites((previous) => {
      const next = new Set(previous)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }, [])

  const viewportBounds: MapViewportBounds = useMemo(
    () => ({
      minLat: search.minLat,
      maxLat: search.maxLat,
      minLng: search.minLng,
      maxLng: search.maxLng,
    }),
    [search.minLat, search.maxLat, search.minLng, search.maxLng]
  )

  const locationFilter: LocationFilter = search.location === 'near_me' ? 'near_me' : 'all'
  const userLocationForList =
    search.userLat != null && search.userLng != null
      ? { lat: search.userLat, lng: search.userLng }
      : null

  const listVersion = useMemo(() => searchParams.toString(), [searchParams])

  const filterFormProps = {
    category: search.category,
    onCategoryChange: handleCategoryChange,
    locationFilter,
    onLocationFilterChange: handleLocationFilterChange,
    userLocation: userLocationForList,
    isLocating,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    onPriceMinChange: (value: number | undefined) => replaceParams({ priceMin: value ?? null }),
    onPriceMaxChange: (value: number | undefined) => replaceParams({ priceMax: value ?? null }),
    bedroomsMin: search.bedroomsMin,
    onBedroomsMinChange: (value: number | undefined) =>
      replaceParams({ bedroomsMin: value ?? null }),
    bathroomsMin: search.bathroomsMin,
    onBathroomsMinChange: (value: number | undefined) =>
      replaceParams({ bathroomsMin: value ?? null }),
  }

  const searchInputClassName =
    'h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <main className="flex h-[calc(100vh-4.25rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5 shadow-[inset_0_-1px_0_rgb(0_0_0/0.04)] md:hidden">
        <label htmlFor="filter-search-mobile" className="sr-only">
          Search listings
        </label>
        <HomeSearchField
          id="filter-search-mobile"
          className={searchInputClassName}
          initialQuery={search.q}
          onCommit={commitSearchQuery}
        />
        <button
          type="button"
          className="h-10 shrink-0 rounded-full border border-border bg-muted/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          onClick={() => setFilterSheetOpen(true)}
        >
          Filters
        </button>
      </div>

      <div className="hidden md:block">
        <FilterBar
          searchQuery={search.q}
          onSearchChange={commitSearchQuery}
          sortMode={search.sortRequested}
          onSortModeChange={handleSortModeChange}
          canSortByDistance={search.canSortByDistance}
          {...filterFormProps}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative hidden min-h-0 min-w-0 flex-1 md:block">
          <Map
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={handleSelectListing}
            viewportBounds={viewportBounds}
            onViewportChange={handleViewportChange}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 md:hidden">
          <ListingsList
            key={listVersion}
            className="w-full"
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={(listingId) => handleSelectListing(listingId)}
            sortMode={search.sortRequested}
            onSortModeChange={handleSortModeChange}
            canSortByDistance={search.canSortByDistance}
            userLocation={userLocationForList}
            showDistance={search.canSortByDistance}
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
