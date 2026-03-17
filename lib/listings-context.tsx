'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Listing } from '@/types/listing'
import { MOCK_LISTINGS } from '@/lib/mock-listings'

interface ListingsContextValue {
  listings: Listing[]
  addListing: (listing: Omit<Listing, 'id' | 'createdAt'>) => void
}

const ListingsContext = createContext<ListingsContextValue | null>(null)

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS)

  const addListing = useCallback((input: Omit<Listing, 'id' | 'createdAt'>) => {
    const newListing: Listing = {
      ...input,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setListings((prev) => [newListing, ...prev])
  }, [])

  const value = useMemo(() => ({ listings, addListing }), [listings, addListing])
  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  )
}

export function useListings() {
  const ctx = useContext(ListingsContext)
  if (!ctx) throw new Error('useListings must be used within ListingsProvider')
  return ctx
}
