import { Suspense } from 'react'
import { HomePageClient } from '@/components/home/home-page-client'
import {
  parseHomeListingSearchParams,
  recordToURLSearchParams,
} from '@/lib/home-listing-search-params'
import { fetchPublishedListings, fetchPaginatedListings } from '@/lib/listings-public-query'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'
import type { Listing } from '@/types/listing'

function HomeFallback() {
  return (
    <main className="flex h-[calc(100vh-4.25rem)] flex-col">
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading…
      </div>
    </main>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = await searchParams
  const params = recordToURLSearchParams(resolved)
  const search = parseHomeListingSearchParams(params)
  let listings: Listing[] = []
  let initialMobileListings: Listing[] = []
  let mobileTotalCount = 0

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [desktopListings, mobileResult] = await Promise.all([
      fetchPublishedListings(supabase, search),
      fetchPaginatedListings(supabase, {
        q: search.q,
        sort: search.sort,
        category: search.category,
        priceMin: search.priceMin,
        priceMax: search.priceMax,
        bedroomsMin: search.bedroomsMin,
        bathroomsMin: search.bathroomsMin,
      }, 0),
    ])
    listings = desktopListings
    initialMobileListings = mobileResult.listings
    mobileTotalCount = mobileResult.totalCount
  }

  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageClient
        listings={listings}
        search={search}
        initialMobileListings={initialMobileListings}
        mobileTotalCount={mobileTotalCount}
      />
    </Suspense>
  )
}
