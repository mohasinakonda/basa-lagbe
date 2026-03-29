import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'
type RouteContext = { params: Promise<{ id: string }> }

type PatchBody = Partial<{
  status: 'draft' | 'published' | 'archived'
  expiresAt: string
  title: string
}>

export async function PATCH(request: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing listing id' }, { status: 400 })
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.status != null) {
    if (!['draft', 'published', 'archived'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = body.status
  }
  if (body.expiresAt != null) {
    update.expires_at = body.expiresAt
  }
  if (body.title != null) {
    update.title = body.title.trim()
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { admin } = gate.ctx
  const { data, error } = await admin.from('listings').update(update).eq('id', id).select('*').maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  return NextResponse.json({ listing: rowToListing(data as ListingRow) })
}
