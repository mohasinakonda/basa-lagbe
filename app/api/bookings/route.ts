import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { isSupabaseConfigured } from '@/lib/env'
import { BOOKING_LIST_SELECT, rowToBooking, type BookingRowWithRelations } from '@/lib/booking-mapper'

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

  // RLS allows SELECT when user is guest OR listing owner (policies are OR'd). We must
  // query owner bookings only for listings we own; an unfiltered select would include
  // the user's own guest bookings in the "owner" result set.
  const [
    { data: asGuestRows, error: eg },
    { data: ownedListings, error: el },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select(BOOKING_LIST_SELECT)
      .eq('guest_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('listings').select('id').eq('owner_id', user.id),
  ])

  if (eg || el) {
    return NextResponse.json({ error: eg?.message ?? el?.message }, { status: 500 })
  }

  const ownedIds = ownedListings?.map((l) => l.id) ?? []
  const { data: asOwnerRows, error: eo } =
    ownedIds.length === 0
      ? { data: [] as BookingRowWithRelations[] | null, error: null }
      : await supabase
          .from('bookings')
          .select(BOOKING_LIST_SELECT)
          .in('listing_id', ownedIds)
          .order('created_at', { ascending: false })

  if (eo) {
    return NextResponse.json({ error: eo.message }, { status: 500 })
  }

  const guestBookings = (asGuestRows as BookingRowWithRelations[] | null)?.map(rowToBooking) ?? []
  const ownerBookings = (asOwnerRows as BookingRowWithRelations[] | null)?.map(rowToBooking) ?? []

  return NextResponse.json({ asGuest: guestBookings, asOwner: ownerBookings })
}

type PostBody = {
  listingId: string
  requestedStart: string
  requestedEnd: string
  message?: string
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

  const { error: profileEnsureError } = await ensureUserProfile(supabase, user)
  if (profileEnsureError) {
    return NextResponse.json({ error: profileEnsureError.message }, { status: 500 })
  }

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.listingId || !body.requestedStart || !body.requestedEnd) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile, error: pe } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()
  if (pe || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
  }

  const { data: listing, error: le } = await supabase
    .from('listings')
    .select('id, title, owner_id, status, expires_at')
    .eq('id', body.listingId)
    .single()

  if (le || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const lr = listing as { id: string; title: string; owner_id: string }

  if (lr.owner_id === user.id) {
    return NextResponse.json({ error: 'You cannot book your own listing' }, { status: 400 })
  }

  const insert = {
    listing_id: body.listingId,
    guest_id: user.id,
    guest_display_name: profile.display_name ?? 'Guest',
    guest_email: user.email ?? null,
    listing_title: lr.title,
    requested_start: body.requestedStart,
    requested_end: body.requestedEnd,
    message: body.message?.trim() || null,
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert(insert)
    .select(BOOKING_LIST_SELECT)
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking: rowToBooking(data as BookingRowWithRelations) }, { status: 201 })
}
