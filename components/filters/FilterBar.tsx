'use client'

import React from 'react'
import { FloatingSelect } from '@/components/UI/floating-select'
import { Tooltip } from '@/components/UI/tooltip'
import type { ListingCategory } from '@/types/listing'

export type LocationFilter = 'all' | 'near_me'

export interface FilterBarProps {
  category: ListingCategory | 'all'
  onCategoryChange: (category: ListingCategory | 'all') => void
  locationFilter: LocationFilter
  onLocationFilterChange: (location: LocationFilter) => void
  priceMin?: number
  priceMax?: number
  onPriceMinChange?: (value: number | undefined) => void
  onPriceMaxChange?: (value: number | undefined) => void
  bedroomsMin?: number
  onBedroomsMinChange?: (value: number | undefined) => void
  bathroomsMin?: number
  onBathroomsMinChange?: (value: number | undefined) => void
  showOnlyFavorites?: boolean
  onShowOnlyFavoritesChange?: (value: boolean) => void
  favoritesCount?: number
  userLocation: { lat: number; lng: number } | null
  isLocating?: boolean
}

const CATEGORY_OPTIONS: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'family', label: 'Family' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'both', label: 'Both' },
]

const BEDROOM_OPTIONS = [undefined, 1, 2, 3, 4, 5] as const
const BATHROOM_OPTIONS = [undefined, 1, 2, 3, 4] as const

export function FilterBar({
  category,
  onCategoryChange,
  locationFilter,
  onLocationFilterChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  bedroomsMin,
  onBedroomsMinChange,
  bathroomsMin,
  onBathroomsMinChange,
  showOnlyFavorites = false,
  onShowOnlyFavoritesChange,
  favoritesCount = 0,
  userLocation,
  isLocating = false,
}: FilterBarProps) {
  void userLocation
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--foreground)]/10 bg-[var(--background)] px-4 py-3">
      {onShowOnlyFavoritesChange != null && (
        <div className="flex items-center gap-2">
          <Tooltip content="Show listings you saved on this device" placement="bottom" delay={300}>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyFavorites}
                onChange={(e) => onShowOnlyFavoritesChange(e.target.checked)}
                aria-label="Show only saved listings"
              />
              <span className="text-sm font-medium text-[var(--foreground)]/80">
                Saved{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
              </span>
            </label>
          </Tooltip>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]/80">Category</span>
        <FloatingSelect<ListingCategory | 'all'>
          id="filter-category"
          ariaLabel="Filter by category"
          value={category}
          onChange={onCategoryChange}
          options={CATEGORY_OPTIONS}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]/80">Location</span>
        <Tooltip
          content="Near me uses your browser location (within ~15 km). Grant permission when asked."
          placement="bottom"
          delay={400}
        >
          <div className="flex rounded border border-[var(--foreground)]/20 overflow-hidden">
            <button
              type="button"
              onClick={() => onLocationFilterChange('all')}
              className={`px-3 py-1.5 text-sm ${locationFilter === 'all' ? 'bg-[var(--foreground)]/20' : 'hover:bg-[var(--foreground)]/5'}`}
            >
              All areas
            </button>
            <button
              type="button"
              onClick={() => onLocationFilterChange('near_me')}
              disabled={isLocating}
              className={`px-3 py-1.5 text-sm disabled:opacity-50 ${locationFilter === 'near_me' ? 'bg-[var(--foreground)]/20' : 'hover:bg-[var(--foreground)]/5'}`}
            >
              {isLocating ? 'Getting location…' : 'Near me'}
            </button>
          </div>
        </Tooltip>
      </div>

      {onPriceMinChange != null && onPriceMaxChange != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]/80">Price (BDT)</span>
          <input
            type="number"
            placeholder="Min"
            value={priceMin ?? ''}
            onChange={(e) => onPriceMinChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className="w-24 rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-2 py-1.5 text-sm"
            aria-label="Minimum price"
          />
          <span className="text-[var(--foreground)]/60">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax ?? ''}
            onChange={(e) => onPriceMaxChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className="w-24 rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-2 py-1.5 text-sm"
            aria-label="Maximum price"
          />
        </div>
      )}

      {onBedroomsMinChange != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]/80">Beds</span>
          <FloatingSelect
            id="filter-beds"
            ariaLabel="Minimum bedrooms"
            value={bedroomsMin != null ? String(bedroomsMin) : ''}
            onChange={(v) => onBedroomsMinChange(v === '' ? undefined : Number(v))}
            options={[
              { value: '', label: 'Any' },
              ...BEDROOM_OPTIONS.filter((n) => n !== undefined).map((n) => ({
                value: String(n),
                label: `${n}+`,
              })),
            ]}
          />
        </div>
      )}

      {onBathroomsMinChange != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]/80">Baths</span>
          <FloatingSelect
            id="filter-baths"
            ariaLabel="Minimum bathrooms"
            value={bathroomsMin != null ? String(bathroomsMin) : ''}
            onChange={(v) => onBathroomsMinChange(v === '' ? undefined : Number(v))}
            options={[
              { value: '', label: 'Any' },
              ...BATHROOM_OPTIONS.filter((n) => n !== undefined).map((n) => ({
                value: String(n),
                label: `${n}+`,
              })),
            ]}
          />
        </div>
      )}
    </div>
  )
}
