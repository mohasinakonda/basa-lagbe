'use client'

import { useCallback, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ListingSortSelect } from '@/components/filters/ListingSortSelect'
import { loadMoreListings } from '@/app/actions/listings'
import type { MobileListingFilters } from '@/lib/listings-public-query'
import type { ListingSortMode } from '@/types/filters'
import type { Listing } from '@/types/listing'
import { ListingCard } from './listing-card'

export interface ListingsListProps {
  initialListings: Listing[]
  totalCount: number
  filters: MobileListingFilters
  selectedListingId: string | null
  onSelectListing: (id: string) => void
  className?: string
  sortMode: ListingSortMode
  onSortModeChange: (mode: ListingSortMode) => void
  canSortByDistance: boolean
}

export function ListingsList({
  initialListings,
  totalCount,
  filters,
  selectedListingId,
  onSelectListing,
  className = '',
  sortMode,
  onSortModeChange,
  canSortByDistance,
}: ListingsListProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [total, setTotal] = useState(totalCount)
  const [isLoading, setIsLoading] = useState(false)
  const nextPageRef = useRef(1)
  const loadingRef = useRef(false)
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null)

  const hasMore = listings.length < total

  const loadNextPage = useCallback(() => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setIsLoading(true)

    loadMoreListings(filters, nextPageRef.current)
      .then((result) => {
        setListings((prev) => [...prev, ...result.listings])
        setTotal(result.totalCount)
        nextPageRef.current += 1
      })
      .catch(() => {})
      .finally(() => {
        loadingRef.current = false
        setIsLoading(false)
      })
  }, [hasMore, filters])

  const { ref: sentinelRef } = useInView({
    threshold: 0,
    root: scrollRoot,
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView) loadNextPage()
    },
  })

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
        <span className="text-xs text-muted-foreground">{total} found</span>
      </div>

      <ul
        ref={setScrollRoot}
        className="min-h-0 flex-1 list-none space-y-4 overflow-y-auto px-3 py-4"
        aria-label="Property listings"
      >
        {listings.length === 0 && !isLoading && (
          <li className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            No listings match your search and filters.
          </li>
        )}
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard
              listing={listing}
              selected={selectedListingId === listing.id}
              onSelect={() => onSelectListing(listing.id)}
            />
          </li>
        ))}
        {hasMore && (
          <li className="list-none" aria-hidden>
            <div ref={sentinelRef} className="flex h-12 w-full items-center justify-center">
              {isLoading && (
                <span className="text-xs text-muted-foreground">Loading more…</span>
              )}
            </div>
          </li>
        )}
      </ul>
    </div>
  )
}
