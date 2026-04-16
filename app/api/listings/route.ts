import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { isSupabaseConfigured } from '@/lib/env'
import { normalizePhoneE164 } from '@/lib/phone'
import { listingToInsertPayload, rowToListing, type ListingRow } from '@/lib/listing-mapper'
import { parseHomeListingSearchParams } from '@/lib/home-listing-search-params'
import { fetchPublishedListings } from '@/lib/listings-public-query'
import type { ListingCategory } from '@/types/listing'

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const search = parseHomeListingSearchParams(searchParams)

  try {
    const supabase = await createClient()
    const listings = await fetchPublishedListings(supabase, search)
    return NextResponse.json({ listings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type PostBody = {
  title: string
  description: string
  category: ListingCategory
  lat: number
  lng: number
  price: number
  currency?: string
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  address: string
  photos: string[]
  amenities: string[]
  /** Ignored; contact is taken from the authenticated user and profile. */
  contact?: { phone: string; email: string }
  status?: 'draft' | 'published'
  expiresAt: string
}

export async function POST(request: Request) {
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

  const { error: profileError } = await ensureUserProfile(supabase, user)
  if (profileError) {
    const conflict = profileError.code === '23505'
    return NextResponse.json(
      {
        error: conflict
          ? 'This phone number is already registered on another account.'
          : profileError.message,
      },
      { status: conflict ? 409 : 500 }
    )
  }

  const { data: profileRow, error: profileFetchError } = await supabase
    .from('profiles')
    .select('phone_e164, listing_creation_blocked_until, listing_creation_block_reason')
    .eq('id', user.id)
    .maybeSingle()
  if (profileFetchError) {
    return NextResponse.json({ error: profileFetchError.message }, { status: 500 })
  }

  if (profileRow?.listing_creation_blocked_until) {
    const until = new Date(profileRow.listing_creation_blocked_until as string).getTime()
    if (until > Date.now()) {
      return NextResponse.json(
        {
          error: 'You cannot create new listings until the restriction on your account ends.',
          listingCreationBlockedUntil: profileRow.listing_creation_blocked_until as string,
          listingCreationBlockReason: (profileRow.listing_creation_block_reason as string | null) ?? null,
        },
        { status: 403 }
      )
    }
  }

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = body.status ?? 'published'
  if (!body.title?.trim() || !body.expiresAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const email = user.email?.trim() ?? ''
  const meta = user.user_metadata as Record<string, unknown>
  const phoneFromMeta =
    typeof meta?.phone_e164 === 'string' ? normalizePhoneE164(meta.phone_e164) : ''
  const phone = profileRow?.phone_e164?.trim() || phoneFromMeta || ''

  if (!email) {
    return NextResponse.json({ error: 'Your account has no email address.' }, { status: 400 })
  }

  const payload = listingToInsertPayload({
    title: body.title.trim(),
    description: body.description?.trim() ?? '',
    category: body.category,
    lat: body.lat,
    lng: body.lng,
    price: body.price,
    currency: body.currency ?? 'BDT',
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    areaSqFt: body.areaSqFt,
    address: body.address?.trim() ?? '',
    photos: Array.isArray(body.photos) ? body.photos : [],
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    contact: { phone, email },
    status,
    expiresAt: body.expiresAt,
    ownerId: user.id,
  })

  const { data, error } = await supabase.from('listings').insert(payload).select('*').single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ listing: rowToListing(data as ListingRow) }, { status: 201 })
}
