import type { ListingSortMode } from '@/types/filters'
import type { ListingCategory } from '@/types/listing'

/** Matches map default in `components/map/index.tsx` */
export const DEFAULT_MAP_CENTER = {
  lat: 24.744958651896532,
  lng: 90.42272470651706,
} as const

/** Padding in degrees around default center for initial viewport / SSR */
export const DEFAULT_BBOX_PADDING = 0.06

export type HomeLocationFilter = 'all' | 'near_me'

export interface HomeListingSearch {
  q: string
  /** Sort applied after server logic (may differ from requested when invalid) */
  sort: ListingSortMode
  sortRequested: ListingSortMode
  category: ListingCategory | 'all'
  location: HomeLocationFilter
  priceMin?: number
  priceMax?: number
  bedroomsMin?: number
  bathroomsMin?: number
  userLat?: number
  userLng?: number
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  canSortByDistance: boolean
}

const SORT_MODES: ListingSortMode[] = [
  'newest',
  'price_asc',
  'price_desc',
  'distance_asc',
]

function parseNumber(value: string | null): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseSort(value: string | null): ListingSortMode {
  if (value && SORT_MODES.includes(value as ListingSortMode)) {
    return value as ListingSortMode
  }
  return 'newest'
}

function parseCategory(value: string | null): ListingCategory | 'all' {
  if (value === 'family' || value === 'bachelor' || value === 'both') return value
  return 'all'
}

function parseLocation(value: string | null): HomeLocationFilter {
  return value === 'near_me' ? 'near_me' : 'all'
}

export function getDefaultBounds(): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  const { lat, lng } = DEFAULT_MAP_CENTER
  const pad = DEFAULT_BBOX_PADDING
  return {
    minLat: lat - pad,
    maxLat: lat + pad,
    minLng: lng - pad,
    maxLng: lng + pad,
  }
}

/**
 * Parse listing browse params from `URLSearchParams` (or any key/value source).
 * Fills missing bbox with {@link getDefaultBounds}.
 */
export function parseHomeListingSearchParams(
  params: URLSearchParams
): HomeListingSearch {
  const defaults = getDefaultBounds()
  const minLat = parseNumber(params.get('minLat')) ?? defaults.minLat
  const maxLat = parseNumber(params.get('maxLat')) ?? defaults.maxLat
  const minLng = parseNumber(params.get('minLng')) ?? defaults.minLng
  const maxLng = parseNumber(params.get('maxLng')) ?? defaults.maxLng

  const userLat = parseNumber(params.get('userLat'))
  const userLng = parseNumber(params.get('userLng'))
  const hasUserCoords =
    userLat !== undefined &&
    userLng !== undefined &&
    !Number.isNaN(userLat) &&
    !Number.isNaN(userLng)

  const location = parseLocation(params.get('location'))
  const canSortByDistance = location === 'near_me' && hasUserCoords

  const sortRequested = parseSort(params.get('sort'))
  const sort: ListingSortMode =
    sortRequested === 'distance_asc' && !canSortByDistance ? 'newest' : sortRequested

  const qRaw = params.get('q')
  const q = qRaw != null ? qRaw.trim() : ''

  return {
    q,
    sort,
    sortRequested,
    category: parseCategory(params.get('category')),
    location,
    priceMin: parseNumber(params.get('priceMin')),
    priceMax: parseNumber(params.get('priceMax')),
    bedroomsMin: parseNumber(params.get('bedroomsMin')),
    bathroomsMin: parseNumber(params.get('bathroomsMin')),
    userLat: hasUserCoords ? userLat : undefined,
    userLng: hasUserCoords ? userLng : undefined,
    minLat,
    maxLat,
    minLng,
    maxLng,
    canSortByDistance,
  }
}

export function recordToURLSearchParams(
  record: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry))
    } else {
      params.set(key, value)
    }
  }
  return params
}
