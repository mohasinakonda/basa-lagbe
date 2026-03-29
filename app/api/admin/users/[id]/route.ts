import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

type RouteContext = { params: Promise<{ id: string }> }

type PatchBody = Partial<{
  listingCreationBlockedUntil: string | null
  listingCreationBlockReason: string | null
  role: 'user' | 'landlord' | 'admin'
}>

export async function PATCH(request: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { id: userId } = await context.params
  if (!userId) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { admin } = gate.ctx

  if (body.role != null && body.role !== 'admin') {
    const { data: targetProfile, error: readErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 })
    }
    if (targetProfile?.role === 'admin') {
      const { count, error: countErr } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
      if (countErr) {
        return NextResponse.json({ error: countErr.message }, { status: 500 })
      }
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
      }
    }
  }

  const update: Record<string, unknown> = {}
  if (body.listingCreationBlockedUntil !== undefined) {
    update.listing_creation_blocked_until = body.listingCreationBlockedUntil
  }
  if (body.listingCreationBlockReason !== undefined) {
    update.listing_creation_block_reason =
      body.listingCreationBlockReason === null || body.listingCreationBlockReason === ''
        ? null
        : String(body.listingCreationBlockReason).slice(0, 2000)
  }
  if (body.role !== undefined) {
    if (!['user', 'landlord', 'admin'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    update.role = body.role
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await admin.from('profiles').update(update).eq('id', userId).select('*').maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: data.id,
      displayName: data.display_name,
      role: data.role,
      listingCreationBlockedUntil: data.listing_creation_blocked_until ?? null,
      listingCreationBlockReason: data.listing_creation_block_reason ?? null,
    },
  })
}
