import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from '@/lib/env'
import { referrerToSourceTypeServer } from '@/lib/referrer-source'

type RouteContext = { params: Promise<{ id: string }> }

type PostBody = {
  path?: string
  referrer?: string | null
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  const { id: listingId } = await context.params
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listing id' }, { status: 400 })
  }

  let body: PostBody = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const path = typeof body.path === 'string' ? body.path.slice(0, 2000) : null
  const referrer =
    body.referrer === null || body.referrer === undefined
      ? null
      : String(body.referrer).slice(0, 2000)

  const host = request.headers.get('host')
  const sourceType = referrerToSourceTypeServer(referrer, host)

  let viewerId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    viewerId = user?.id ?? null
  } catch {
    viewerId = null
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .maybeSingle()

  if (listingErr) {
    return NextResponse.json({ error: listingErr.message }, { status: 500 })
  }
  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error: insertErr } = await admin.from('listing_impressions').insert({
    listing_id: listingId,
    referrer,
    path,
    viewer_id: viewerId,
    source_type: sourceType,
  })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
