import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

function startIso(daysAgo: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { admin } = gate.ctx
  const since7 = startIso(7)
  const since30 = startIso(30)

  const [
    usersRes,
    listingsDraft,
    listingsPublished,
    listingsArchived,
    impressions7,
    impressions30,
    signups7,
    signups30,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    admin
      .from('listing_impressions')
      .select('*', { count: 'exact', head: true })
      .gte('occurred_at', since7),
    admin
      .from('listing_impressions')
      .select('*', { count: 'exact', head: true })
      .gte('occurred_at', since30),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since7),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since30),
  ])

  const errs = [
    usersRes.error,
    listingsDraft.error,
    listingsPublished.error,
    listingsArchived.error,
    impressions7.error,
    impressions30.error,
    signups7.error,
    signups30.error,
  ].filter(Boolean)
  if (errs.length) {
    return NextResponse.json({ error: errs[0]!.message }, { status: 500 })
  }

  const { data: impSeriesRows, error: impSeriesErr } = await gate.ctx.admin
    .from('listing_impressions')
    .select('occurred_at')
    .gte('occurred_at', since7)
    .limit(8000)

  const byDay: Record<string, number> = {}
  if (!impSeriesErr && impSeriesRows) {
    for (const r of impSeriesRows) {
      const d = (r.occurred_at as string).slice(0, 10)
      byDay[d] = (byDay[d] ?? 0) + 1
    }
  }
  const impressionsByDayLast7 = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - (6 - i))
    d.setUTCHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    return { date: key, count: byDay[key] ?? 0 }
  })

  return NextResponse.json({
    usersTotal: usersRes.count ?? 0,
    listingsByStatus: {
      draft: listingsDraft.count ?? 0,
      published: listingsPublished.count ?? 0,
      archived: listingsArchived.count ?? 0,
    },
    impressionsLast7Days: impressions7.count ?? 0,
    impressionsLast30Days: impressions30.count ?? 0,
    newUsersLast7Days: signups7.count ?? 0,
    newUsersLast30Days: signups30.count ?? 0,
    impressionsByDayLast7,
  })
}
