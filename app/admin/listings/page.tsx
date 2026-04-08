'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import type { Listing } from '@/types/listing'

type Row = {
  listing: Listing
  impressionCount: number
  ownerDisplayName: string | null
}

export default function AdminListingsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [titleQ, setTitleQ] = useState('')
  const [activeTitleQ, setActiveTitleQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 40

  const fetchListings = useCallback(
    async (fromOffset: number, append: boolean) => {
      if (!append) {
        setLoading(true)
        setError(null)
      }
      try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(fromOffset) })
        if (status) params.set('status', status)
        if (activeTitleQ.trim()) params.set('q', activeTitleQ.trim())
        const res = await fetch(`/api/admin/listings?${params}`, { credentials: 'include' })
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          setError(j.error ?? res.statusText)
          if (!append) setRows([])
          return
        }
        const j = (await res.json()) as { listings: Row[]; total: number }
        const batch = j.listings ?? []
        setTotal(j.total ?? 0)
        if (append) {
          setRows((prev) => [...prev, ...batch])
        } else {
          setRows(batch)
        }
        setNextOffset(fromOffset + batch.length)
      } finally {
        if (!append) setLoading(false)
      }
    },
    [activeTitleQ, limit, status]
  )

  useEffect(() => {
    void fetchListings(0, false)
  }, [activeTitleQ, fetchListings, status])

  const delist = async (id: string) => {
    if (!confirm('Archive (delist) this listing?')) return
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'archived' }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      alert(j.error ?? res.statusText)
      return
    }
    await fetchListings(0, false)
  }

  const publish = async (id: string) => {
    if (!confirm('Set status to published?')) return
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'published' }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      alert(j.error ?? res.statusText)
      return
    }
    await fetchListings(0, false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
            }}
            className="rounded border border-border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setActiveTitleQ(titleQ)
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Title contains</span>
            <input
              value={titleQ}
              onChange={(e) => setTitleQ(e.target.value)}
              className="rounded border border-border bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
          >
            Filter
          </button>
        </form>
        <p className="text-sm text-muted-foreground">{total} listing(s)</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void fetchListings(0, false)}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Owner</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Views (page)</th>
                <th className="p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ listing: l, impressionCount, ownerDisplayName }) => (
                <tr key={l.id} className="border-b border-border">
                  <td className="p-2">
                    <span className="font-medium">{l.title}</span>
                    <div className="font-mono text-[10px] text-muted-foreground">{l.id}</div>
                  </td>
                  <td className="p-2 text-xs">{ownerDisplayName ?? l.ownerId ?? '—'}</td>
                  <td className="p-2">{l.publicationStatus ?? '—'}</td>
                  <td className="p-2 tabular-nums">{impressionCount}</td>
                  <td className="p-2 space-x-2 text-xs">
                    <Link href={`/admin/listings/${l.id}`} className="underline">
                      Analytics
                    </Link>
                    {l.publicationStatus === 'published' && (
                      <button type="button" className="underline" onClick={() => delist(l.id)}>
                        Delist
                      </button>
                    )}
                    {l.publicationStatus !== 'published' && (
                      <button type="button" className="underline" onClick={() => publish(l.id)}>
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > nextOffset && (
        <button
          type="button"
          className="text-sm underline"
          onClick={() => void fetchListings(nextOffset, true)}
        >
          Load more
        </button>
      )}
    </div>
  )
}
