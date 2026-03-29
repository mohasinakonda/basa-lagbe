'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import type { Booking } from '@/types/booking'
import type { Listing } from '@/types/listing'
export default function DashboardPage() {
  const router = useRouter()
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [asGuest, setAsGuest] = useState<Booking[]>([])
  const [asOwner, setAsOwner] = useState<Booking[]>([])

  const load = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [mineRes, bookRes] = await Promise.all([
        fetch('/api/listings/mine', { credentials: 'include' }),
        fetch('/api/bookings', { credentials: 'include' }),
      ])
      if (mineRes.status === 401 || bookRes.status === 401) {
        setUnauthorized(true)
        return
      }
      if (mineRes.ok) {
        const j = (await mineRes.json()) as { listings?: Listing[] }
        setMyListings(j.listings ?? [])
      }
      if (bookRes.ok) {
        const j = (await bookRes.json()) as { asGuest?: Booking[]; asOwner?: Booking[] }
        setAsGuest(j.asGuest ?? [])
        setAsOwner(j.asOwner ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!configured) return
    if (!loading && unauthorized) {
      router.replace('/auth/login?next=/dashboard')
    }
  }, [configured, loading, unauthorized, router])

  const respondBooking = async (id: string, action: 'confirm' | 'decline') => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    })
    if (res.ok) await load()
  }

  const cancelBooking = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'cancel' }),
    })
    if (res.ok) await load()
  }

  if (!configured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-(--foreground)/80">
          Connect Supabase (see <code className="text-xs">.env.example</code>) to use the dashboard.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back home
        </Link>
      </main>
    )
  }

  if (loading || unauthorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-(--foreground)/70">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap gap-4 text-sm text-(--foreground)/80">
          <Link href="/account" className="hover:underline">
            Account settings
          </Link>
          <Link href="/" className="hover:underline">
            ← Map
          </Link>
        </div>
      </div>

      <p className="text-sm text-(--foreground)/70">
        Update your{' '}
        <Link href="/account" className="underline">
          display name and phone
        </Link>{' '}
        under Account.
      </p>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">My listings</h2>
          <Link
            href="/list-your-house"
            className="text-sm font-medium text-(--foreground)/80 underline"
          >
            New listing
          </Link>
        </div>
        {myListings.length === 0 ? (
          <p className="text-sm text-(--foreground)/65">No listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {myListings.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-(--foreground)/15 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-(--foreground)/60">
                    {l.publicationStatus ?? '—'} · expires{' '}
                    {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Link
                  href={`/dashboard/listings/${l.id}/edit`}
                  className="text-sm underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Booking requests on my listings</h2>
        {asOwner.filter((b) => b.status === 'pending_owner').length === 0 ? (
          <p className="text-sm text-(--foreground)/65">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {asOwner
              .filter((b) => b.status === 'pending_owner')
              .map((b) => (
                <li
                  key={b.id}
                  className="rounded border border-(--foreground)/15 p-3 text-sm space-y-2"
                >
                  <p className="font-medium">{b.listingTitle}</p>
                  <p className="text-(--foreground)/75">
                    {b.guestDisplayName} · {b.requestedStart} → {b.requestedEnd}
                  </p>
                  {b.message && <p className="text-(--foreground)/80">{b.message}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-foreground px-3 py-1.5 text-background text-xs hover:opacity-90"
                      onClick={() => respondBooking(b.id, 'confirm')}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="rounded border border-(--foreground)/25 px-3 py-1.5 text-xs hover:bg-(--foreground)/10"
                      onClick={() => respondBooking(b.id, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">My booking requests</h2>
        {asGuest.length === 0 ? (
          <p className="text-sm text-(--foreground)/65">You have not requested any stays yet.</p>
        ) : (
          <ul className="space-y-2">
            {asGuest.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-(--foreground)/15 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{b.listingTitle}</p>
                  <p className="text-xs text-(--foreground)/60">
                    {b.status.replace(/_/g, ' ')} · {b.requestedStart} → {b.requestedEnd}
                  </p>
                </div>
                {b.status === 'pending_owner' && (
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => cancelBooking(b.id)}
                  >
                    Cancel request
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
