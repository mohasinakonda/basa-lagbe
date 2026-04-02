import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { isSupabaseConfigured } from '@/lib/env'
import { listingToInsertPayload, rowToListing, type ListingRow } from '@/lib/listing-mapper'
import type { ListingCategory } from '@/types/listing'

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const minLat = searchParams.get('minLat')
  const maxLat = searchParams.get('maxLat')
  const minLng = searchParams.get('minLng')
  const maxLng = searchParams.get('maxLng')

  const supabase = await createClient()
  let q = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
    const a = Number(minLat)
    const b = Number(maxLat)
    const c = Number(minLng)
    const d = Number(maxLng)
    if (![a, b, c, d].some((n) => Number.isNaN(n))) {
      const loLat = Math.min(a, b)
      const hiLat = Math.max(a, b)
      const loLng = Math.min(c, d)
      const hiLng = Math.max(c, d)
      q = q.gte('lat', loLat).lte('lat', hiLat).gte('lng', loLng).lte('lng', hiLng)
    }
  }

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const listings = (data as ListingRow[]).map(rowToListing)
  return NextResponse.json({ listings })
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
  contact: { phone: string; email: string }
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
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { data: moderation, error: modError } = await supabase
    .from('profiles')
    .select('listing_creation_blocked_until, listing_creation_block_reason')
    .eq('id', user.id)
    .maybeSingle()
  if (!modError && moderation?.listing_creation_blocked_until) {
    const until = new Date(moderation.listing_creation_blocked_until as string).getTime()
    if (until > Date.now()) {
      return NextResponse.json(
        {
          error: 'You cannot create new listings until the restriction on your account ends.',
          listingCreationBlockedUntil: moderation.listing_creation_blocked_until as string,
          listingCreationBlockReason: (moderation.listing_creation_block_reason as string | null) ?? null,
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
    contact: {
      phone: body.contact?.phone?.trim() ?? '',
      email: body.contact?.email?.trim() ?? '',
    },
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
