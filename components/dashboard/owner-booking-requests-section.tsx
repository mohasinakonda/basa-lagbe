'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import type { Booking } from '@/types/booking'

const DECLINE_MAX = 500

export type OwnerBookingRequestsSectionProps = {
  bookings: Booking[]
  onRespond: (
    bookingId: string,
    action: 'confirm' | 'decline',
    declineMessage?: string,
  ) => void | Promise<void>
}

function formatPhone(phone: string | null): string | null {
  if (!phone?.trim()) return null
  return phone.trim()
}

export function OwnerBookingRequestsSection({ bookings, onRespond }: OwnerBookingRequestsSectionProps) {
  const pending = bookings.filter((b) => b.status === 'pending_owner')
  const [declineForId, setDeclineForId] = useState<string | null>(null)
  const [declineNote, setDeclineNote] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)

  const openDecline = (bookingId: string) => {
    setDeclineForId(bookingId)
    setDeclineNote('')
  }

  const cancelDecline = () => {
    setDeclineForId(null)
    setDeclineNote('')
  }

  const submitDecline = async (bookingId: string) => {
    const trimmed = declineNote.trim()
    if (!trimmed) return
    setRespondError(null)
    setBusyId(bookingId)
    try {
      await onRespond(bookingId, 'decline', trimmed)
      cancelDecline()
    } catch (e) {
      setRespondError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  const submitConfirm = async (bookingId: string) => {
    setRespondError(null)
    setBusyId(bookingId)
    try {
      await onRespond(bookingId, 'confirm')
    } catch (e) {
      setRespondError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-medium">Booking requests on my listings</h2>
        <p className="text-xs text-(--foreground)/55">
          Only pending requests appear here; once you confirm or decline, they leave this list.
        </p>
      </div>
      <p className="text-sm text-(--foreground)/65">
        Guest contact and address come from their{' '}
        <Link href="/account" className="underline">
          account
        </Link>
        . Email is stored when they send the request.
      </p>
      {respondError ? (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-900 dark:text-red-100">
          {respondError}
        </p>
      ) : null}
      {pending.length === 0 ? (
        <p className="text-sm text-(--foreground)/65">No pending requests.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((booking) => {
            const phone = formatPhone(booking.guestPhoneE164)
            const isDeclining = declineForId === booking.id
            const busy = busyId === booking.id

            return (
              <li
                key={booking.id}
                className="rounded border border-(--foreground)/15 p-3 text-sm space-y-3"
              >
                <div>
                  <p className="font-medium">{booking.listingTitle}</p>
                  {booking.listingAddress?.trim() ? (
                    <p className="mt-0.5 text-xs text-(--foreground)/60">Property: {booking.listingAddress}</p>
                  ) : null}
                </div>

                <div className="rounded border border-(--foreground)/10 bg-(--foreground)/5 px-3 py-2 space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-(--foreground)/55">
                    Guest
                  </p>
                  <p className="font-medium text-(--foreground)">{booking.guestDisplayName}</p>
                  <dl className="grid gap-1 text-xs text-(--foreground)/80 sm:grid-cols-2">
                    <div>
                      <dt className="text-(--foreground)/55">Email</dt>
                      <dd className="font-mono break-all">
                        {booking.guestEmail?.trim() || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-(--foreground)/55">Phone</dt>
                      <dd>{phone || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-(--foreground)/55">Address (guest)</dt>
                      <dd>{booking.guestContactAddress?.trim() || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <p className="text-(--foreground)/75">
                  <span className="text-(--foreground)/55">Dates: </span>
                  {booking.requestedStart} → {booking.requestedEnd}
                </p>
                {booking.message?.trim() ? (
                  <div>
                    <p className="text-xs text-(--foreground)/55">Message from guest</p>
                    <p className="text-(--foreground)/85">{booking.message}</p>
                  </div>
                ) : null}

                {!isDeclining ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded bg-foreground px-3 py-1.5 text-background text-xs hover:opacity-90 disabled:opacity-50"
                      onClick={() => void submitConfirm(booking.id)}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded border border-(--foreground)/25 px-3 py-1.5 text-xs hover:bg-(--foreground)/10 disabled:opacity-50"
                      onClick={() => openDecline(booking.id)}
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs text-(--foreground)/70" htmlFor={`decline-${booking.id}`}>
                      Short note to the guest (why you are declining)
                    </label>
                    <textarea
                      id={`decline-${booking.id}`}
                      rows={3}
                      maxLength={DECLINE_MAX}
                      value={declineNote}
                      onChange={(e) => setDeclineNote(e.target.value)}
                      placeholder="e.g. Those dates overlap with another booking."
                      className="w-full rounded border border-(--foreground)/20 bg-background px-2 py-1.5 text-sm outline-none focus:border-(--foreground)/40"
                    />
                    <p className="text-xs text-(--foreground)/50">
                      {declineNote.trim().length}/{DECLINE_MAX} · required to decline
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !declineNote.trim()}
                        className="rounded bg-foreground px-3 py-1.5 text-background text-xs hover:opacity-90 disabled:opacity-50"
                        onClick={() => void submitDecline(booking.id)}
                      >
                        Send decline
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded border border-(--foreground)/25 px-3 py-1.5 text-xs hover:bg-(--foreground)/10 disabled:opacity-50"
                        onClick={cancelDecline}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
