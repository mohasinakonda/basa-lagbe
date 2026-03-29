import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { id: ownerId } = await context.params
  if (!ownerId) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  }

  const { admin } = gate.ctx
  const { data, error } = await admin
    .from('listings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const listings = (data as ListingRow[]).map(rowToListing)
  return NextResponse.json({ listings })
}
