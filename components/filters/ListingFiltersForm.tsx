'use client'

import { FloatingSelect } from '@/components/UI/floating-select'
import { Tooltip } from '@/components/UI/tooltip'
import type { ListingCategory } from '@/types/listing'
import type { LocationFilter } from '@/types/filters'

export interface ListingFiltersFormProps {
  /** `bar` = single horizontal wrapping row (desktop). `sheet` = stacked (mobile dialog). */
  variant?: 'bar' | 'sheet'
  idPrefix?: string
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

export function ListingFiltersForm({
  variant = 'bar',
  idPrefix = '',
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
}: ListingFiltersFormProps) {
  void userLocation

  const outer =
    variant === 'sheet' ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-3'
  const labelClass =
    variant === 'sheet'
      ? 'text-sm font-medium text-foreground'
      : 'text-sm font-medium text-muted-foreground'
  const fieldClass =
    'rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring'

  const locationBtn = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${active
      ? 'bg-surface font-medium text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-surface/80 hover:text-foreground'
    }`

  return (
    <div className={outer}>
      {onShowOnlyFavoritesChange != null && (
        <div className="flex items-center gap-2">
          <Tooltip content="Show listings you saved on this device" placement="bottom" delay={300}>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyFavorites}
                onChange={(e) => onShowOnlyFavoritesChange(e.target.checked)}
                aria-label="Show only saved listings"
                className="size-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className={labelClass}>
                Saved{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
              </span>
            </label>
          </Tooltip>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={labelClass}>Category</span>
        <FloatingSelect<ListingCategory | 'all'>
          id={`${idPrefix}filter-category`}
          ariaLabel="Filter by category"
          value={category}
          onChange={onCategoryChange}
          options={CATEGORY_OPTIONS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={labelClass}>Location</span>
        <Tooltip
          content="Near me uses your browser location (within ~15 km). Grant permission when asked."
          placement="bottom"
          delay={400}
        >
          <div className="inline-flex rounded-xl border border-border bg-muted/60 p-0.5">
            <button
              type="button"
              onClick={() => onLocationFilterChange('all')}
              className={locationBtn(locationFilter === 'all')}
            >
              All areas
            </button>
            <button
              type="button"
              onClick={() => onLocationFilterChange('near_me')}
              disabled={isLocating}
              className={locationBtn(locationFilter === 'near_me')}
            >
              {isLocating ? 'Getting location…' : 'Near me'}
            </button>
          </div>
        </Tooltip>
      </div>

      {onPriceMinChange != null && onPriceMaxChange != null && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>Price (BDT)</span>
          <input
            type="number"
            placeholder="Min"
            value={priceMin ?? ''}
            onChange={(e) => onPriceMinChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className={`w-24 ${fieldClass}`}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax ?? ''}
            onChange={(e) => onPriceMaxChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className={`w-24 ${fieldClass}`}
            aria-label="Maximum price"
          />
        </div>
      )}

      {onBedroomsMinChange != null && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>Beds</span>
          <FloatingSelect
            id={`${idPrefix}filter-beds`}
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
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>Baths</span>
          <FloatingSelect
            id={`${idPrefix}filter-baths`}
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
