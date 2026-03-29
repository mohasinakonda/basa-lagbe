'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import type { Listing } from '@/types/listing'

export default function AdminUserListingsPage() {
  const params = useParams()
  const userId = typeof params.id === 'string' ? params.id : ''
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/listings`, { credentials: 'include' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error ?? res.statusText)
        return
      }
      const j = (await res.json()) as { listings: Listing[] }
      setListings(j.listings ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/users" className="text-sm underline">
          ← Users
        </Link>
        <h2 className="text-lg font-medium">Listings for user</h2>
        <span className="font-mono text-xs text-(--foreground)/55">{userId}</span>
      </div>

      {loading && <p className="text-sm text-(--foreground)/70">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && listings.length === 0 && (
        <p className="text-sm text-(--foreground)/65">No listings.</p>
      )}

      {!loading && !error && listings.length > 0 && (
        <ul className="space-y-2">
          {listings.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-(--foreground)/15 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-xs text-(--foreground)/60">
                  {l.publicationStatus ?? '—'} · {l.currency} {l.price}
                </p>
              </div>
              <Link href={`/admin/listings/${l.id}`} className="text-xs underline">
                Analytics
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
