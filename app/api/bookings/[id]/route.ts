import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'
import { BOOKING_LIST_SELECT, rowToBooking, type BookingRowWithRelations } from '@/lib/booking-mapper'

type RouteContext = { params: Promise<{ id: string }> }

type PatchBody = { action: 'confirm' | 'decline' | 'cancel'; declineMessage?: string }

const DECLINE_MAX = 500

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.action || !['confirm', 'decline', 'cancel'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (body.action === 'cancel') {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled_by_guest' })
      .eq('id', id)
      .select(BOOKING_LIST_SELECT)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ booking: rowToBooking(data as BookingRowWithRelations) })
  }

  const status = body.action === 'confirm' ? 'confirmed' : 'declined'
  const declineMessage = body.declineMessage?.trim() ?? ''

  if (body.action === 'decline') {
    if (!declineMessage) {
      return NextResponse.json(
        { error: 'Add a short note for the guest explaining why you are declining.' },
        { status: 400 },
      )
    }
    if (declineMessage.length > DECLINE_MAX) {
      return NextResponse.json({ error: `Message must be at most ${DECLINE_MAX} characters.` }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      owner_responded_at: new Date().toISOString(),
      owner_decline_message: body.action === 'decline' ? declineMessage : null,
    })
    .eq('id', id)
    .select(BOOKING_LIST_SELECT)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking: rowToBooking(data as BookingRowWithRelations) })
}
