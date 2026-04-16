import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { isSupabaseConfigured } from '@/lib/env'
import { normalizePhoneE164 } from '@/lib/phone'

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

  const { error: ensureError } = await ensureUserProfile(supabase, user)
  if (ensureError) {
    const conflict = ensureError.code === '23505'
    return NextResponse.json(
      {
        error: conflict
          ? 'This phone number is already registered on another account.'
          : ensureError.message,
      },
      { status: conflict ? 409 : 500 }
    )
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

type PatchBody = { displayName?: string; contactAddress?: string; phoneE164?: string }

export async function PATCH(request: Request) {
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

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    body.displayName == null &&
    body.contactAddress === undefined &&
    body.phoneE164 === undefined
  ) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updates: {
    display_name?: string
    contact_address?: string | null
    phone_e164?: string | null
  } = {}
  if (body.displayName != null) updates.display_name = body.displayName.trim()
  if (body.contactAddress !== undefined) {
    const t = body.contactAddress.trim()
    updates.contact_address = t.length > 0 ? t : null
  }
  if (body.phoneE164 !== undefined) {
    const normalized = normalizePhoneE164(body.phoneE164)
    updates.phone_e164 = normalized.length > 0 ? normalized : null
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) {
    const conflict = error.code === '23505'
    return NextResponse.json(
      {
        error: conflict
          ? 'This phone number is already registered on another account.'
          : error.message,
      },
      { status: conflict ? 409 : 500 }
    )
  }

  return NextResponse.json({ profile: data })
}
