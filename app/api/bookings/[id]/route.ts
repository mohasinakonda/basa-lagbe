import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'
import { rowToBooking, type BookingRow } from '@/lib/booking-mapper'

type RouteContext = { params: Promise<{ id: string }> }

type PatchBody = { action: 'confirm' | 'decline' | 'cancel' }

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
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ booking: rowToBooking(data as BookingRow) })
  }

  const status = body.action === 'confirm' ? 'confirmed' : 'declined'
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      owner_responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking: rowToBooking(data as BookingRow) })
}
