'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Listing } from '@/types/listing'

export type ListingCreateInput = Omit<Listing, 'id' | 'createdAt' | 'contact'> & {
  publicationStatus?: Listing['publicationStatus']
  /** When omitted, the server fills contact from the signed-in user (remote mode only). */
  contact?: Listing['contact']
}

interface ListingsContextValue {
  /** Unused for home browse (listings load via URL + server). Kept for compatibility. */
  listings: Listing[]
  loading: boolean
  usingRemote: boolean
  refreshListings: () => Promise<void>
  addListing: (input: ListingCreateInput) => Promise<void>
}

const ListingsContext = createContext<ListingsContextValue | null>(null)

function useRemoteListings(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  if (!ready) return false
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
}

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const remote = useRemoteListings()

  const refreshListings = useCallback(async () => {
    /* Home listing data is loaded via the server page and `/api/listings`; no global cache to refresh. */
  }, [])

  const addListing = useCallback(
    async (input: ListingCreateInput) => {
      if (remote) {
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            category: input.category,
            lat: input.lat,
            lng: input.lng,
            price: input.price,
            currency: input.currency,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            areaSqFt: input.areaSqFt,
            address: input.address,
            photos: input.photos,
            amenities: input.amenities,
            status: input.publicationStatus ?? 'published',
            expiresAt: input.expiresAt,
          }),
        })
        const json = (await res.json().catch(() => ({}))) as { error?: string; listing?: Listing }
        if (!res.ok) {
          throw new Error(json.error ?? 'Failed to create listing')
        }
        return
      }

      /* No Supabase: listing is not persisted; home browse requires the API. */
      await Promise.resolve()
    },
    [remote]
  )

  const value = useMemo(
    () => ({
      listings: [] as Listing[],
      loading: false,
      usingRemote: remote,
      refreshListings,
      addListing,
    }),
    [remote, refreshListings, addListing]
  )

  return (
    <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>
  )
}

export function useListings() {
  const ctx = useContext(ListingsContext)
  if (!ctx) throw new Error('useListings must be used within ListingsProvider')
  return ctx
}
