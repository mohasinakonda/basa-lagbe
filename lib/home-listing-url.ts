import { getDefaultBounds } from '@/lib/home-listing-search-params'

export function formatCoord(value: number): string {
  return value.toFixed(6)
}

/** Merge updates into a copy of `current`. Use `null` to remove a key. */
export function patchHomeListingParams(
  current: URLSearchParams,
  patch: Record<string, string | number | boolean | null | undefined>
): URLSearchParams {
  const next = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
  }
  return next
}

export function defaultListingSearchParams(): URLSearchParams {
  const bounds = getDefaultBounds()
  const params = new URLSearchParams()
  params.set('minLat', formatCoord(bounds.minLat))
  params.set('maxLat', formatCoord(bounds.maxLat))
  params.set('minLng', formatCoord(bounds.minLng))
  params.set('maxLng', formatCoord(bounds.maxLng))
  return params
}
