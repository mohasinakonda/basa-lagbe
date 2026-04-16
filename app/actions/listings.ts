'use server'

import { isSupabaseConfigured } from '@/lib/env'
import {
  fetchPaginatedListings,
  type MobileListingFilters,
  type PaginatedListingsResult,
} from '@/lib/listings-public-query'
import { createClient } from '@/lib/supabase/server'

export async function loadMoreListings(
  filters: MobileListingFilters,
  page: number
): Promise<PaginatedListingsResult> {
  if (!isSupabaseConfigured()) {
    return { listings: [], totalCount: 0 }
  }
  const supabase = await createClient()
  return fetchPaginatedListings(supabase, filters, page)
}
