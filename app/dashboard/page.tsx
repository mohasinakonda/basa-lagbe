'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { MyListingsSection } from '@/components/dashboard/my-listings-section'
import { OwnerBookingRequestsSection } from '@/components/dashboard/owner-booking-requests-section'
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
      const [mineListingsResponse, bookingsListResponse] = await Promise.all([
        fetch('/api/listings/mine', { credentials: 'include' }),
        fetch('/api/bookings', { credentials: 'include' }),
      ])
      if (mineListingsResponse.status === 401 || bookingsListResponse.status === 401) {
        setUnauthorized(true)
        return
      }
      if (mineListingsResponse.ok) {
        const listingsPayload = (await mineListingsResponse.json()) as { listings?: Listing[] }
        setMyListings(listingsPayload.listings ?? [])
      }
      if (bookingsListResponse.ok) {
        const bookingsPayload = (await bookingsListResponse.json()) as {
          asGuest?: Booking[]
          asOwner?: Booking[]
        }
        setAsGuest(bookingsPayload.asGuest ?? [])
        setAsOwner(bookingsPayload.asOwner ?? [])
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

  const respondBooking = async (
    bookingId: string,
    action: 'confirm' | 'decline',
    declineMessage?: string,
  ) => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(
        action === 'decline' ? { action: 'decline', declineMessage } : { action: 'confirm' },
      ),
    })
    if (!response.ok) {
      const j = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(j.error ?? 'Could not update booking')
    }
    await load()
  }

  const cancelBooking = async (bookingId: string) => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'cancel' }),
    })
    if (response.ok) await load()
  }

  if (!configured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted-foreground">
          Connect Supabase (see <code className="text-xs text-foreground">.env.example</code>) to use
          the dashboard.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back home
        </Link>
      </main>
    )
  }

  if (loading || unauthorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/account" className="font-medium text-foreground underline-offset-2 hover:underline">
            Account settings
          </Link>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Update your{' '}
        <Link href="/account" className="font-medium text-primary underline-offset-2 hover:underline">
          display name and phone
        </Link>{' '}
        under Account.
      </p>

      <MyListingsSection listings={myListings} onAfterMutation={load} />

      <OwnerBookingRequestsSection bookings={asOwner} onRespond={respondBooking} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My booking requests</h2>
        {asGuest.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have not requested any stays yet.</p>
        ) : (
          <ul className="space-y-2">
            {asGuest.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{booking.listingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.status.replace(/_/g, ' ')} · {booking.requestedStart} →{' '}
                    {booking.requestedEnd}
                  </p>
                  {booking.status === 'declined' && booking.ownerDeclineMessage?.trim() ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="text-muted-foreground/80">Host note: </span>
                      {booking.ownerDeclineMessage.trim()}
                    </p>
                  ) : null}
                </div>
                {booking.status === 'pending_owner' && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => cancelBooking(booking.id)}
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
