import { Suspense } from 'react'
import { HomePageClient } from '@/components/home/home-page-client'
import {
  parseHomeListingSearchParams,
  recordToURLSearchParams,
} from '@/lib/home-listing-search-params'
import { fetchPublishedListings } from '@/lib/listings-public-query'
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
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    listings = await fetchPublishedListings(supabase, search)
  }
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageClient listings={listings} search={search} />
    </Suspense>
  )
}
