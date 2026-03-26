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
import { MOCK_LISTINGS } from '@/lib/mock-listings'

export type ListingCreateInput = Omit<Listing, 'id' | 'createdAt'> & {
  publicationStatus?: Listing['publicationStatus']
}

interface ListingsContextValue {
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
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS)
  const [loading, setLoading] = useState(true)
  const [usingRemote, setUsingRemote] = useState(false)
  const remote = useRemoteListings()

  const refreshListings = useCallback(async () => {
    if (!remote) {
      setListings(MOCK_LISTINGS)
      setUsingRemote(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/listings')
      if (!res.ok) throw new Error('listings fetch failed')
      const json = (await res.json()) as { listings?: Listing[] }
      if (json.listings && Array.isArray(json.listings)) {
        setListings(json.listings)
        setUsingRemote(true)
      } else {
        throw new Error('bad payload')
      }
    } catch {
      setListings(MOCK_LISTINGS)
      setUsingRemote(false)
    } finally {
      setLoading(false)
    }
  }, [remote])

  useEffect(() => {
    if (!remote) {
      setListings(MOCK_LISTINGS)
      setUsingRemote(false)
      setLoading(false)
      return
    }
    void refreshListings()
  }, [remote, refreshListings])

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
            contact: input.contact,
            status: input.publicationStatus ?? 'published',
            expiresAt: input.expiresAt,
          }),
        })
        const json = (await res.json().catch(() => ({}))) as { error?: string; listing?: Listing }
        if (!res.ok) {
          throw new Error(json.error ?? 'Failed to create listing')
        }
        if (json.listing) {
          const created = json.listing as Listing
          if (created.publicationStatus === 'published') {
            setListings((prev) => [created, ...prev])
          }
          setUsingRemote(true)
        }
        return
      }

      const newListing: Listing = {
        ...input,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        publicationStatus: input.publicationStatus ?? 'published',
      }
      if (newListing.publicationStatus === 'published') {
        setListings((prev) => [newListing, ...prev])
      }
    },
    [remote]
  )

  const value = useMemo(
    () => ({ listings, loading, usingRemote, refreshListings, addListing }),
    [listings, loading, usingRemote, refreshListings, addListing]
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
