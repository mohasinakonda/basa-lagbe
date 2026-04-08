'use client'

import React, { useCallback, useEffect, useState } from 'react'

type Summary = {
  usersTotal: number
  listingsByStatus: { draft: number; published: number; archived: number }
  impressionsLast7Days: number
  impressionsLast30Days: number
  newUsersLast7Days: number
  newUsersLast30Days: number
  impressionsByDayLast7: { date: string; count: number }[]
}

function BarChart({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.count))
  return (
    <div className="flex h-40 items-end gap-1 border-b border-border pb-1">
      {series.map((s) => (
        <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full min-w-0 rounded-t bg-primary/75 transition-[height]"
            style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count > 0 ? 4 : 0 }}
            title={`${s.date}: ${s.count}`}
          />
          <span className="max-w-full truncate text-[10px] text-muted-foreground">
            {s.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/summary', { credentials: 'include' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error ?? res.statusText)
        return
      }
      setSummary((await res.json()) as Summary)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {error}
        {' · '}
        <button type="button" className="underline" onClick={() => void load()}>
          Retry
        </button>
      </p>
    )
  }
  if (!summary) return null

  const cards = [
    { label: 'Users', value: summary.usersTotal },
    { label: 'Published listings', value: summary.listingsByStatus.published },
    { label: 'Draft listings', value: summary.listingsByStatus.draft },
    { label: 'Archived listings', value: summary.listingsByStatus.archived },
    { label: 'Impressions (7d)', value: summary.impressionsLast7Days },
    { label: 'Impressions (30d)', value: summary.impressionsLast30Days },
    { label: 'New users (7d)', value: summary.newUsersLast7Days },
    { label: 'New users (30d)', value: summary.newUsersLast30Days },
  ]

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-medium">Summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-border bg-muted/40 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Impressions last 7 days</h2>
        <p className="mb-4 text-sm text-muted-foreground">Listing views recorded on the map (deduped per session).</p>
        <BarChart series={summary.impressionsByDayLast7} />
      </section>
    </div>
  )
}
