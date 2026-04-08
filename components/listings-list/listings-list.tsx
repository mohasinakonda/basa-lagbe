'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ListingSortSelect } from '@/components/filters/ListingSortSelect'
import { distanceKm } from '@/lib/geo'
import type { ListingSortMode } from '@/types/filters'
import type { Listing } from '@/types/listing'

const PAGE_SIZE = 10

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/600'

export interface ListingsListProps {
  listings: Listing[]
  selectedListingId: string | null
  onSelectListing: (id: string) => void
  className?: string
  sortMode: ListingSortMode
  onSortModeChange: (mode: ListingSortMode) => void
  canSortByDistance: boolean
  userLocation: { lat: number; lng: number } | null
  showDistance: boolean
}

function formatPriceLine(listing: Listing): string {
  return `${listing.currency} ${listing.price.toLocaleString()}/mo`
}

function ListingCard({
  listing,
  selected,
  onSelect,
  userLocation,
  showDistance,
}: {
  listing: Listing
  selected: boolean
  onSelect: () => void
  userLocation: { lat: number; lng: number } | null
  showDistance: boolean
}) {
  const photos = listing.photos.length > 0 ? listing.photos : [PLACEHOLDER]
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dotIndex, setDotIndex] = useState(0)

  const dist =
    showDistance && userLocation
      ? distanceKm(userLocation, { lat: listing.lat, lng: listing.lng })
      : null

  const onGalleryScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth || 1
    const i = Math.min(Math.round(el.scrollLeft / w), photos.length - 1)
    setDotIndex(i)
  }, [photos.length])

  const goPhoto = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    el.scrollBy({ left: dir * w, behavior: 'smooth' })
  }, [])

  const mapsUrl = `https://www.google.com/maps?q=${listing.lat},${listing.lng}`

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover ${
        selected ? 'border-primary/45 ring-2 ring-primary/25' : 'border-border'
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <div
          ref={scrollRef}
          onScroll={onGalleryScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carousel"
        >
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- remote listing photos
            <img
              key={`${listing.id}-${i}`}
              src={src}
              alt=""
              className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              draggable={false}
            />
          ))}
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-medium text-foreground shadow-md backdrop-blur-sm transition hover:bg-white"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation()
                goPhoto(-1)
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-medium text-foreground shadow-md backdrop-blur-sm transition hover:bg-white"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation()
                goPhoto(1)
              }}
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === dotIndex ? 'bg-white' : 'bg-white/50'}`}
                  aria-hidden
                />
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="w-full px-4 pb-3 pt-3 text-left"
        onClick={onSelect}
        aria-label={`View ${listing.title}`}
      >
        <p className="line-clamp-1 text-[15px] font-medium text-foreground">{listing.title}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {formatPriceLine(listing)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {listing.bedrooms} bed · {listing.bathrooms} bath
          {dist != null && <span> · ~{dist.toFixed(1)} km away</span>}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{listing.address.trim()}</p>
      </button>

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-foreground underline-offset-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Directions
        </a>
        <button
          type="button"
          className="text-xs font-semibold text-foreground underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          View details
        </button>
      </div>
    </article>
  )
}

export function ListingsList({
  listings,
  selectedListingId,
  onSelectListing,
  className = '',
  sortMode,
  onSortModeChange,
  canSortByDistance,
  userLocation,
  showDistance,
}: ListingsListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null)

  const { ref: sentinelRef } = useInView({
    threshold: 0,
    root: scrollRoot,
    rootMargin: '80px',
    onChange: (inView) => {
      if (!inView) return
      setVisibleCount((c) => {
        if (c >= listings.length) return c
        return Math.min(c + PAGE_SIZE, listings.length)
      })
    },
  })

  const slice = listings.slice(0, visibleCount)

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Sort</span>
        <ListingSortSelect
          id="listings-sort-mobile"
          className="min-w-0 flex-1"
          value={sortMode}
          onChange={onSortModeChange}
          canSortByDistance={canSortByDistance}
        />
        <span className="text-xs text-muted-foreground">{listings.length} found</span>
      </div>

      <ul
        ref={setScrollRoot}
        className="min-h-0 flex-1 list-none space-y-4 overflow-y-auto px-3 py-4"
        aria-label="Property listings"
      >
        {slice.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            No listings match your search and filters.
          </li>
        )}
        {slice.map((listing) => (
          <li key={listing.id}>
            <ListingCard
              listing={listing}
              selected={selectedListingId === listing.id}
              onSelect={() => onSelectListing(listing.id)}
              userLocation={userLocation}
              showDistance={showDistance}
            />
          </li>
        ))}
        {listings.length > 0 && visibleCount < listings.length && (
          <li className="list-none" aria-hidden>
            <div ref={sentinelRef} className="h-3 w-full" />
          </li>
        )}
      </ul>
    </div>
  )
}
