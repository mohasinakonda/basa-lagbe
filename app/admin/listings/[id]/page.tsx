'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

type Analytics = {
  listing: { id: string; title: string; ownerId: string }
  total: number
  days: number
  series: { date: string; count: number }[]
  sourceBreakdown: { sourceType: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
}

function barRow(label: string, count: number, max: number) {
  return (
    <div key={label} className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 truncate text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="h-2 min-w-0 flex-1 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary/80"
          style={{ width: `${(count / max) * 100}%` }}
        />
      </div>
      <span className="w-8 shrink-0 tabular-nums">{count}</span>
    </div>
  )
}

export default function AdminListingAnalyticsPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/listings/${id}/analytics?days=${days}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error ?? res.statusText)
        setData(null)
        return
      }
      setData((await res.json()) as Analytics)
    } finally {
      setLoading(false)
    }
  }, [id, days])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/listings" className="text-sm underline">
          ← Listings
        </Link>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Range</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border border-border bg-transparent px-2 py-1 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}

      {data && !loading && !error && (
        <>
          <div>
            <h2 className="text-xl font-semibold">{data.listing.title}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{data.listing.id}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium tabular-nums">{data.total}</span> views in the last{' '}
              {data.days} days (capped at 5000 events loaded).
            </p>
            <Link
              href={`/admin/users/${data.listing.ownerId}/listings`}
              className="mt-2 inline-block text-sm underline"
            >
              Owner’s listings
            </Link>
          </div>

          <section>
            <h3 className="mb-3 text-lg font-medium">By day</h3>
            <div className="space-y-2">
              {(() => {
                const max = Math.max(1, ...data.series.map((s) => s.count))
                return data.series.map((s) => barRow(s.date, s.count, max))
              })()}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-medium">By source type</h3>
            <div className="space-y-2">
              {(() => {
                const max = Math.max(1, ...data.sourceBreakdown.map((s) => s.count))
                return data.sourceBreakdown.map((s) => barRow(s.sourceType, s.count, max))
              })()}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-medium">Top referrers</h3>
            <div className="space-y-2">
              {(() => {
                const max = Math.max(1, ...data.topReferrers.map((s) => s.count))
                return data.topReferrers.map((s) => barRow(s.referrer, s.count, max))
              })()}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
