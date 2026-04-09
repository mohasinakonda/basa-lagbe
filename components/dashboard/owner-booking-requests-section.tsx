'use client'

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
        <h2 className="text-lg font-semibold text-foreground">Booking requests on my listings</h2>
        <p className="text-xs text-muted-foreground">
          Only pending requests appear here; once you confirm or decline, they leave this list.
        </p>
      </div>

      {respondError ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-900 dark:text-red-100">
          {respondError}
        </p>
      ) : null}
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending requests.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((booking) => {
            const phone = formatPhone(booking.guestPhoneE164)
            const isDeclining = declineForId === booking.id
            const busy = busyId === booking.id

            return (
              <li
                key={booking.id}
                className="space-y-3 rounded-xl border border-border bg-surface p-3 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{booking.listingTitle}</p>
                  {booking.listingAddress?.trim() ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Property: {booking.listingAddress}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Guest
                  </p>
                  <p className="font-medium text-foreground">{booking.guestDisplayName}</p>
                  <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground/90">Email</dt>
                      <dd className="break-all font-mono text-foreground">
                        {booking.guestEmail?.trim() || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground/90">Phone</dt>
                      <dd className="text-foreground">{phone || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground/90">Address (guest)</dt>
                      <dd className="text-foreground">{booking.guestContactAddress?.trim() || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <p className="text-muted-foreground">
                  <span className="text-muted-foreground/90">Dates: </span>
                  {booking.requestedStart} → {booking.requestedEnd}
                </p>
                {booking.message?.trim() ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Message from guest</p>
                    <p className="text-foreground">{booking.message}</p>
                  </div>
                ) : null}

                {!isDeclining ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
                      onClick={() => void submitConfirm(booking.id)}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                      onClick={() => openDecline(booking.id)}
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs text-muted-foreground" htmlFor={`decline-${booking.id}`}>
                      Short note to the guest (why you are declining)
                    </label>
                    <textarea
                      id={`decline-${booking.id}`}
                      rows={3}
                      maxLength={DECLINE_MAX}
                      value={declineNote}
                      onChange={(e) => setDeclineNote(e.target.value)}
                      placeholder="e.g. Those dates overlap with another booking."
                      className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      {declineNote.trim().length}/{DECLINE_MAX} · required to decline
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !declineNote.trim()}
                        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
                        onClick={() => void submitDecline(booking.id)}
                      >
                        Send decline
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
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
