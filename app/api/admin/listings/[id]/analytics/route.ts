import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

type RouteContext = { params: Promise<{ id: string }> }

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export async function GET(request: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { id: listingId } = await context.params
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listing id' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const days = Math.min(90, Math.max(7, Number(searchParams.get('days') ?? 30) || 30))
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  since.setUTCHours(0, 0, 0, 0)

  const { admin } = gate.ctx

  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('id, title, owner_id')
    .eq('id', listingId)
    .maybeSingle()
  if (listingErr) {
    return NextResponse.json({ error: listingErr.message }, { status: 500 })
  }
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const { data: impressions, error } = await admin
    .from('listing_impressions')
    .select('occurred_at, referrer, path, source_type')
    .eq('listing_id', listingId)
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: true })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = impressions ?? []
  const total = rows.length

  const byDay: Record<string, number> = {}
  for (const r of rows) {
    const k = dayKey(r.occurred_at as string)
    byDay[k] = (byDay[k] ?? 0) + 1
  }
  const series = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  const bySource: Record<string, number> = {}
  for (const r of rows) {
    const s = (r.source_type as string) || 'direct'
    bySource[s] = (bySource[s] ?? 0) + 1
  }
  const sourceBreakdown = Object.entries(bySource).map(([sourceType, count]) => ({
    sourceType,
    count,
  }))

  const referrerCounts: Record<string, number> = {}
  for (const r of rows) {
    const ref = (r.referrer as string) || '(direct / empty)'
    const short = ref.length > 120 ? `${ref.slice(0, 117)}...` : ref
    referrerCounts[short] = (referrerCounts[short] ?? 0) + 1
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([referrer, count]) => ({ referrer, count }))

  return NextResponse.json({
    listing: { id: listing.id, title: listing.title, ownerId: listing.owner_id },
    total,
    days,
    series,
    sourceBreakdown,
    topReferrers,
  })
}
