import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT)
  )
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
  const status = searchParams.get('status')
  const ownerId = searchParams.get('ownerId')
  const q = (searchParams.get('q') ?? '').trim()

  const { admin } = gate.ctx

  let query = admin
    .from('listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status === 'draft' || status === 'published' || status === 'archived') {
    query = query.eq('status', status)
  }
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  }
  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const { data: rows, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const listings = (rows ?? []) as ListingRow[]
  const ids = listings.map((l) => l.id)
  const impressionCounts: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: impRows, error: impErr } = await admin
      .from('listing_impressions')
      .select('listing_id')
      .in('listing_id', ids)
    if (!impErr && impRows) {
      for (const r of impRows) {
        const lid = r.listing_id as string
        impressionCounts[lid] = (impressionCounts[lid] ?? 0) + 1
      }
    }
  }

  const ownerIds = [...new Set(listings.map((l) => l.owner_id))]
  const displayNames: Record<string, string | null> = {}
  if (ownerIds.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id, display_name').in('id', ownerIds)
    for (const p of profs ?? []) {
      displayNames[p.id as string] = (p.display_name as string) ?? null
    }
  }

  const payload = listings.map((row) => ({
    listing: rowToListing(row),
    impressionCount: impressionCounts[row.id] ?? 0,
    ownerDisplayName: displayNames[row.owner_id] ?? null,
  }))

  return NextResponse.json({ listings: payload, total: count ?? payload.length })
}
