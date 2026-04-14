import type { SupabaseClient } from '@supabase/supabase-js'
import { distanceKm } from '@/lib/geo'
import type { HomeListingSearch } from '@/lib/home-listing-search-params'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'
import type { Listing } from '@/types/listing'
import type { ListingSortMode } from '@/types/filters'

const NEAR_ME_RADIUS_KM = 15
const MAX_ROWS = 2000

function sortListingsInMemory(
  rows: Listing[],
  sort: ListingSortMode,
  userLocation: { lat: number; lng: number } | null
): Listing[] {
  const arr = [...rows]
  switch (sort) {
    case 'price_asc':
      arr.sort((listingA, listingB) => listingA.price - listingB.price)
      break
    case 'price_desc':
      arr.sort((listingA, listingB) => listingB.price - listingA.price)
      break
    case 'distance_asc':
      if (userLocation) {
        arr.sort(
          (listingA, listingB) =>
            distanceKm(userLocation, { lat: listingA.lat, lng: listingA.lng }) -
            distanceKm(userLocation, { lat: listingB.lat, lng: listingB.lng })
        )
      } else {
        arr.sort(
          (listingA, listingB) =>
            new Date(listingB.createdAt).getTime() - new Date(listingA.createdAt).getTime()
        )
      }
      break
    case 'newest':
    default:
      arr.sort(
        (listingA, listingB) =>
          new Date(listingB.createdAt).getTime() - new Date(listingA.createdAt).getTime()
      )
      break
  }
  return arr
}

/**
 * Published listings for the home map/list: bbox, filters, optional text search, sort, near-me radius.
 */
export async function fetchPublishedListings(
  supabase: SupabaseClient,
  search: HomeListingSearch
): Promise<Listing[]> {
  const loLat = Math.min(search.minLat, search.maxLat)
  const hiLat = Math.max(search.minLat, search.maxLat)
  const loLng = Math.min(search.minLng, search.maxLng)
  const hiLng = Math.max(search.minLng, search.maxLng)

  const sortForQuery: ListingSortMode = search.sort

  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .gte('lat', loLat)
    .lte('lat', hiLat)
    .gte('lng', loLng)
    .lte('lng', hiLng)

  if (search.category === 'family') {
    query = query.in('category', ['family', 'both'])
  } else if (search.category === 'bachelor') {
    query = query.in('category', ['bachelor', 'both'])
  } else if (search.category === 'both') {
    query = query.eq('category', 'both')
  }

  if (search.priceMin != null) query = query.gte('price', search.priceMin)
  if (search.priceMax != null) query = query.lte('price', search.priceMax)
  if (search.bedroomsMin != null) query = query.gte('bedrooms', search.bedroomsMin)
  if (search.bathroomsMin != null) query = query.gte('bathrooms', search.bathroomsMin)

  const qText = search.q.replace(/,/g, ' ').trim().slice(0, 200)

  if (sortForQuery === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sortForQuery === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.limit(MAX_ROWS)

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  let rows = (data as ListingRow[]).map(rowToListing)

  if (qText.length > 0) {
    const lower = qText.toLowerCase()
    rows = rows.filter(
      (listing) =>
        listing.title.toLowerCase().includes(lower) ||
        listing.address.toLowerCase().includes(lower) ||
        listing.description.toLowerCase().includes(lower)
    )
  }

  if (search.location === 'near_me' && search.userLat != null && search.userLng != null) {
    const origin = { lat: search.userLat, lng: search.userLng }
    rows = rows.filter(
      (listing) => distanceKm(origin, { lat: listing.lat, lng: listing.lng }) <= NEAR_ME_RADIUS_KM
    )
  }

  const userLocation =
    search.userLat != null && search.userLng != null
      ? { lat: search.userLat, lng: search.userLng }
      : null

  rows = sortListingsInMemory(rows, sortForQuery, userLocation)

  return rows
}
