import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const listings = (data as ListingRow[]).map(rowToListing)
  return NextResponse.json({ listings })
}
